const cron = require('node-cron');
const axios = require('axios');
const _ = require('lodash');
const WebSocketServer = require('ws');
const logger = require('../config/logger');
const { apiConfig } = require('../config/zerodha');
const Zerodha = require('../brokers/zerodha/Zerodha');
const { getUserByEmail } = require('../services/user.service');
const { getSettingByUserId } = require('../services/setting.service');
const { createInstruments, deleteAllInstrument } = require('../services/instrument.service');
const {
  isMarketOpen,
  isTradeConfigurationOpen,
  getNiftyFutureSymbol,
  getBankNiftyFutureSymbol,
  getCurrentDateTime,
} = require('../utils/utils');
const { User } = require('../models/singleton');
const {
  symbolRateService,
  miscService,
  expiryDateService,
  optionChainService,
  zerodhaService,
  optionScriptService,
  settingService,
} = require('../services');
const { symbolTypes } = require('../config/optionScript');
const Instruments = require('../brokers/zerodha/Instruments');
const { tradingTypes } = require('../config/setting');
const config = require('../config/config');

// Creating a new websocket server
const wss = new WebSocketServer.Server({ port: config.wsport || 8080 });
let ws = null;
const sessionHook = () => {
  logger.info('User logged out!!!');
};

const checkHealth = () =>
  new Promise((resolve) => {
    axios
      .get('http://localhost:3000/v1/misc/ping')
      .then((response) => {
        const responseData = response.data;
        resolve(true);
      })
      .catch((error) => {
        logger.info(`Error: ${error.message}`);
        resolve(true);
      });
  });

const herokuKeepAliveCall = async () => {
  try {
    const isSuccess = await checkHealth();
    logger.info(`health check :: ${isSuccess}`);
  } catch (error) {
    logger.info('Error Heroku KeepAlive Call');
  }
};

