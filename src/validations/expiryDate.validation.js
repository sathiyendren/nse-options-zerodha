const Joi = require('joi');

const createExpiryDate = {
  body: Joi.object().keys({
    symbol: Joi.string().required(),
    expiryDates: Joi.array().items(Joi.string()),
  }),
};

const getExpiryDates = {
  query: Joi.object().keys({
    symbol: Joi.string(),
  }),
};

const getExpiryDate = {
  params: Joi.object().keys({
    symbol: Joi.string(),
    expiryDateId: Joi.string(),
  }),
};

const updateExpiryDate = {
  params: Joi.object().keys({
    symbol: Joi.string(),
    expiryDateId: Joi.string(),
  }),
  body: Joi.object()
    .keys({
      symbol: Joi.string().required(),
      expiryDates: Joi.array().items(Joi.string()),
    })
    .min(1),
};

const deleteExpiryDate = {
  params: Joi.object().keys({
    symbol: Joi.string(),
    expiryDateId: Joi.string(),
  }),
};

module.exports = {
  createExpiryDate,
  getExpiryDates,
  getExpiryDate,
  updateExpiryDate,
  deleteExpiryDate,
};
