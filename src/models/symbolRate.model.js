const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { symbolTypes } = require('../config/optionScript');

const symbolRateSchema = mongoose.Schema(
  {
    symbol: {
      type: String,
      enum: [symbolTypes.NIFTY, symbolTypes.BANKNIFTY],
      required: true,
    },
    currentPrice: {
      type: Number,
      required: false,
    },
    running: {
      type: Boolean,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
symbolRateSchema.plugin(toJSON);
symbolRateSchema.plugin(paginate);

/**
 * Check if symbol and running is taken
 * @param {string} symbol - The user's symbol
 * @returns {Promise<boolean>}
 */
symbolRateSchema.statics.isSymbolAndRunningTaken = async function (symbol, running) {
  const symbolRate = await this.findOne({ symbol, running });
  return !!symbolRate;
};

/**
 * @typedef SymbolRate
 */
const SymbolRate = mongoose.model('SymbolRate', symbolRateSchema);

module.exports = SymbolRate;
