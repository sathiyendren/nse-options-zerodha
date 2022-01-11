const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { symbolTypes, optionTypes } = require('../config/optionScript');

const createTransaction = {
  body: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
    strikePrice: Joi.number().required(),
    type: Joi.string().required().valid(optionTypes.CE, optionTypes.PE),
    expiryDate: Joi.string().required(),
    symbol: Joi.string().required().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
    tradeDate: Joi.string().required(),
    capital: Joi.number().required().default(0),
    quantity: Joi.number().required().default(0),
    boughtPrice: Joi.number().required().default(0),
    highestPrice: Joi.number().required().default(0),
    lowestPrice: Joi.number().required().default(0),
    currentPrice: Joi.number().required().default(0),
    soldPrice: Joi.number().default(0),
    profit: Joi.number().default(0),
    active: Joi.boolean().default(false),
    preStart: Joi.boolean().default(false),
    paused: Joi.boolean().default(false),
  }),
};

const getTransactions = {
  query: Joi.object().keys({
    transactionId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
    strikePrice: Joi.number(),
    type: Joi.string().valid(optionTypes.CE, optionTypes.PE),
    expiryDate: Joi.string(),
    symbol: Joi.string().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
    tradeDate: Joi.string(),
    active: Joi.boolean().default(false),
    preStart: Joi.boolean().default(false),
    paused: Joi.boolean().default(false),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTransaction = {
  params: Joi.object().keys({
    transactionId: Joi.string().custom(objectId),
    userId: Joi.string().custom(objectId),
    strikePrice: Joi.number(),
    type: Joi.string().valid(optionTypes.CE, optionTypes.PE),
    expiryDate: Joi.string(),
    symbol: Joi.string().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
    tradeDate: Joi.string(),
    active: Joi.boolean().default(false),
    preStart: Joi.boolean().default(false),
    paused: Joi.boolean().default(false),
  }),
};

const updateTransaction = {
  params: Joi.object().keys({
    transactionId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      userId: Joi.string().required().custom(objectId),
      strikePrice: Joi.number().required(),
      type: Joi.string().required().valid(optionTypes.CE, optionTypes.PE),
      expiryDate: Joi.string().required(),
      symbol: Joi.string().required().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
      tradeDate: Joi.string().required(),
      capital: Joi.number().required().default(0),
      quantity: Joi.number().required().default(0),
      boughtPrice: Joi.number().required().default(0),
      highestPrice: Joi.number().required().default(0),
      currentPrice: Joi.number().required().default(0),
      lowestPrice: Joi.number().required().default(0),
      soldPrice: Joi.number().required().default(0),
      profit: Joi.number().default(0),
      active: Joi.boolean().default(false),
      preStart: Joi.boolean().default(false),
      paused: Joi.boolean().default(false),
    })
    .min(1),
};

const deleteTransaction = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    transactionId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};
