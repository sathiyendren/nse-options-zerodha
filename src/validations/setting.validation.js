const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { accountTypes, tradingTypes } = require('../config/setting');

const createSetting = {
  body: Joi.object().keys({
    appName: Joi.string().required(),
    algomojoApiKey: Joi.string().required(),
    algomojoApiSecret: Joi.string().required(),
    account: Joi.string().required().valid(accountTypes.PAPER, accountTypes.REAL),
    capital: Joi.number().required().default(100000),
    firstBuyConstant: Joi.number().required().default(2.5),
    reBuyConstant: Joi.number().required().default(1),
    trailingSLConstant: Joi.number().required().default(5),
    reBuyCusionConstant: Joi.number().required().default(100),
    tradingType: Joi.string().default(tradingTypes.NORMAL),
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
      userId: Joi.string().required().custom(objectId),
      appName: Joi.string().required(),
      algomojoApiKey: Joi.string().required(),
      algomojoApiSecret: Joi.string().required(),
      account: Joi.string().required().valid(accountTypes.PAPER, accountTypes.REAL),
      capital: Joi.number().required().default(100000),
      firstBuyConstant: Joi.number().required().default(2.5),
      reBuyConstant: Joi.number().required().default(1),
      trailingSLConstant: Joi.number().required().default(5),
      reBuyCusionConstant: Joi.number().required().default(100),
      tradingType: Joi.string().default(tradingTypes.NORMAL),
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
