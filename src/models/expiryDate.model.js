const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { symbolTypes } = require('../config/optionScript');

const expiryDateSchema = mongoose.Schema(
  {
    symbol: {
      type: String,
      enum: [symbolTypes.NIFTY, symbolTypes.BANKNIFTY],
      required: true,
    },
    expiryDates: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
expiryDateSchema.plugin(toJSON);
expiryDateSchema.plugin(paginate);

/**
 * Check if symbol is taken
 * @param {string} symbol - The user's symbol
 * @returns {Promise<boolean>}
 */
expiryDateSchema.statics.isSymbolTaken = async function (symbol) {
  const expiryDate = await this.findOne({ symbol });
  return !!expiryDate;
};

/**
 * @typedef ExpiryDate
 */
const ExpiryDate = mongoose.model('ExpiryDate', expiryDateSchema);

module.exports = ExpiryDate;
