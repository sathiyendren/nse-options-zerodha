const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { optionTypes, symbolTypes } = require('../config/optionScript');

const transactionSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    strikePrice: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [optionTypes.PE, optionTypes.CE],
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      enum: [symbolTypes.NIFTY, symbolTypes.BANKNIFTY],
      required: true,
    },
    tradingSymbol: {
      type: String,
      required: true,
    },
    tradeDate: {
      type: String,
      required: true,
    },
    capital: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
    },
    boughtPrice: {
      type: Number,
      required: false,
    },
    highestPrice: {
      type: Number,
      required: false,
    },
    lowestPrice: {
      type: Number,
      required: false,
    },
    currentPrice: {
      type: Number,
      required: false,
    },
    soldPrice: {
      type: Number,
      required: false,
    },
    profit: {
      type: Number,
      required: false,
    },
    active: {
      type: Boolean,
      required: false,
    },
    preStart: {
      type: Boolean,
      required: false,
    },
    paused: {
      type: Boolean,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to json
transactionSchema.plugin(toJSON);
transactionSchema.plugin(paginate);

/**
 * Check if userId is taken
 * @param {string} userId - The transaction's userId
 * @returns {Promise<boolean>}
 */
transactionSchema.statics.isTransactionTaken = async function ({
  userId,
  strikePrice,
  type,
  expiryDate,
  symbol,
  tradingSymbol,
  tradeDate,
}) {
  const transaction = await this.findOne({ userId, strikePrice, type, expiryDate, symbol, tradingSymbol, tradeDate });
  return !!transaction;
};

/**
 * @typedef Transaction
 */
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
