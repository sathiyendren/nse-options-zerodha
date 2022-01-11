const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { symbolTypes, optionTypes } = require('../config/optionScript');

const createOptionScript = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    type: Joi.string().required().valid(optionTypes.CE, optionTypes.PE),
    strikePrice: Joi.number().required(),
    expiryDate: Joi.string().required(),
    underlying: Joi.string().required().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
    identifier: Joi.string().required(),
    openInterest: Joi.number().required(),
    changeinOpenInterest: Joi.number().required(),
    pchangeinOpenInterest: Joi.number().required(),
    totalTradedVolume: Joi.number().required(),
    impliedVolatility: Joi.number().required(),
    lastPrice: Joi.number().required(),
    change: Joi.number().required(),
    pChange: Joi.number().required(),
    totalBuyQuantity: Joi.number().required(),
    totalSellQuantity: Joi.number().required(),
    bidQty: Joi.number().required(),
    bidprice: Joi.number().required(),
    askQty: Joi.number().required(),
    askPrice: Joi.number().required(),
    underlyingValue: Joi.number().required(),
  }),
};

const getOptionScripts = {
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    type: Joi.string(),
    optionScriptId: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getOptionScript = {
  params: Joi.object().keys({
    optionScriptId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
  }),
};

const updateOptionScript = {
  params: Joi.object().keys({
    optionScriptId: Joi.required().custom(objectId),
    userId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      userId: Joi.string().required(),
      type: Joi.string().required().valid(optionTypes.CE, optionTypes.PE),
      strikePrice: Joi.number().required(),
      expiryDate: Joi.string().required(),
      underlying: Joi.string().required().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
      identifier: Joi.string().required(),
      openInterest: Joi.number().required(),
      changeinOpenInterest: Joi.number().required(),
      pchangeinOpenInterest: Joi.number().required(),
      totalTradedVolume: Joi.number().required(),
      impliedVolatility: Joi.number().required(),
      lastPrice: Joi.number().required(),
      change: Joi.number().required(),
      pChange: Joi.number().required(),
      totalBuyQuantity: Joi.number().required(),
      totalSellQuantity: Joi.number().required(),
      bidQty: Joi.number().required(),
      bidprice: Joi.number().required(),
      askQty: Joi.number().required(),
      askPrice: Joi.number().required(),
      underlyingValue: Joi.number().required(),
    })
    .min(1),
};

const deleteOptionScript = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    optionScriptId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createOptionScript,
  getOptionScripts,
  getOptionScript,
  updateOptionScript,
  deleteOptionScript,
};
