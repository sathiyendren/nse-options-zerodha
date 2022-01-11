const cron = require('node-cron');
const axios = require('axios');
const logger = require('../config/logger');

const { symbolRateService, miscService, expiryDateService, optionChainService } = require('../services');
const { symbolTypes } = require('../config/optionScript');

const checkHealth = () =>
  new Promise((resolve) => {
    axios
      .get('https://nse-options-facade.herokuapp.com/v1/misc/ping')
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

const isCurrentTimeMatch = (hour, minute) => {
  const now = new Date();
  logger.info(` #### Current Time :: ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} ####`);
  return now.getHours() === hour && now.getMinutes() === minute;
};

const getCurrentDateTime = () => {
  const now = new Date();
  logger.info(`Current Time :: ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
};

const initNiftyOptionChain = () =>
  new Promise((resolve) => {
    miscService.getOptionChainData(symbolTypes.NIFTY).then((nseOptionChainNiftyData) => {
      // logger.info(`nseOptionChainNiftyData :${nseOptionChainNiftyData}`);
      if (nseOptionChainNiftyData && nseOptionChainNiftyData.filtered && nseOptionChainNiftyData.filtered.data) {
        symbolRateService.updateSymbolCurrentPrice(symbolTypes.NIFTY, true, nseOptionChainNiftyData);
        const filteredOptionChainNiftyData = optionChainService.getFilterdOptionChainData(
          nseOptionChainNiftyData.filtered.data
        );
        if (filteredOptionChainNiftyData) {
          if (isCurrentTimeMatch(9, 20)) {
            optionChainService.runPreStartForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
          }
          optionChainService.runBuyForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
          optionChainService.runSellForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
          if (isCurrentTimeMatch(3, 25)) {
            optionChainService.runSellAllForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
          }
          // Initialization
          if (isCurrentTimeMatch(9, 13)) {
            expiryDateService.updateExpiryDatesForSymbol(symbolTypes.NIFTY, nseOptionChainNiftyData);
            optionChainService.runNearRangeBuyForTodayScript(filteredOptionChainNiftyData, symbolTypes.NIFTY);
          }
        }
      }
      resolve({});
    });
  });

const initBankNiftyOptionChain = () =>
  new Promise((resolve) => {
    miscService.getOptionChainData(symbolTypes.BANKNIFTY).then((nseOptionChainBankNiftyData) => {
      // logger.info(`nseOptionChainBankNiftyData :${nseOptionChainBankNiftyData}`);
      if (nseOptionChainBankNiftyData && nseOptionChainBankNiftyData.filtered && nseOptionChainBankNiftyData.filtered.data) {
        symbolRateService.updateSymbolCurrentPrice(symbolTypes.BANKNIFTY, true, nseOptionChainBankNiftyData);
        const filteredOptionChainBankNiftyData = optionChainService.getFilterdOptionChainData(
          nseOptionChainBankNiftyData.filtered.data
        );
        if (filteredOptionChainBankNiftyData) {
          if (isCurrentTimeMatch(9, 20)) {
            optionChainService.runPreStartForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
          }
          optionChainService.runBuyForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
          optionChainService.runSellForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
          if (isCurrentTimeMatch(3, 25)) {
            optionChainService.runSellAllForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
          }
          // Initialization
          if (isCurrentTimeMatch(9, 16)) {
            expiryDateService.updateExpiryDatesForSymbol(symbolTypes.BANKNIFTY, nseOptionChainBankNiftyData);
            optionChainService.runNearRangeBuyForTodayScript(filteredOptionChainBankNiftyData, symbolTypes.BANKNIFTY);
          }
        }
      }
      resolve({});
    });
  });
/**
 * Starts All Cron Tasks
 */
const startCronTasks = () => {
  // cron.schedule('*/15 * * * *', () => {
  //   logger.info('running a task every 15 minute');
  //   herokuKeepAliveCall();
  // });

  cron.schedule('*/3 * * * * *', async () => {
    logger.info('----------------------------------');
    getCurrentDateTime();
    logger.info('running a task every 3 seconds');
    Promise.all([initBankNiftyOptionChain()]) // initNiftyOptionChain(),
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

module.exports = {
  startCronTasks,
};
