const Joi = require('joi');

const createSymbolRate = {
  body: Joi.object().keys({
    symbol: Joi.string().required(),
    running: Joi.boolean().required(),
    currentPrice: Joi.number().required(),
  }),
};

const getSymbolRates = {
  query: Joi.object().keys({
    symbol: Joi.string(),
    running: Joi.string(),
  }),
};

const getSymbolRate = {
  params: Joi.object().keys({
    symbol: Joi.string(),
    running: Joi.string(),
    symbolRateId: Joi.string(),
  }),
};

const updateSymbolRate = {
  params: Joi.object().keys({
    symbolRateId: Joi.string(),
    symbol: Joi.string(),
    running: Joi.string(),
  }),
  body: Joi.object()
    .keys({
      symbol: Joi.string().required(),
      running: Joi.boolean().required(),
      currentPrice: Joi.number().required(),
    })
    .min(1),
};

const deleteSymbolRate = {
  params: Joi.object().keys({
    symbol: Joi.string(),
    running: Joi.string(),
    symbolRateId: Joi.string(),
  }),
};

module.exports = {
  createSymbolRate,
  getSymbolRates,
  getSymbolRate,
  updateSymbolRate,
  deleteSymbolRate,
};