const initNiftyOptionChain = () =>
  new Promise((resolve) => {
    const user = User.getUser();
    const { setting } = user;
    // Initialization
    if (_.isEqual(setting.tradingType, tradingTypes.NEAR_RANGE)) {
      logger.info(`Trading Type :: ${setting.tradingType}`);
      if (isMarketOpen()) {
        // need to remove
        logger.info(`Market open!`);
        if (isTradeConfigurationOpen()) {
          // need to remove
          logger.info(`is Trade Configuration Open!`);
          miscService.getOptionChainData(symbolTypes.NIFTY).then((nseOptionChainBankNiftyData) => {
            expiryDateService.updateExpiryDatesForSymbol(symbolTypes.NIFTY, nseOptionChainBankNiftyData);
          });
        }
        // const currentBankNiftyInstrumentsSymbol = Instruments.getCurrentInstrumentsSymbol(symbolTypes.BANKNIFTY);
        const optionScriptTradingSymbols = [];
        optionScriptService
          .getOptionScriptByUserId(user.info._id)
          .then(async (optionScripts) => {
            if (optionScripts) {
              optionScripts.forEach((optionScript) => {
                if (_.isEqual(optionScript.name, symbolTypes.NIFTY)) {
                  optionScriptTradingSymbols.push(`${optionScript.exchange}:${optionScript.tradingsymbol}`);
                }
              });
            }
            const niftyFutureSymbol = getNiftyFutureSymbol();
            const tradingSymbols = optionScriptTradingSymbols.concat([niftyFutureSymbol]);
            logger.info(`tradingSymbols :: ${tradingSymbols}`);
            zerodhaService.getZerodhaData(tradingSymbols).then((zerodhaNiftyData) => {
              if (zerodhaNiftyData && zerodhaNiftyData.data) {
                const { data } = zerodhaNiftyData;
                zerodhaService.runNearRangeBuyForToday(data, symbolTypes.NIFTY);
              }
            });
          })
          .catch((error) => {
            logger.info(error);
          });
      }
    } else if (_.isEqual(setting.tradingType, tradingTypes.NORMAL)) {
      logger.info(`Trading Type :: ${setting.tradingType}`);
    } else {
      logger.info(`Trading Type :: ${setting.tradingType}`);
    }

    if (isMarketOpen()) {
      // need to remove
      const optionScriptTradingSymbols = [];
      optionScriptService
        .getOptionScriptByUserId(user.info._id)
        .then(async (optionScripts) => {
          if (optionScripts) {
            optionScripts.forEach((optionScript) => {
              if (_.isEqual(optionScript.name, symbolTypes.NIFTY)) {
                optionScriptTradingSymbols.push(`${optionScript.exchange}:${optionScript.tradingsymbol}`);
              }
            });
          }
          zerodhaService.getZerodhaData(optionScriptTradingSymbols).then((zerodhaNiftyData) => {
            if (zerodhaNiftyData && zerodhaNiftyData.data) {
              const { data } = zerodhaNiftyData;
              if (ws) {
                const dataMesage = {
                  author: 'sathi',
                  message: data,
                };
                ws.send(JSON.stringify(dataMesage));
              }
              zerodhaService.runToBuyForToday(data, symbolTypes.NIFTY);
              zerodhaService.runToSellForToday(data, symbolTypes.NIFTY);
            }
          });
        })
        .catch((error) => {
          logger.info(error);
        });
    } else {
      const optionScriptTradingSymbols = [];
      optionScriptService
        .getOptionScriptByUserId(user.info._id)
        .then(async (optionScripts) => {
          if (optionScripts) {
            optionScripts.forEach((optionScript) => {
              if (_.isEqual(optionScript.name, symbolTypes.NIFTY)) {
                optionScriptTradingSymbols.push(`${optionScript.exchange}:${optionScript.tradingsymbol}`);
              }
            });
          }
          zerodhaService.getZerodhaData(optionScriptTradingSymbols).then((zerodhaNiftyData) => {
            if (zerodhaNiftyData && zerodhaNiftyData.data) {
              const { data } = zerodhaNiftyData;
              zerodhaService.runToSellAllForToday(data, symbolTypes.NIFTY);
            }
          });
        })
        .catch((error) => {
          logger.info(error);
        });
    }
    // miscService.getOptionChainData(symbolTypes.NIFTY).then((nseOptionChainNiftyData) => {
    //   // logger.info(`nseOptionChainNiftyData :${nseOptionChainNiftyData}`);
    //   if (nseOptionChainNiftyData && nseOptionChainNiftyData.filtered && nseOptionChainNiftyData.filtered.data) {
    //     symbolRateService.updateSymbolCurrentPrice(symbolTypes.NIFTY, true, nseOptionChainNiftyData);
    //     const filteredOptionChainNiftyData = optionChainService.getFilterdOptionChainData(
    //       nseOptionChainNiftyData.filtered.data
    //     );
    //     if (filteredOptionChainNiftyData) {
    //       if (isCurrentTimeMatch(9, 20)) {
    //         optionChainService.runPreStartForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
    //       }
    //       optionChainService.runBuyForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
    //       optionChainService.runSellForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
    //       if (isCurrentTimeMatch(3, 25)) {
    //         optionChainService.runSellAllForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
    //       }
    //       // Initialization
    //       if (isCurrentTimeMatch(9, 13)) {
    //         expiryDateService.updateExpiryDatesForSymbol(symbolTypes.NIFTY, nseOptionChainNiftyData);
    //         optionChainService.runNearRangeBuyForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
    //       }
    //     }
    //   }
    //   resolve({});
    // });
    resolve({});
  });

