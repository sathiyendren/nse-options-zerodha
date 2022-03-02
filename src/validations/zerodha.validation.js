const Joi = require('joi');

const refreshConfig = {
  query: Joi.object().keys({
    userId: Joi.string(),
  }),
};

const placeOrder = {
  body: Joi.object().keys({
    api_key: Joi.string(),
    api_secret: Joi.string(),
    data: Joi.object(),
  }),
};

module.exports = {
  refreshConfig,
  placeOrder,
};
