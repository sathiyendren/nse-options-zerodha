const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { accountTypes, tradingTypes } = require('../config/setting');

const settingSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    appName: {
      type: String,
      required: true,
    },
    algomojoApiKey: {
      type: String,
      required: true,
    },
    algomojoApiSecret: {
      type: String,
      required: true,
    },
    account: {
      type: String,
      enum: [accountTypes.PAPER, accountTypes.REAL],
      required: true,
    },
    capital: {
      type: Number,
      required: true,
    },
    firstBuyConstant: {
      type: Number,
      required: true,
    },
    reBuyConstant: {
      type: Number,
      required: true,
    },
    reBuyCusionConstant: {
      type: Number,
      required: true,
    },
    tradingType: {
      type: String,
      enum: [tradingTypes.NORMAL, tradingTypes.NEAR_RANGE, tradingTypes.ANYTIME],
      required: true,
    },
    trailingSLConstant: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
settingSchema.plugin(toJSON);
settingSchema.plugin(paginate);

/**
 * Check if userId is taken
 * @param {string} userId - The setting's userId
 * @returns {Promise<boolean>}
 */
settingSchema.statics.isUserIdTaken = async function (userId) {
  const setting = await this.findOne({ userId });
  return !!setting;
};

/**
 * @typedef Setting
 */
const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
