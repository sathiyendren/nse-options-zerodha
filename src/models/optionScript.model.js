const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { optionTypes } = require('../config/optionScript');

const optionScriptSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [optionTypes.CE, optionTypes.PE],
      required: true,
    },
    strikePrice: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    underlying: {
      type: String,
      required: true,
    },
    identifier: {
      type: String,
      required: true,
    },
    openInterest: {
      type: Number,
      required: true,
    },
    changeinOpenInterest: {
      type: Number,
      required: true,
    },
    pchangeinOpenInterest: {
      type: Number,
      required: true,
    },
    totalTradedVolume: {
      type: Number,
      required: true,
    },
    impliedVolatility: {
      type: Number,
      required: true,
    },
    lastPrice: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      required: true,
    },
    pChange: {
      type: Number,
      required: true,
    },
    totalBuyQuantity: {
      type: Number,
      required: true,
    },
    totalSellQuantity: {
      type: Number,
      required: true,
    },
    bidQty: {
      type: Number,
      required: true,
    },
    bidprice: {
      type: Number,
      required: true,
    },
    askQty: {
      type: Number,
      required: true,
    },
    askPrice: {
      type: Number,
      required: true,
    },
    underlyingValue: {
      type: Number,
      required: true,
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
optionScriptSchema.statics.isIdentifierTaken = async function (identifier) {
  const optionScript = await this.findOne({ identifier });
  return !!optionScript;
};

/**
 * Check if identifier is taken
 * @param {string} identifier - The user's symbol
 * @param {string} userId - The user's symbol
 * @returns {Promise<boolean>}
 */
optionScriptSchema.statics.isIdentifierTakenForUser = async function (identifier, userId) {
  const optionScript = await this.findOne({ identifier, userId });
  return !!optionScript;
};

/**
 * @typedef OptionScript
 */
const optionScript = mongoose.model('optionScript', optionScriptSchema);

module.exports = optionScript;
