const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { accountTypes, tradingTypes } = require('../config/setting');

const createSetting = {
  body: Joi.object().keys({
    appName: Joi.string().required(),
    algomojoApiKey: Joi.string(),
    algomojoApiSecret: Joi.string(),
    account: Joi.string().required().valid(accountTypes.PAPER, accountTypes.REAL),
    capital: Joi.number().required().default(100000),
    firstBuyConstant: Joi.number().required().default(2.5),
    reBuyConstant: Joi.number().required().default(1),
    reBuyCusionConstant: Joi.number().required().default(100),
    tradingType: Joi.string()
      .default(tradingTypes.NORMAL)
      .valid(tradingTypes.ANYTIME, tradingTypes.NEAR_RANGE, tradingTypes.NORMAL),
    trailingSLConstant: Joi.number().required().default(5),
    zerodhaAccessToken: Joi.string(),
    zerodhaApiKey: Joi.string(),
    zerodhaApiSecret: Joi.string(),
    zerodhaRequestToken: Joi.string(),
    userId: Joi.string().required().custom(objectId),
  }),
};

const getSettings = {
  query: Joi.object().keys({
    userId: Joi.string(),
    appName: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSetting = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    settingId: Joi.string().custom(objectId),
  }),
};

const updateSetting = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    settingId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      userId: Joi.string().custom(objectId),
      appName: Joi.string(),
      algomojoApiKey: Joi.string(),
      algomojoApiSecret: Joi.string(),
      account: Joi.string().valid(accountTypes.PAPER, accountTypes.REAL),
      capital: Joi.number(),
      firstBuyConstant: Joi.number(),
      reBuyConstant: Joi.number(),
      trailingSLConstant: Joi.number(),
      reBuyCusionConstant: Joi.number(),
      tradingType: Joi.string().valid(tradingTypes.ANYTIME, tradingTypes.NEAR_RANGE, tradingTypes.NORMAL),
      zerodhaAccessToken: Joi.string().allow(''),
      zerodhaApiKey: Joi.string(),
      zerodhaApiSecret: Joi.string(),
      zerodhaRequestToken: Joi.string(),
    })
    .min(1),
};

const deleteSetting = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    settingId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createSetting,
  getSettings,
  getSetting,
  updateSetting,
  deleteSetting,
};
