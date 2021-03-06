const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
const logger = require('../config/logger');
const { zerodhaURLs } = require('../config/zerodha');
const Zerodha = require('../brokers/zerodha/Zerodha');
const ZerodhaOrderManager = require('../brokers/zerodha/ZerodhaOrderManager');
const Instruments = require('../brokers/zerodha/Instruments');
const { User } = require('../models/singleton');
const { getOptionScriptByUserId, createOptionScript } = require('./optionScript.service');
const {
  getTransactionsByUserTradeDatePreStart,
  getLastTransactionByUserTradeDateBuy,
  getLastTransactionByActiveUserTradeDateSell,
  createTransaction,
  getLastTransactionByUserTradeDateTradeSymbolBuy,
  getTransactionsByActiveTradeDateUser,
  updateTransactionById,
} = require('./transaction.service');

const { OptionScript } = require('../models/index');
const { optionTypes, symbolTypes } = require('../config/optionScript');
const { accountTypes } = require('../config/setting');

const { apiConfig } = require('../config/zerodha');
const { getUserByEmail } = require('./user.service');
const { getSettingByUserId, updateSettingById } = require('./setting.service');
const { createInstruments, deleteAllInstrument } = require('./instrument.service');
const { getBankNiftyFutureSymbol, getNiftyFutureSymbol } = require('../utils/utils');

const getZerodhaData = (tradingSymbols) =>
  new Promise((resolve) => {
    const apiKey = Zerodha.getAPIKey();
    const accessToken = Zerodha.getAccessToken();
    logger.info(`apiKey :: ${apiKey}`);
    logger.info(`accessToken :: ${accessToken}`);
    let symbols = '';
    if (tradingSymbols) {
      tradingSymbols.forEach((tradingSymbol) => {
        symbols = `${symbols}&i=${tradingSymbol}`;
      });
      const zerodhaOHLCURL = `${zerodhaURLs.ZERODHA_OHLC}${symbols}`;
      logger.info(`zerodhaOHLCURL :${zerodhaOHLCURL}`);
      axios
        .get(zerodhaOHLCURL, { headers: { Authorization: `token ${apiKey}:${accessToken}` } })
        .then((response) => {
          const responseData = response.data;
          resolve(responseData);
        })
        .catch((error) => {
          logger.info(`Error: ${error.message}`);
          resolve(null);
        });
    } else {
      resolve(null);
    }
  });

const addNearRangePreStartTransaction = (optionScript) =>
  new Promise((resolve) => {
    const tradingSymbol = `NFO:${optionScript.tradingsymbol}`;
    const expiryDate = moment(optionScript.expiry).format('DD-MMM-YYYY');
    const tradeDate = moment(new Date()).format('DD-MMM-YYYY');
    const user = User.getUser().info;
    const { setting } = User.getUser();
    getZerodhaData([tradingSymbol]).then((optionScriptData) => {
      if (optionScriptData && optionScriptData.data) {
        const data = optionScriptData.data[tradingSymbol];
        const currentPrice = data.last_price;
        const lotSize = optionScript.lot_size;
        const quantity = Math.round(setting.capital / (lotSize * currentPrice)) * lotSize;
        const capital = currentPrice * quantity;
        const buyTransaction = {
          userId: user._id,
          strikePrice: optionScript.strike,
          type: tradingSymbol.includes(optionTypes.PE) ? optionTypes.PE : optionTypes.CE,
          expiryDate,
          symbol: optionScript.name,
          tradingSymbol,
          tradeDate,
          capital,
          quantity,
          boughtPrice: currentPrice,
          highestPrice: currentPrice,
          lowestPrice: currentPrice,
          soldPrice: currentPrice,
          profit: 0,
          active: false,
          preStart: true,
          currentPrice,
        };
        logger.info(` ${optionScript.name} -- BOUGHT SCRIPT!!!`);
        createTransaction(buyTransaction)
          .then((transactionData) => {
            logger.info('buy Transaction');
            resolve({ transaction: transactionData, success: true });
          })
          .catch((error) => {
            logger.info(error);
            resolve(null);
          });
      }
    });
  });