const initBankNiftyOptionChain = () =>
  new Promise((resolve) => {
    const user = User.getUser();
    const { setting } = user;
    // Initialization
    if (_.isEqual(setting.tradingType, tradingTypes.NEAR_RANGE)) {
      logger.info(`Trading Type :: ${setting.tradingType}`);
      if (isMarketOpen()) {
        // need to remove
        logger.info(`Market open!`);
        if (isTradeConfigurationOpen()) {
          // need to remove
          logger.info(`is Trade Configuration Open!`);
          miscService.getOptionChainData(symbolTypes.BANKNIFTY).then((nseOptionChainBankNiftyData) => {
            expiryDateService.updateExpiryDatesForSymbol(symbolTypes.BANKNIFTY, nseOptionChainBankNiftyData);
          });
        }
        // const currentBankNiftyInstrumentsSymbol = Instruments.getCurrentInstrumentsSymbol(symbolTypes.BANKNIFTY);
        const optionScriptTradingSymbols = [];
        optionScriptService
          .getOptionScriptByUserId(user.info._id)
          .then(async (optionScripts) => {
            if (optionScripts) {
              optionScripts.forEach((optionScript) => {
                if (_.isEqual(optionScript.name, symbolTypes.BANKNIFTY)) {
                  optionScriptTradingSymbols.push(`${optionScript.exchange}:${optionScript.tradingsymbol}`);
                }
              });
            }
            const bankNiftyFutureSymbol = getBankNiftyFutureSymbol();
            const tradingSymbols = optionScriptTradingSymbols.concat([bankNiftyFutureSymbol]);
            logger.info(`tradingSymbols :: ${tradingSymbols}`);
            zerodhaService.getZerodhaData(tradingSymbols).then((zerodhaBankNiftyData) => {
              if (zerodhaBankNiftyData && zerodhaBankNiftyData.data) {
                const { data } = zerodhaBankNiftyData;
                zerodhaService.runNearRangeBuyForToday(data, symbolTypes.BANKNIFTY);
              }
            });
          })
          .catch((error) => {
            logger.info(error);
          });
      }
    } else if (_.isEqual(setting.tradingType, tradingTypes.NORMAL)) {
      logger.info(`Trading Type :: ${setting.tradingType}`);
    } else {
      logger.info(`Trading Type :: ${setting.tradingType}`);
    }

    if (isMarketOpen()) {
      // need to remove
      const optionScriptTradingSymbols = [];
      const currentExpiryDateInstruments = Instruments.getInstrumentsForExpiryDate(setting.expiryDate);
      currentExpiryDateInstruments.forEach((currentExpiryDateInstrument) => {
        optionScriptTradingSymbols.push(
          `${currentExpiryDateInstrument.exchange}:${currentExpiryDateInstrument.tradingsymbol}`
        );
      });
      logger.info(`instrument list ::`);
      logger.info(`${optionScriptTradingSymbols}`);

      optionScriptService
        .getOptionScriptByUserId(user.info._id)
        .then(async (optionScripts) => {
          // if (optionScripts) {
          //   optionScripts.forEach((optionScript) => {
          //     if (_.isEqual(optionScript.name, symbolTypes.BANKNIFTY)) {
          //       optionScriptTradingSymbols.push(`${optionScript.exchange}:${optionScript.tradingsymbol}`);
          //     }
          //   });
          // }
          zerodhaService.getZerodhaData(optionScriptTradingSymbols).then((zerodhaBankNiftyData) => {
            if (zerodhaBankNiftyData && zerodhaBankNiftyData.data) {
              const { data } = zerodhaBankNiftyData;
              const message = {
                optionScripts,
                data,
              };
              if (ws) {
                const dataMesage = {
                  author: 'sathi',
                  message,
                };
                ws.send(JSON.stringify(dataMesage));
              }
              zerodhaService.runToBuyForToday(data, symbolTypes.BANKNIFTY);
              zerodhaService.runToSellForToday(data, symbolTypes.BANKNIFTY);
            }
          });
        })
        .catch((error) => {
          logger.info(error);
        });
    } else {
      const optionScriptTradingSymbols = [];
      optionScriptService
        .getOptionScriptByUserId(user.info._id)
        .then(async (optionScripts) => {
          if (optionScripts) {
            optionScripts.forEach((optionScript) => {
              if (_.isEqual(optionScript.name, symbolTypes.BANKNIFTY)) {
                optionScriptTradingSymbols.push(`${optionScript.exchange}:${optionScript.tradingsymbol}`);
              }
            });
          }
          zerodhaService.getZerodhaData(optionScriptTradingSymbols).then((zerodhaBankNiftyData) => {
            if (zerodhaBankNiftyData && zerodhaBankNiftyData.data) {
              const { data } = zerodhaBankNiftyData;
              zerodhaService.runToSellAllForToday(data, symbolTypes.BANKNIFTY);
            }
          });
        })
        .catch((error) => {
          logger.info(error);
        });
    }

    // miscService.getOptionChainData(symbolTypes.BANKNIFTY).then((nseOptionChainBankNiftyData) => {
    //   // logger.info(`nseOptionChainBankNiftyData :${nseOptionChainBankNiftyData}`);
    //   if (nseOptionChainBankNiftyData && nseOptionChainBankNiftyData.filtered && nseOptionChainBankNiftyData.filtered.data) {
    //     symbolRateService.updateSymbolCurrentPrice(symbolTypes.BANKNIFTY, true, nseOptionChainBankNiftyData);
    //     const filteredOptionChainBankNiftyData = optionChainService.getFilterdOptionChainData(
    //       nseOptionChainBankNiftyData.filtered.data
    //     );
    //     if (filteredOptionChainBankNiftyData) {
    //       if (isCurrentTimeMatch(9, 20)) {
    //         optionChainService.runPreStartForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
    //       }
    //       optionChainService.runBuyForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
    //       optionChainService.runSellForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
    //       if (isCurrentTimeMatch(3, 25)) {
    //         optionChainService.runSellAllForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
    //       }
    //       // Initialization
    //       if (isCurrentTimeMatch(9, 15)) {
    //         // expiryDateService.updateExpiryDatesForSymbol(symbolTypes.BANKNIFTY, nseOptionChainBankNiftyData);
    //         optionChainService.runNearRangeBuyForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
    //       }
    //     }
    //   }
    // });
    resolve({});
  });

