const Joi = require('joi');
const { symbolTypes } = require('../config/optionScript');

const getOptionScripts = {
  query: Joi.object().keys({
    symbol: Joi.string().required().valid(symbolTypes.NIFTY, symbolTypes.BANKNIFTY),
    expiryDate: Joi.string().required(),
  }),
};

module.exports = {
  getOptionScripts,
};
