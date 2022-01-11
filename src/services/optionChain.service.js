const { getOptionChainData, getTodayDate } = require('./misc.service');
const { getAllBlacklistedUsers } = require('./user.service');
const { getSettingByUserId } = require('./setting.service');
const { getOptionScriptByUserId, createOptionScript } = require('./optionScript.service');
const {
  getTransactionsByUserTradeDatePreStart,
  getLastTransactionByUserTradeDateBuy,
  getLastTransactionByActiveUserTradeDateSell,
  createTransaction,
  updateTransactionById,
} = require('./transaction.service');
const { getSymbolRateBySymbolAndRunning } = require('./symbolRate.service');

const { OptionScript } = require('../models/index');

const logger = require('../config/logger');
const { tradingTypes } = require('../config/setting');
const { lotSizes, symbolTypes } = require('../config/optionScript');

/**
 * Get OptionScript by id
 * @param {ObjectId} id
 * @returns {Promise<OptionScript>}
 */
const queryOptionChain = async (filter) => {
  const opdata = await getOptionChainData(filter.symbol);
  const { data } = opdata.records;
  if (data) {
    const finalData = data.filter(function (item) {
      return item.expiryDate === filter.expiryDate;
    });
    const optionsChainData = [];
    finalData.forEach((iterationData) => {
      if (iterationData && 'PE' in iterationData) {
        const massageData = iterationData.PE;
        massageData.type = 'PE';
        optionsChainData.push(massageData);
      }
      if (iterationData && 'CE' in iterationData) {
        const massageData = iterationData.CE;
        massageData.type = 'CE';
        optionsChainData.push(massageData);
      }
    });

    return { data: optionsChainData };
  }
  return { data };
};

const getFilterdOptionChainData = (optionChainData) => {
  const filteredOptionChainData = [];
  optionChainData.forEach((iterationData) => {
    if (iterationData && 'PE' in iterationData) {
      const massageData = iterationData.PE;
      massageData.type = 'PE';
      filteredOptionChainData.push(massageData);
    }
    if (iterationData && 'CE' in iterationData) {
      const massageData = iterationData.CE;
      massageData.type = 'CE';
      filteredOptionChainData.push(massageData);
    }
  });
  return filteredOptionChainData;
};

const addPreStartForAllUserScripts = (user, setting, optionScript, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    const tradeDate = getTodayDate();
    getTransactionsByUserTradeDatePreStart(
      true,
      tradeDate,
      user._id,
      optionScript.type,
      optionScript.strikePrice,
      optionScript.underlying
    ).then((transaction) => {
      if (!transaction) {
        const optionChainDataArray = filteredOptionChainData.filter((ocData) => {
          return (
            optionScript.type === ocData.type &&
            optionScript.strikePrice === ocData.strikePrice &&
            optionScript.underlying === ocData.underlying
          );
        });
        if (optionChainDataArray.length > 0) {
          const optionChainData = optionChainDataArray[0];
          const preStratTransaction = {
            userId: user._id,
            strikePrice: optionScript.strikePrice,
            type: optionScript.type,
            expiryDate: optionScript.expiryDate,
            symbol: optionScript.underlying,
            tradeDate,
            capital: 0,
            quantity: 0,
            boughtPrice: optionChainData.lastPrice,
            highestPrice: optionChainData.lastPrice,
            lowestPrice: optionChainData.lastPrice,
            soldPrice: optionChainData.lastPrice,
            profit: 0,
            active: false,
            preStart: true,
            currentPrice: optionChainData.lastPrice,
          };
          createTransaction(preStratTransaction).then((transactionData) => {
            logger.info('createTransaction');
            resolve({ transaction: transactionData, success: true });
          });
        } else {
          logger.info('not createTransaction');
          resolve({ transaction: null, success: true });
        }
      } else {
        logger.info('not transaction..');
      }
    });
  });

const initPreStartForAllUserScripts = (user, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    getSettingByUserId(user._id).then(async (setting) => {
      if (!setting) {
        resolve({ user, success: false });
        return;
      }
      if (setting.tradingType !== tradingTypes.NORMAL) {
        resolve({ user, success: false });
        return;
      }

      const optionScripts = await getOptionScriptByUserId(user._id);
      const optionScriptsPromises = [];
      optionScripts.forEach((optionScript) => {
        optionScriptsPromises.push(
          addPreStartForAllUserScripts(user, setting, optionScript, filteredOptionChainData, symbol)
        );
      });
      Promise.all(optionScriptsPromises)
        .then((resArray) => {
          // do something with the responses
          logger.info('Prestart Executed for All Option Script.');
          resolve({ user, success: true });
        })
        .catch((error) => {
          // handle error
          logger.info(error);
          resolve({ user, success: false });
        });
    });
  });