/**
 * Starts All Cron Tasks
 */
const start2SecCronTasks = () => {
  cron.schedule('*/2 * * * * *', async () => {
    logger.info('----------------------------------');
    getCurrentDateTime();
    logger.info('running a task every 3 seconds');
    Promise.all([initBankNiftyOptionChain()]) // initNiftyOptionChain(), initBankNiftyOptionChain()
      .then(() => {
        // do something with the responses
        logger.info('OptionChain Executed for All users.');
      })
      .catch((error) => {
        // handle error
        logger.info(error);
      });
  });
};

const start15MinutesCronTasks = () => {
  cron.schedule('*/1 * * * *', () => {
    logger.info('running a task every 15 minute');
    herokuKeepAliveCall();
  });
};

const start1SecCronTasks = () => {
  cron.schedule('*/1 * * * * *', () => {
    logger.info('running a task every minute');
    const bankNiftyFutureSymbol = getBankNiftyFutureSymbol();
    const niftyFutureSymbol = getNiftyFutureSymbol();
    getNiftyFutureSymbol();
    zerodhaService.getZerodhaData([bankNiftyFutureSymbol, niftyFutureSymbol]).then((zerodhaData) => {
      if (zerodhaData && zerodhaData.data) {
        logger.info(`---`);
        const bankNiftyData = zerodhaData.data[bankNiftyFutureSymbol];
        symbolRateService.updateSymbolCurrentPrice(symbolTypes.BANKNIFTY, true, bankNiftyData);

        const niftyData = zerodhaData.data[niftyFutureSymbol];
        symbolRateService.updateSymbolCurrentPrice(symbolTypes.NIFTY, true, niftyData);

        logger.info('######################################################');
        logger.info(`# ${bankNiftyFutureSymbol}  Price :: ${bankNiftyData.last_price}`);
        logger.info(`# ${niftyFutureSymbol}  Price :: ${niftyData.last_price}`);
        logger.info('######################################################');
      }
    });
  });
};

