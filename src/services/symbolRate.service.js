const httpStatus = require('http-status');
const { SymbolRate } = require('../models');
const ApiError = require('../utils/ApiError');
const { symbolTypes } = require('../config/optionScript');
const { getOptionChainData } = require('./misc.service');
const logger = require('../config/logger');

/**
 * Create a symbolRate
 * @param {Object} symbolRateBody
 * @returns {Promise<User>}
 */
const createSymbolRate = async (symbolRateBody) => {
  if (await SymbolRate.isSymbolAndRunningTaken(symbolRateBody.symbol, symbolRateBody.running)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Symbol already taken');
  }
  return SymbolRate.create(symbolRateBody);
};

/**
 * Query for symbolRates
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1) * @returns {Promise<QueryResult>}
 */
const querySymbolRates = async (filter, options) => {
  const symbolRates = await SymbolRate.paginate(filter, options);
  return symbolRates;
};

/**
 * Get SymbolRate by id
 * @param {ObjectId} id
 * @returns {Promise<SymbolRate>}
 */
const getSymbolRateById = async (id) => {
  return SymbolRate.findById(id);
};

/**
 * Get SymbolRate by symbol
 * @param {string} symbol
 * @param {boolean} running
 * @returns {Promise<SymbolRate>}
 */
const getSymbolRateBySymbolAndRunning = async (symbol, running) => {
  return SymbolRate.findOne({ symbol, running });
};

/**
 * Update SymbolRate by id
 * @param {ObjectId} symbolRateId
 * @param {Object} updateBody
 * @returns {Promise<SymbolRate>}
 */
const updateSymbolRateById = async (symbolRateId, updateBody) => {
  const symbolRate = await getSymbolRateById(symbolRateId);
  if (!symbolRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SymbolRate not found');
  }

  Object.assign(symbolRate, updateBody);
  await symbolRate.save();
  return symbolRate;
};

/**
 * Update SymbolRate by symbol
 * @param {string} symbol
 * @param {Object} updateBody
 * @returns {Promise<SymbolRate>}
 */
const updateSymbolRateBySymbolAndRunning = async (symbol, running, updateBody) => {
  const symbolRate = await getSymbolRateBySymbolAndRunning(symbol, running);
  if (!symbolRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SymbolRate not found');
  }

  Object.assign(symbolRate, updateBody);
  await symbolRate.save();
  return symbolRate;
};

/**
 * Delete SymbolRate by id
 * @param {ObjectId} symbolRateId
 * @returns {Promise<SymbolRate>}
 */
const deleteSymbolRateById = async (userId) => {
  const symbolRate = await getSymbolRateById(userId);
  if (!symbolRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SymbolRate not found');
  }
  await symbolRate.remove();
  return symbolRate;
};

/**
 * Delete SymbolRate by symbol
 * @param {string} symbol
 * @returns {Promise<SymbolRate>}
 */
const deleteSymbolRateBySymbolAndRunning = async (symbol, running) => {
  const symbolRate = await getSymbolRateBySymbolAndRunning(symbol, running);
  if (!symbolRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SymbolRate not found');
  }
  await symbolRate.remove();
  return symbolRate;
};

/**
 * Delete all SymbolRate
 * @returns {Promise<SymbolRate>}
 */
const deleteAllSymbolRate = async () => {
  const symbolRates = await SymbolRate.remove({}, (error) => {
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete all Expiry Dates');
    }
  });
  return symbolRates;
};

/**
 * Update Nifity and BankNifty Current Price
 * @param {boolean} running
 * @returns {Promise<OptionScript>}
 */
const updateSymbolCurrentPrice = async (symbol, running, optionChainData) => {
  if (optionChainData && optionChainData.records) {
    const niftyCurrentPrice = optionChainData.records.underlyingValue;
    if (niftyCurrentPrice) {
      const params = {
        symbol,
        running,
      };
      const symbolRate = await SymbolRate.findOne(params);
      params.currentPrice = niftyCurrentPrice;
      let updatedSymbolRate = null;
      if (!symbolRate) {
        updatedSymbolRate = await createSymbolRate(params);
      } else {
        updatedSymbolRate = await updateSymbolRateById(symbolRate.id, params);
      }
      if (!updatedSymbolRate) {
        logger.info(`Unable to update ${symbol} CurrentPrice`);
      } else {
        logger.info(`Updated ${symbol} CurrentPrice !!!`);
      }
    }
  }
};

module.exports = {
  createSymbolRate,
  querySymbolRates,
  getSymbolRateById,
  getSymbolRateBySymbolAndRunning,
  updateSymbolRateById,
  updateSymbolRateBySymbolAndRunning,
  deleteSymbolRateById,
  deleteSymbolRateBySymbolAndRunning,
  deleteAllSymbolRate,
  updateSymbolCurrentPrice,
};
