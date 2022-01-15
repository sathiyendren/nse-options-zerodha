const axios = require('axios');
const logger = require('../config/logger');
const { optionURLs } = require('../config/optionChain');
const Zerodha = require('../brokers/zerodha/Zerodha');

const getOptionChainData = (symbol) =>
  new Promise((resolve) => {
    const apiKey = Zerodha.getAPIKey();
    const session = Zerodha.getSession();
    logger.info(`apiKey :: ${apiKey}`);
    logger.info(`session :: ${session}`);
    const optionChainURL = `${optionURLs.OPTIONCHAIN}${symbol}`;
    logger.info(`optionChainURL :${optionChainURL}`);
    axios
      .get(optionChainURL, { headers: { Authorization: 'https://www.nseindia.com/option-chain' } })
      .then((response) => {
        const responseData = response.data;
        resolve(responseData);
      })
      .catch((error) => {
        logger.info(`Error: ${error.message}`);
        resolve(null);
      });
  });
const getFilterdOptionChainData = (optionChainData) =>
  new Promise((resolve) => {
    const finalOptionsChainData = [];
    optionChainData.forEach((iterationData) => {
      if (iterationData && 'PE' in iterationData) {
        const massageData = iterationData.PE;
        massageData.type = 'PE';
        finalOptionsChainData.push(massageData);
      }
      if (iterationData && 'CE' in iterationData) {
        const massageData = iterationData.CE;
        massageData.type = 'CE';
        finalOptionsChainData.push(massageData);
      }
    });
    resolve(finalOptionsChainData);
  });
const getTodayDate = () => {
  const now = new Date();
  return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
};
module.exports = {
  getOptionChainData,
  getFilterdOptionChainData,
  getTodayDate,
};