const startCronTasks = () => {
  const userEmail = apiConfig.email;
  getUserByEmail(userEmail)
    .then((user) => {
      if (user.blacklisted) {
        return;
      }
      User.setUserInfo(user);
      getSettingByUserId(user._id)
        .then((setting) => {
          User.setUserSetting(setting);
          logger.info(setting);
          const kc = Zerodha.getKiteConnect();
          kc.setSessionExpiryHook(sessionHook);
          if (_.isEmpty(setting.zerodhaAccessToken)) {
            logger.info(`zerodhaRequestToken :: ${setting.zerodhaRequestToken}`);
            Zerodha.login(setting.zerodhaRequestToken).then((data) => {
              logger.info(data.success);
              const isSuccessStatus = data.success;
              const kcAccessToken = data.accessToken;
              if (isSuccessStatus && kcAccessToken) {
                const settingBody = {
                  zerodhaAccessToken: kcAccessToken,
                };
                settingService.updateSettingById(setting._id, settingBody);
                Zerodha.setAccessToken(kcAccessToken);
                deleteAllInstrument()
                  .then(() => {
                    logger.info(`Deleted all instruments`);
                    Zerodha.loadInstruments()
                      .then((instruments) => {
                        const currentExpiryDateInstruments = Instruments.getInstrumentsForExpiryDate(setting.expiryDate);
                        Instruments.setCurrentInstruments(currentExpiryDateInstruments);
                        logger.info(`currentExpiryDateInstruments count :: ${currentExpiryDateInstruments.length}`);
                        start2SecCronTasks();
                        start15MinutesCronTasks();
                        start1SecCronTasks();
                        createInstruments(currentExpiryDateInstruments)
                          .then((docs) => {
                            logger.info(`instruments count :: ${docs.length}`);
                          })
                          .catch((error) => {
                            logger.info(error);
                          });
                      })
                      .catch((error) => {
                        logger.info(error);
                      });
                  })
                  .catch((error) => {
                    logger.info(error);
                  });
              }
            });
          } else {
            const kcAccessToken = setting.zerodhaAccessToken;
            logger.info(`zerodhaAccessToken :: ${kcAccessToken}`);
            kc.setAccessToken(kcAccessToken);
            Zerodha.setAccessToken(kcAccessToken);
            deleteAllInstrument()
              .then(() => {
                logger.info(`Deleted all instruments`);
                Zerodha.loadInstruments()
                  .then((instruments) => {
                    const currentExpiryDateInstruments = Instruments.getInstrumentsForExpiryDate(setting.expiryDate);
                    Instruments.setCurrentInstruments(currentExpiryDateInstruments);
                    logger.info(`currentExpiryDateInstruments count :: ${currentExpiryDateInstruments.length}`);
                    start2SecCronTasks();
                    start15MinutesCronTasks();
                    start1SecCronTasks();
                    createInstruments(currentExpiryDateInstruments)
                      .then((docs) => {
                        logger.info(`instruments count :: ${docs.length}`);
                      })
                      .catch((error) => {
                        logger.info(error);
                      });
                  })
                  .catch((error) => {
                    logger.info(error);
                  });
              })
              .catch((error) => {
                logger.info(error);
              });
          }
        })
        .catch((error) => {
          // handle error
          logger.info(error);
        });
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

// Creating connection using websocket
wss.on('connection', (websocket) => {
  ws = websocket;
  logger.info('new client connected');
  // sending message
  websocket.on('message', (data) => {
    logger.info(`Client has sent us: ${data}`);
  });
  // handling what to do when clients disconnects from server
  websocket.on('close', () => {
    logger.info('the client has connected');
  });
  // handling client connection error
  // eslint-disable-next-line no-param-reassign
  websocket.onerror = function () {
    logger.info('Some Error occurred');
  };
});
logger.info('The WebSocket server is running on port 8080');

module.exports = {
  startCronTasks,
};
