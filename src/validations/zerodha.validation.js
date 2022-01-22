const Joi = require('joi');

const refreshConfig = {
  query: Joi.object().keys({
    userId: Joi.string(),
  }),
};

module.exports = {
  refreshConfig,
};
