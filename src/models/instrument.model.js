const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { optionTypes, symbolTypes } = require('../config/optionScript');

const instrumentSchema = mongoose.Schema(
  {
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
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
instrumentSchema.plugin(toJSON);
instrumentSchema.plugin(paginate);

/**
 * Check if userId is taken
 * @param {string} userId - The instrument's userId
 * @returns {Promise<boolean>}
 */
instrumentSchema.statics.isInstrumentTokenTaken = async function (instrumentToken) {
  const instrument = await this.findOne({ instrumentToken });
  return !!instrument;
};

/**
 * @typedef Instrument
 */
const Instrument = mongoose.model('Instrument', instrumentSchema);

module.exports = Instrument;
