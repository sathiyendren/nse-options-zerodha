const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { optionTypes } = require('../config/optionScript');

const optionScriptSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    instrument_token: {
      type: String,
      required: true,
    },
    exchange_token: {
      type: String,
      required: true,
    },
    tradingsymbol: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    last_price: {
      type: Number,
      required: true,
    },
    expiry: {
      type: Date,
      required: true,
    },
    strike: {
      type: Number,
      required: true,
    },
    tick_size: {
      type: Number,
      required: true,
    },
    lot_size: {
      type: Number,
      required: true,
    },
    instrument_type: {
      type: String,
      enum: [optionTypes.CE, optionTypes.PE],
      required: true,
    },
    segment: {
      type: String,
      required: true,
    },
    exchange: {
      type: String,
      required: true,
    },
    auto: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
optionScriptSchema.plugin(toJSON);
optionScriptSchema.plugin(paginate);

/**
 * Check if identifier is taken
 * @param {string} identifier - The user's symbol
 * @returns {Promise<boolean>}
 */
optionScriptSchema.statics.isTradingSymbolTaken = async function (tradingSymbol) {
  const optionScript = await this.findOne({ tradingSymbol });
  return !!optionScript;
};

/**
 * Check if identifier is taken
 * @param {string} identifier - The user's symbol
 * @param {string} userId - The user's symbol
 * @returns {Promise<boolean>}
 */
optionScriptSchema.statics.isTradingSymbolTakenForUser = async function (tradingSymbol, userId) {
  const optionScript = await this.findOne({ tradingSymbol, userId });
  return !!optionScript;
};

/**
 * @typedef OptionScript
 */
const optionScript = mongoose.model('optionScript', optionScriptSchema);

module.exports = optionScript;
