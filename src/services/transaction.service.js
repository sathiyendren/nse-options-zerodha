const httpStatus = require('http-status');
const { Transaction } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a transaction
 * @param {Object} transactionBody
 * @returns {Promise<Transaction>}
 */
const createTransaction = async (transactionBody) => {
  return Transaction.create(transactionBody);
};

/**
 * Query for transactions
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1) * @returns {Promise<QueryResult>}
 */
const queryTransactions = async (filter, options) => {
  const transactions = await Transaction.paginate(filter, options);
  return transactions;
};

/**
 * Get Transaction by id
 * @param {ObjectId} id
 * @returns {Promise<Transaction>}
 */
const getTransactionById = async (id) => {
  return Transaction.findById(id);
};

/**
 * Get Transaction by active, tradeDate, userId
 * @param {string} active
 * @param {string} tradeDate
 * @param {string} userId
 * @returns {Promise<[Transaction]>}
 */
const getTransactionsByActiveTradeDateUser = async (active, tradeDate, userId) => {
  return Transaction.find({ active, tradeDate, userId });
};

const getTransactionsByUserTradeDatePreStart = async (preStart, tradeDate, userId, type, strikePrice, symbol) => {
  return Transaction.findOne({ preStart, tradeDate, userId, type, strikePrice, symbol });
};

const getLastTransactionByUserTradeDateBuy = async (tradeDate, userId, type, strikePrice, symbol) => {
  return Transaction.find({ tradeDate, userId, type, strikePrice, symbol }).sort({ createdAt: 'desc' }).limit(1);
};

const getLastTransactionByActiveUserTradeDateSell = async (active, tradeDate, userId, type, strikePrice, symbol) => {
  return Transaction.find({ active, tradeDate, userId, type, strikePrice, symbol }).sort({ createdAt: 'desc' }).limit(1);
};
/**
 * Update Transaction by id
 * @param {ObjectId} transactionId
 * @param {Object} updateBody
 * @returns {Promise<Transaction>}
 */
const updateTransactionById = async (transactionId, updateBody) => {
  const transaction = await getTransactionById(transactionId);
  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  Object.assign(transaction, updateBody);
  await transaction.save();
  return transaction;
};

/**
 * Delete Transaction by id
 * @param {ObjectId} transactionId
 * @returns {Promise<Transaction>}
 */
const deleteTransactionById = async (userId) => {
  const transaction = await getTransactionById(userId);
  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }
  await transaction.remove();
  return transaction;
};

/**
 * Delete all Transaction
 * @returns {Promise<Transaction>}
 */
const deleteAllTransaction = async () => {
  const transactions = await Transaction.remove({}, (error) => {
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete all Expiry Dates');
    }
  });
  return transactions;
};

module.exports = {
  createTransaction,
  queryTransactions,
  getTransactionsByActiveTradeDateUser,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
  deleteAllTransaction,
  getTransactionsByUserTradeDatePreStart,
  getLastTransactionByUserTradeDateBuy,
  getLastTransactionByActiveUserTradeDateSell,
};