const runPreStartForTodayScript = async (filteredOptionChainData, symbol) => {
  const nonBlacklistedUsers = await getAllBlacklistedUsers(false);
  const nonBlacklistedUserPromises = [];
  nonBlacklistedUsers.forEach((user) => {
    nonBlacklistedUserPromises.push(initPreStartForAllUserScripts(user, filteredOptionChainData, symbol));
  });
  Promise.all(nonBlacklistedUserPromises)
    .then((resArray) => {
      // do something with the responses
      logger.info('Prestart Executed for All users.');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

const addBuyCheckForAllUserScripts = (user, setting, optionScript, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    const tradeDate = getTodayDate();
    getLastTransactionByUserTradeDateBuy(
      tradeDate,
      user._id,
      optionScript.type,
      optionScript.strikePrice,
      optionScript.underlying
    ).then((lastTransactions) => {
      const lastTransaction = lastTransactions[0];
      if (lastTransaction && !lastTransaction.active) {
        const optionChainDataArray = filteredOptionChainData.filter((ocData) => {
          return (
            optionScript.type === ocData.type &&
            optionScript.strikePrice === ocData.strikePrice &&
            optionScript.underlying === ocData.underlying
          );
        });
        if (optionChainDataArray.length > 0) {
          const optionChainData = optionChainDataArray[0];
          const currentPrice = optionChainData.lastPrice;
          const lotSize = optionChainData.underlying === symbolTypes.NIFTY ? lotSizes.NIFTY : lotSizes.BANKNIFTY;
          const quantity = Math.round(setting.capital / (lotSize * currentPrice)) * lotSize;
          const capital = currentPrice * quantity;
          const buyTransaction = {
            userId: user._id,
            strikePrice: optionScript.strikePrice,
            type: optionScript.type,
            expiryDate: optionScript.expiryDate,
            symbol: optionScript.underlying,
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
          };
          const ltLowestPrice = lastTransaction.lowestPrice;
          const ltLotSizeSoldPrice = optionChainData.underlying === symbolTypes.NIFTY ? lotSizes.NIFTY : lotSizes.BANKNIFTY;
          const ltQuantitySoldPrice =
            Math.round(setting.capital / (ltLotSizeSoldPrice * ltLowestPrice)) * ltLotSizeSoldPrice;
          const profitDifference = ltQuantitySoldPrice * (currentPrice - ltLowestPrice);
          logger.info(`${symbol} --BUY :: ${optionScript.strikePrice} ${optionScript.type}`);
          logger.info(`${symbol} --BUY profitDifference :: ${profitDifference}`);
          const firstBuyCusionCaptial = (setting.capital * setting.firstBuyConstant) / 100;
          logger.info(`${symbol} --BUY firstBuyCusionCaptial :: ${firstBuyCusionCaptial}`);
          const reBuyPrice = lastTransaction.soldPrice + setting.reBuyCusionConstant / ltLotSizeSoldPrice;
          logger.info(`${symbol} --BUY reBuyPrice :: ${reBuyPrice}`);
          logger.info('---');
          const isBuyCondition = lastTransaction.preStart
            ? profitDifference > firstBuyCusionCaptial
            : currentPrice > reBuyPrice;
          if (isBuyCondition) {
            logger.info(`${symbol} -- BOUGHT SCRIPT!!!`);
            // implement ALGOMOJO api buy
            createTransaction(buyTransaction).then((transactionData) => {
              logger.info('buy Transaction');
              resolve({ transaction: transactionData, success: true });
            });
          }
        } else {
          logger.info('not buy Transaction');
          resolve({ transaction: null, success: true });
        }
      } else {
        logger.info('not buy transaction..');
      }
    });
  });

const initBuyForAllUserScripts = (user, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    getSettingByUserId(user._id).then(async (setting) => {
      if (!setting) {
        resolve({ user, success: false });
        return;
      }
      const optionScripts = await getOptionScriptByUserId(user._id);
      const optionScriptsPromises = [];
      optionScripts.forEach((optionScript) => {
        optionScriptsPromises.push(
          addBuyCheckForAllUserScripts(user, setting, optionScript, filteredOptionChainData, symbol)
        );
      });
      Promise.all(optionScriptsPromises)
        .then((resArray) => {
          // do something with the responses
          logger.info('Buy Executed for All Option Script.');
          resolve({ user, success: true });
        })
        .catch((error) => {
          // handle error
          logger.info(error);
          resolve({ user, success: false });
        });
    });
  });

const runBuyForTodayScript = async (filteredOptionChainData, symbol) => {
  const nonBlacklistedUsers = await getAllBlacklistedUsers(false);
  const nonBlacklistedUserPromises = [];
  nonBlacklistedUsers.forEach((user) => {
    nonBlacklistedUserPromises.push(initBuyForAllUserScripts(user, filteredOptionChainData, symbol));
  });
  Promise.all(nonBlacklistedUserPromises)
    .then((resArray) => {
      // do something with the responses
      logger.info('Buy Check Executed for All users.');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

const addSellCheckForAllUserScripts = (user, setting, optionScript, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    const tradeDate = getTodayDate();
    getLastTransactionByActiveUserTradeDateSell(
      true,
      tradeDate,
      user._id,
      optionScript.type,
      optionScript.strikePrice,
      optionScript.underlying
    ).then((lastTransactions) => {
      const lastTransaction = lastTransactions[0];
      if (lastTransaction && lastTransaction.active) {
        const optionChainDataArray = filteredOptionChainData.filter((ocData) => {
          return (
            optionScript.type === ocData.type &&
            optionScript.strikePrice === ocData.strikePrice &&
            optionScript.underlying === ocData.underlying
          );
        });
        if (optionChainDataArray.length > 0) {
          const optionChainData = optionChainDataArray[0];
          const currentPrice = optionChainData.lastPrice;
          let { highestPrice } = lastTransaction;
          highestPrice = currentPrice > highestPrice ? currentPrice : highestPrice;
          const { lowestPrice } = lastTransaction;
          const profit = (currentPrice - lastTransaction.boughtPrice) * lastTransaction.quantity;
          const SLPrice = highestPrice - 5000 / lastTransaction.quantity;
          logger.info(`${symbol} --SELL :: ${optionScript.strikePrice} ${optionScript.type}`);
          logger.info(`${symbol} -- SELL SLPrice :: ${SLPrice}`);
          const profitLossDifference = lastTransaction.quantity * (highestPrice - currentPrice);
          logger.info(`${symbol} -- SELL profitLossDifference :: ${profitLossDifference}`);
          const trailingSLCaptial = (setting.capital * setting.trailingSLConstant) / 100;
          logger.info(`${symbol} -- SELL trailingSLCaptial :: ${trailingSLCaptial}`);
          const isSellCondition = profitLossDifference > trailingSLCaptial;
          logger.info(`${symbol} -- SELL profit :: ${profit}`);
          logger.info('---');
          if (isSellCondition) {
            logger.info(`${symbol} -- SELL SCRIPT!!!`);
            // implement ALGOMOJO api Sell

            const sellTransaction = {
              userId: user._id,
              strikePrice: optionScript.strikePrice,
              type: optionScript.type,
              expiryDate: optionScript.expiryDate,
              symbol: optionScript.underlying,
              tradeDate,
              soldPrice: currentPrice,
              lowestPrice: currentPrice,
              active: false,
              profit,
              currentPrice,
            };

            updateTransactionById(lastTransaction._id, sellTransaction).then((transactionData) => {
              logger.info('sell Transaction');
              resolve({ transaction: transactionData, success: true });
            });
          } else {
            const sellTransaction = {
              userId: user._id,
              strikePrice: optionScript.strikePrice,
              type: optionScript.type,
              expiryDate: optionScript.expiryDate,
              symbol: optionScript.underlying,
              tradeDate,
              highestPrice: currentPrice > highestPrice ? currentPrice : highestPrice,
              lowestPrice: currentPrice < lowestPrice ? lowestPrice : currentPrice,
              active: true,
              profit,
              currentPrice,
            };
            updateTransactionById(lastTransaction._id, sellTransaction).then((transactionData) => {
              logger.info('update Transaction');
              resolve({ transaction: transactionData, success: true });
            });
          }
        } else {
          logger.info('not sell Transaction');
          resolve({ transaction: null, success: true });
        }
      } else {
        logger.info('not sell transaction..');
      }
    });
  });

const initSellForAllUserScripts = (user, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    getSettingByUserId(user._id).then(async (setting) => {
      if (!setting) {
        resolve({ user, success: false });
        return;
      }
      const optionScripts = await getOptionScriptByUserId(user._id);
      const optionScriptsPromises = [];
      optionScripts.forEach((optionScript) => {
        optionScriptsPromises.push(
          addSellCheckForAllUserScripts(user, setting, optionScript, filteredOptionChainData, symbol)
        );
      });
      Promise.all(optionScriptsPromises)
        .then(() => {
          // do something with the responses
          logger.info('Sell Executed for All Option Script.');
          resolve({ user, success: true });
        })
        .catch((error) => {
          // handle error
          logger.info(error);
          resolve({ user, success: false });
        });
    });
  });

const runSellForTodayScript = async (filteredOptionChainData, symbol) => {
  const nonBlacklistedUsers = await getAllBlacklistedUsers(false);
  const nonBlacklistedUserPromises = [];
  nonBlacklistedUsers.forEach((user) => {
    nonBlacklistedUserPromises.push(initSellForAllUserScripts(user, filteredOptionChainData, symbol));
  });
  Promise.all(nonBlacklistedUserPromises)
    .then(() => {
      // do something with the responses
      logger.info('Sell Check Executed for All users.');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

const addSellAllCheckForAllUserScripts = (user, setting, optionScript, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    const tradeDate = getTodayDate();
    getLastTransactionByActiveUserTradeDateSell(
      true,
      tradeDate,
      user._id,
      optionScript.type,
      optionScript.strikePrice,
      optionScript.underlying
    ).then((lastTransactions) => {
      const lastTransaction = lastTransactions[0];
      if (lastTransaction && lastTransaction.active) {
        const optionChainDataArray = filteredOptionChainData.filter((ocData) => {
          return (
            optionScript.type === ocData.type &&
            optionScript.strikePrice === ocData.strikePrice &&
            optionScript.underlying === ocData.underlying
          );
        });
        if (optionChainDataArray.length > 0) {
          const optionChainData = optionChainDataArray[0];
          const currentPrice = optionChainData.lastPrice;
          logger.info(`${symbol} -- SELL SCRIPT!!!`);
          // implement ALGOMOJO api Sell

          const profit = (currentPrice - lastTransaction.boughtPrice) * lastTransaction.quantity;
          const sellTransaction = {
            userId: user._id,
            strikePrice: optionScript.strikePrice,
            type: optionScript.type,
            expiryDate: optionScript.expiryDate,
            symbol: optionScript.underlying,
            tradeDate,
            soldPrice: currentPrice,
            lowestPrice: currentPrice,
            active: false,
            profit,
            currentPrice,
          };

          updateTransactionById(lastTransaction._id, sellTransaction).then((transactionData) => {
            logger.info('sell Transaction');
            resolve({ transaction: transactionData, success: true });
          });
        } else {
          logger.info('not sell Transaction');
          resolve({ transaction: null, success: true });
        }
      } else {
        logger.info('not sell transaction..');
      }
    });
  });

const initSellAllForAllUserScripts = (user, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    getSettingByUserId(user._id).then(async (setting) => {
      if (!setting) {
        resolve({ user, success: false });
        return;
      }
      const optionScripts = await getOptionScriptByUserId(user._id);
      const optionScriptsPromises = [];
      optionScripts.forEach((optionScript) => {
        optionScriptsPromises.push(
          addSellAllCheckForAllUserScripts(user, setting, optionScript, filteredOptionChainData, symbol)
        );
      });
      Promise.all(optionScriptsPromises)
        .then(() => {
          // do something with the responses
          logger.info('Sell Executed for All Option Script.');
          resolve({ user, success: true });
        })
        .catch((error) => {
          // handle error
          logger.info(error);
          resolve({ user, success: false });
        });
    });
  });

const runSellAllForTodayScript = async (filteredOptionChainData, symbol) => {
  const nonBlacklistedUsers = await getAllBlacklistedUsers(false);
  const nonBlacklistedUserPromises = [];
  nonBlacklistedUsers.forEach((user) => {
    nonBlacklistedUserPromises.push(initSellAllForAllUserScripts(user, filteredOptionChainData, symbol));
  });
  Promise.all(nonBlacklistedUserPromises)
    .then(() => {
      // do something with the responses
      logger.info('Sell Check Executed for All users.');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

const addNearRangeForAllUserScripts = (user, setting, optionScript, symbol) =>
  new Promise((resolve) => {
    logger.info(getTodayDate());
    const tradeDate = getTodayDate();
    const currentPrice = optionScript.lastPrice;
    const lotSize = optionScript.underlying === symbolTypes.NIFTY ? lotSizes.NIFTY : lotSizes.BANKNIFTY;
    const quantity = Math.round(setting.capital / (lotSize * currentPrice)) * lotSize;
    const capital = currentPrice * quantity;
    const buyTransaction = {
      userId: user._id,
      strikePrice: optionScript.strikePrice,
      type: optionScript.type,
      expiryDate: optionScript.expiryDate,
      symbol: optionScript.underlying,
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

    logger.info(` ${symbol} -- BOUGHT SCRIPT!!!`);
    // implement ALGOMOJO api buy
    createTransaction(buyTransaction).then((transactionData) => {
      logger.info('buy Transaction');
      resolve({ transaction: transactionData, success: true });
    });
  });

const updateNearRangeScriptForUser = (user, setting, symbolRate, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    const symbolCurrentPrice = symbolRate.currentPrice;
    const roundedSymbolPrice = Math.round(symbolCurrentPrice / 100) * 100;

    const atmStikePrice = roundedSymbolPrice;
    const otmStikePrice = roundedSymbolPrice + 100;
    const itmStikePrice = roundedSymbolPrice - 100;
    logger.info(filteredOptionChainData[0].strikePrice);
    const nearRangeOptionChainData = filteredOptionChainData.filter(function (item) {
      return item.strikePrice === atmStikePrice; // || item.strikePrice === otmStikePrice || item.strikePrice === itmStikePrice;
    });
    nearRangeOptionChainData.forEach(async (iterationData) => {
      const params = iterationData;
      params.userId = user._id;
      const isCreatedAlready = await OptionScript.isIdentifierTakenForUser(params.identifier, params.userId);
      if (!isCreatedAlready) {
        const optionScript = await createOptionScript(params);
        await addNearRangeForAllUserScripts(user, setting, optionScript, symbol);
      }
    });
    resolve({ scripts: null, success: true });
  });

const initNearRangeBuyForAllUserScripts = (user, filteredOptionChainData, symbol) =>
  new Promise((resolve) => {
    getSettingByUserId(user._id).then(async (setting) => {
      if (!setting) {
        resolve({ user, success: false });
        return;
      }
      if (setting.tradingType === tradingTypes.NEAR_RANGE) {
        const symbolRate = await getSymbolRateBySymbolAndRunning(symbol, true);
        updateNearRangeScriptForUser(user, setting, symbolRate, filteredOptionChainData, symbol)
          .then((scripts) => {
            // do something with the responses
            logger.info(` ${symbol} -- NearRange Executed for All users.`);
            resolve({ user, success: false });
          })
          .catch((error) => {
            // handle error
            logger.info(error);
          });
      } else {
        resolve({ user, success: false });
      }
    });
  });

const runNearRangeBuyForTodayScript = async (filteredOptionChainData, symbol) => {
  const nonBlacklistedUsers = await getAllBlacklistedUsers(false);
  const nonBlacklistedUserPromises = [];
  nonBlacklistedUsers.forEach((user) => {
    nonBlacklistedUserPromises.push(initNearRangeBuyForAllUserScripts(user, filteredOptionChainData, symbol));
  });
  Promise.all(nonBlacklistedUserPromises)
    .then((resArray) => {
      // do something with the responses
      logger.info('NearRange Executed for All users.');
    })
    .catch((error) => {
      // handle error
      logger.info(error);
    });
};

module.exports = {
  queryOptionChain,
  getFilterdOptionChainData,
  runPreStartForTodayScript,
  runBuyForTodayScript,
  runSellForTodayScript,
  runSellAllForTodayScript,
  runNearRangeBuyForTodayScript,
};