const addInstrumentsToOptionScript = (instrument) =>
  new Promise((resolve) => {
    const params = instrument;
    params.userId = User.getUser().info._id;
    OptionScript.isTradingSymbolTakenForUser(params.tradingSymbol, params.userId)
      .then(async (existingOptionScript) => {
        if (!existingOptionScript) {
          const optionScript = await createOptionScript(params);
          await addNearRangePreStartTransaction(optionScript);
          resolve(optionScript);
        }
        resolve(existingOptionScript);
      })
      .catch((error) => {
        logger.info(error);
        resolve(null);
      });
  });

const runNearRangeBuyForToday = async (symbolData, symbol) => {
  const currentSymbolData =
    symbolData[symbol === symbolTypes.BANKNIFTY ? getBankNiftyFutureSymbol() : getNiftyFutureSymbol()];
  const symbolCurrentPrice = currentSymbolData.last_price;
  const roundedSymbolPrice = Math.round(symbolCurrentPrice / 100) * 100;

  const atmStikePrice = roundedSymbolPrice;
  // const otmStikePrice = roundedSymbolPrice + 100; // need to remove
  // const itmStikePrice = roundedSymbolPrice - 100; // need to remove

  logger.info(`${symbol} atmStikePrice  : ${atmStikePrice}`);
  // logger.info(`${symbol} otmStikePrice  : ${otmStikePrice}`); // need to remove
  // logger.info(`${symbol} itmStikePrice  : ${itmStikePrice}`); // need to remove

  const { expiryDate } = User.getUser().setting;
  const instruments = Instruments.instruments.filter((instrument) => {
    const instrumentExpiryDate = moment(instrument.expiry).format('DD-MMM-YYYY');
    return (
      instrument.strike === atmStikePrice && // || instrument.strike === otmStikePrice || instrument.strike === itmStikePrice) && // need to remove
      symbol === instrument.name &&
      _.isEqual(expiryDate, instrumentExpiryDate)
    );
  });

  const nearBuyOptionScriptPromises = [];
  instruments.forEach((instrument) => {
    nearBuyOptionScriptPromises.push(addInstrumentsToOptionScript(instrument));
  });
  Promise.all(nearBuyOptionScriptPromises)
    .then(() => {
      // do something with the responses
      logger.info('NearRange Executed for User!');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

const updateTransactionsforCheckAndBuy = (optionScript, symbolData, symbol) =>
  new Promise((resolve) => {
    const { setting } = User.getUser();
    const tradingSymbol = `NFO:${optionScript.tradingsymbol}`;
    const tradeDate = moment(new Date()).format('DD-MMM-YYYY');
    const user = User.getUser().info;
    const expiryDate = moment(optionScript.expiry).format('DD-MMM-YYYY');
    getLastTransactionByUserTradeDateBuy(
      tradeDate,
      user._id,
      tradingSymbol.includes(optionTypes.PE) ? optionTypes.PE : optionTypes.CE,
      optionScript.strike,
      optionScript.name
    ).then((lastTransactions) => {
      // getLastTransactionByUserTradeDateTradeSymbolBuy(tradeDate, user._id, tradingSymbol).then((lastTransactions) => {
      const lastTransaction = lastTransactions[0];
      if (lastTransaction && !lastTransaction.active) {
        const currentPrice = symbolData.last_price;
        const { ohlc } = symbolData;
        const dayLowestPrice = ohlc.low;
        const dayHighestPrice = ohlc.high;
        const lotSize = optionScript.lot_size;
        const quantity = Math.round(setting.capital / (lotSize * currentPrice)) * lotSize;
        const capital = currentPrice * quantity;
        const buyTransaction = {
          userId: user._id,
          strikePrice: optionScript.strike,
          type: tradingSymbol.includes(optionTypes.PE) ? optionTypes.PE : optionTypes.CE,
          expiryDate,
          symbol: optionScript.name,
          tradeDate,
          capital,
          quantity,
          boughtPrice: currentPrice,
          highestPrice: currentPrice,
          lowestPrice: currentPrice,
          soldPrice: 0,
          profit: 0,
          active: true,
          preStart: false,
          currentPrice,
          tradingSymbol,
        };
        const ltCurrentPrice = lastTransaction.currentPrice;
        const ltLotSizeSoldPrice = optionScript.lot_size;
        const ltQuantitySoldPrice = Math.round(setting.capital / (ltLotSizeSoldPrice * ltCurrentPrice)) * ltLotSizeSoldPrice;
        const profitDifference = ltQuantitySoldPrice * (currentPrice - ltCurrentPrice);
        const firstBuyCusionCaptial = (setting.capital * setting.firstBuyConstant) / 100;
        const rebuyBuyCusionCaptial = (setting.capital * setting.reBuyConstant) / 100;
        const reBuyPrice = lastTransaction.highestPrice;
        // const reverseRebuyCusionCaptial = (setting.capital * 2.5) / 2 / 100;
        // const reverseRebuyQuantitySoldPrice =
        //   Math.round(setting.capital / (ltLotSizeSoldPrice * dayLowestPrice)) * ltLotSizeSoldPrice;
        // const reverseRebuyProfitDifference = reverseRebuyQuantitySoldPrice * (currentPrice - ltCurrentPrice);
        // const reverseRebuyPrice = dayLowestPrice + (dayHighestPrice - dayLowestPrice) * 0.25;
        // const isreverseRebuyInRange = currentPrice < reverseRebuyPrice + 2 && currentPrice > reverseRebuyPrice - 2;
        logger.info('---');
        logger.info(`${symbol} --BUY :: ${tradingSymbol}`);
        logger.info(`${symbol} --BUY profitDifference :: ${profitDifference}`);
        logger.info(`${symbol} --BUY firstBuyCusionCaptial :: ${firstBuyCusionCaptial}`);
        logger.info(`${symbol} --BUY reBuyPrice :: ${reBuyPrice}`);
        logger.info(`${symbol} --BUY currentPrice :: ${currentPrice}`);
        logger.info('---');
        const isBuyCondition = lastTransaction.preStart
          ? profitDifference > firstBuyCusionCaptial
          : currentPrice > reBuyPrice || profitDifference > rebuyBuyCusionCaptial; // || isreverseRebuyInRange;

        if (isBuyCondition) {
          logger.info(`${symbol} -- BOUGHT SCRIPT!!!`);
          // implement ALGOMOJO api buy
          if (_.isEqual(setting.account, accountTypes.REAL)) {
            const orderDetails = {
              exchange: 'NFO',
              tradingSymbol: optionScript.tradingsymbol,
              isBuy: true,
              quantity,
              product: 'MIS',
              isMarketOrder: true,
              price: 0,
            };
            try {
              const orderResult = ZerodhaOrderManager.placeOrder(orderDetails);
              createTransaction(buyTransaction).then((transactionData) => {
                logger.info('buy Transaction');
                resolve({ transaction: transactionData, success: true });
              });
            } catch (error) {
              logger.info(error);
              resolve(null);
            }
          } else {
            createTransaction(buyTransaction).then((transactionData) => {
              logger.info('buy Transaction');
              resolve({ transaction: transactionData, success: true });
            });
          }
        }
      } else {
        logger.info('not buy transaction..');
        resolve({ transaction: null, success: true });
      }
    });
  });

const runToBuyForToday = async (symbolData, symbol) => {
  const user = User.getUser().info;
  const optionScripts = await getOptionScriptByUserId(user._id);
  const optionScriptsPromises = [];
  optionScripts.forEach((optionScript) => {
    if (_.isEqual(optionScript.name, symbol)) {
      const { tradingsymbol } = optionScript;
      const data = symbolData[`NFO:${tradingsymbol}`];
      optionScriptsPromises.push(updateTransactionsforCheckAndBuy(optionScript, data, symbol));
    }
  });
  Promise.all(optionScriptsPromises)
    .then(() => {
      // do something with the responses
      logger.info('Buy Executed for All Option Script.');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

const updateTransactionsforCheckAndSell = (transaction, symbolData, symbol) =>
  new Promise((resolve) => {
    const { setting } = User.getUser();
    const { tradingSymbol } = transaction;
    const transactionId = transaction._id;
    const data = symbolData[tradingSymbol];
    const currentPrice = data.last_price;
    const profit = (currentPrice - transaction.boughtPrice) * transaction.quantity;
    let { highestPrice } = transaction;
    highestPrice = currentPrice > highestPrice ? currentPrice : highestPrice;
    const { lowestPrice } = transaction;
    const trailingSLCaptial = (setting.capital * setting.trailingSLConstant) / 100;
    const SLPrice = highestPrice - trailingSLCaptial / transaction.quantity;
    const profitLossDifference = transaction.quantity * (highestPrice - currentPrice);
    const isSellCondition = profitLossDifference > trailingSLCaptial;

    const transactionBody = {
      active: !isSellCondition,
      profit,
      soldPrice: !isSellCondition ? 0 : currentPrice,
      currentPrice,
      highestPrice: currentPrice > highestPrice ? currentPrice : highestPrice,
      lowestPrice: currentPrice < lowestPrice ? currentPrice : lowestPrice,
    };
    logger.info('---');
    logger.info(`${symbol} --SELL tradingSymbol :: ${tradingSymbol}`);
    logger.info(`${symbol} -- SELL profitLossDifference :: ${profitLossDifference}`);
    logger.info(`${symbol} -- SELL trailingSLCaptial :: ${trailingSLCaptial}`);
    logger.info(`${symbol} -- SELL profit :: ${profit}`);
    logger.info(`${symbol} -- SELL SLPrice :: ${SLPrice}`);
    logger.info(`${symbol} --BUY currentPrice :: ${currentPrice}`);
    logger.info('---');
    if (_.isEqual(setting.account, accountTypes.REAL)) {
      const tradingSymbolWithouthExchange = tradingSymbol.split(':')[1];
      const { quantity } = transaction;
      const orderDetails = {
        exchange: 'NFO',
        tradingSymbol: tradingSymbolWithouthExchange,
        isBuy: false,
        quantity,
        product: 'MIS',
        isMarketOrder: true,
        price: 0,
      };
      try {
        const orderResult = ZerodhaOrderManager.placeOrder(orderDetails);
        updateTransactionById(transactionId, transactionBody)
          .then((updatedTransaction) => {
            resolve(updatedTransaction);
          })
          .catch((error) => {
            logger.info(error);
            resolve(null);
          });
      } catch (error) {
        logger.info(error);
        resolve(null);
      }
    } else {
      updateTransactionById(transactionId, transactionBody)
        .then((updatedTransaction) => {
          resolve(updatedTransaction);
        })
        .catch((error) => {
          logger.info(error);
          resolve(null);
        });
    }
  });

const runToSellForToday = async (symbolData, symbol) => {
  const tradeDate = moment(new Date()).format('DD-MMM-YYYY');
  const user = User.getUser().info;
  const allActiveTransactions = await getTransactionsByActiveTradeDateUser(true, tradeDate, user._id);
  if (allActiveTransactions) {
    const activeTransactionPromises = [];
    allActiveTransactions.forEach((transaction) => {
      if (_.isEqual(transaction.symbol, symbol)) {
        activeTransactionPromises.push(updateTransactionsforCheckAndSell(transaction, symbolData, symbol));
      }
    });
    Promise.all(activeTransactionPromises)
      .then(() => {
        // do something with the responses
        logger.info('NearRange Executed for User!');
      })
      .catch((error) => {
        // handle error
        logger.info(error);
      });
  }
};

const updateTransactionsforSellPrice = (transaction, symbolData) =>
  new Promise((resolve) => {
    const { setting } = User.getUser();
    const { tradingSymbol } = transaction;
    const { quantity } = transaction;
    const transactionId = transaction._id;
    const data = symbolData[tradingSymbol];
    const currentPrice = data.last_price;
    const profit = (currentPrice - transaction.boughtPrice) * transaction.quantity;
    const transactionBody = {
      active: false,
      profit,
      soldPrice: currentPrice,
      currentPrice,
    };
    if (_.isEqual(setting.account, accountTypes.REAL)) {
      const tradingSymbolWithouthExchange = tradingSymbol.split(':')[1];
      const orderDetails = {
        exchange: 'NFO',
        tradingSymbol: tradingSymbolWithouthExchange,
        isBuy: false,
        quantity,
        product: 'MIS',
        isMarketOrder: true,
        price: 0,
      };
      try {
        const orderResult = ZerodhaOrderManager.placeOrder(orderDetails);
        updateTransactionById(transactionId, transactionBody)
          .then((updatedTransaction) => {
            resolve(updatedTransaction);
          })
          .catch((error) => {
            logger.info(error);
            resolve(null);
          });
      } catch (error) {
        logger.info(error);
        resolve(null);
      }
    } else {
      updateTransactionById(transactionId, transactionBody)
        .then((updatedTransaction) => {
          resolve(updatedTransaction);
        })
        .catch((error) => {
          logger.info(error);
          resolve(null);
        });
    }
  });

const runToSellAllForToday = async (symbolData, symbol) => {
  const tradeDate = moment(new Date()).format('DD-MMM-YYYY');
  const user = User.getUser().info;
  const allActiveTransactions = await getTransactionsByActiveTradeDateUser(true, tradeDate, user._id);
  if (allActiveTransactions) {
    const activeTransactionPromises = [];
    allActiveTransactions.forEach((transaction) => {
      if (_.isEqual(transaction.symbol, symbol)) {
        activeTransactionPromises.push(updateTransactionsforSellPrice(transaction, symbolData));
      }
    });
    Promise.all(activeTransactionPromises)
      .then(() => {
        // do something with the responses
        logger.info('NearRange Executed for User!');
      })
      .catch((error) => {
        // handle error
        logger.info(error);
      });
  }
};

const refreshZerodhaConfig = () => {
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
                updateSettingById(setting._id, settingBody);
                Zerodha.setAccessToken(kcAccessToken);
                deleteAllInstrument()
                  .then(() => {
                    logger.info(`Deleted all instruments`);
                    Zerodha.loadInstruments()
                      .then((instruments) => {
                        const currentExpiryDateInstruments = Instruments.getInstrumentsForExpiryDate(setting.expiryDate);
                        Instruments.setCurrentInstruments(currentExpiryDateInstruments);
                        logger.info(`currentExpiryDateInstruments count :: ${currentExpiryDateInstruments.length}`);
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

const placeSingleOrder = (body) =>
  new Promise((resolve) => {
    const algomojoURL = `https://tcapi.algomojo.com/1.0/PlaceOrder`;
    logger.info(`algomojoURL :${algomojoURL}`);
    logger.info(`body :${JSON.stringify(body)}`);
    axios
      .post(algomojoURL, body)
      .then((response) => {
        logger.info(`response: ${JSON.stringify(response)}`);
        const responseData = response.data;
        resolve(responseData);
      })
      .catch((error) => {
        logger.info(`Error: ${error.message}`);
        resolve(null);
      });
  });

const placeMultipleOrder = (body) =>
  new Promise((resolve) => {
    const algomojoURL = `https://tcapi.algomojo.com/1.0/PlaceMultiOrder`;
    logger.info(`algomojoURL :${algomojoURL}`);
    logger.info(`body :${JSON.stringify(body)}`);
    axios
      .post(algomojoURL, body)
      .then((response) => {
        logger.info(`response: ${JSON.stringify(response)}`);
        const responseData = response.data;

        resolve(responseData);
      })
      .catch((error) => {
        logger.info(`Error: ${error.message}`);
        resolve(null);
      });
  });
module.exports = {
  getZerodhaData,
  runNearRangeBuyForToday,
  runToBuyForToday,
  runToSellForToday,
  runToSellAllForToday,
  refreshZerodhaConfig,
  placeSingleOrder,
  placeMultipleOrder,
};
