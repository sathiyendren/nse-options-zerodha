const httpStatus = require('http-status');
const { ExpiryDate } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create a expiryDate
 * @param {Object} expiryDateBody
 * @returns {Promise<User>}
 */
const createExpiryDate = async (expiryDateBody) => {
  if (await ExpiryDate.isSymbolTaken(expiryDateBody.symbol)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Symbol already taken');
  }
  return ExpiryDate.create(expiryDateBody);
};

/**
 * Query for expiryDates
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1) * @returns {Promise<QueryResult>}
 */
const queryExpiryDates = async (filter, options) => {
  const expiryDates = await ExpiryDate.paginate(filter, options);
  return expiryDates;
};

/**
 * Get ExpiryDate by id
 * @param {ObjectId} id
 * @returns {Promise<ExpiryDate>}
 */
const getExpiryDateById = async (id) => {
  return ExpiryDate.findById(id);
};

/**
 * Get ExpiryDate by symbol
 * @param {string} symbol
 * @returns {Promise<ExpiryDate>}
 */
const getExpiryDateBySymbol = async (symbol) => {
  return ExpiryDate.findOne({ symbol });
};

/**
 * Update ExpiryDate by id
 * @param {ObjectId} expiryDateId
 * @param {Object} updateBody
 * @returns {Promise<ExpiryDate>}
 */
const updateExpiryDateById = async (expiryDateId, updateBody) => {
  const expiryDate = await getExpiryDateById(expiryDateId);
  if (!expiryDate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExpiryDate not found');
  }

  Object.assign(expiryDate, updateBody);
  await expiryDate.save();
  return expiryDate;
};

/**
 * Update ExpiryDate by symbol
 * @param {string} symbol
 * @param {Object} updateBody
 * @returns {Promise<ExpiryDate>}
 */
const updateExpiryDateBySymbol = async (symbol, updateBody) => {
  const expiryDate = await getExpiryDateBySymbol(symbol);
  if (!expiryDate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExpiryDate not found');
  }

  Object.assign(expiryDate, updateBody);
  await expiryDate.save();
  logger.info(`Updated ${symbol} Expiry Dates !!!`);
  return expiryDate;
};

/**
 * Delete ExpiryDate by id
 * @param {ObjectId} expiryDateId
 * @returns {Promise<ExpiryDate>}
 */
const deleteExpiryDateById = async (userId) => {
  const expiryDate = await getExpiryDateById(userId);
  if (!expiryDate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExpiryDate not found');
  }
  await expiryDate.remove();
  return expiryDate;
};

/**
 * Delete ExpiryDate by symbol
 * @param {string} symbol
 * @returns {Promise<ExpiryDate>}
 */
const deleteExpiryDateBySymbol = async (symbol) => {
  const expiryDate = await getExpiryDateBySymbol(symbol);
  if (!expiryDate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExpiryDate not found');
  }
  await expiryDate.remove();
  return expiryDate;
};

/**
 * Delete all ExpiryDate
 * @returns {Promise<ExpiryDate>}
 */
const deleteAllExpiryDate = async () => {
  const expiryDates = await ExpiryDate.remove({}, (error) => {
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete all Expiry Dates');
    }
  });
  return expiryDates;
};

/**
 * Update Nifity and BankNifty Current Price
 * @param {boolean} running
 * @returns {Promise<OptionScript>}
 */
const updateExpiryDatesForSymbol = async (symbol, optionChainData) => {
  if (optionChainData && optionChainData.records) {
    const { expiryDates } = optionChainData.records;
    if (expiryDates) {
      const params = {
        symbol,
      };
      const expiryDate = await ExpiryDate.findOne(params);
      params.expiryDates = expiryDates;
      let updatedExpiryDate = null;
      if (!expiryDate) {
        updatedExpiryDate = await createExpiryDate(params);
      } else {
        updatedExpiryDate = await updateExpiryDateById(expiryDate.id, params);
      }
      if (!updatedExpiryDate) {
        logger.info(`Unable to update ${symbol} ExpiryDates...`);
      } else {
        logger.info(`Updated ${symbol} ExpiryDates !!!`);
      }
    }
  }
};

module.exports = {
  createExpiryDate,
  queryExpiryDates,
  getExpiryDateById,
  getExpiryDateBySymbol,
  updateExpiryDateById,
  updateExpiryDateBySymbol,
  updateExpiryDatesForSymbol,
  deleteExpiryDateById,
  deleteExpiryDateBySymbol,
  deleteAllExpiryDate,
};
