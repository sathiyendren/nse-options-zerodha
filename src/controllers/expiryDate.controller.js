const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { expiryDateService } = require('../services');

const createExpiryDate = catchAsync(async (req, res) => {
  const expiryDate = await expiryDateService.createExpiryDate(req.body);
  res.status(httpStatus.CREATED).send(expiryDate);
});

const getExpiryDates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['symbol']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await expiryDateService.queryExpiryDates(filter, options);
  res.send(result);
});

const getExpiryDate = catchAsync(async (req, res) => {
  let expiryDate = null;
  if (req.params.expiryDateId) {
    expiryDate = await expiryDateService.getExpiryDateById(req.params.expiryDateId);
  } else if (req.params.symbol) {
    expiryDate = await expiryDateService.getExpiryDateBySymbol(req.params.symbol);
  }

  if (!expiryDate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExpiryDate not found');
  }
  res.send(expiryDate);
});

const updateExpiryDate = catchAsync(async (req, res) => {
  let expiryDate = null;
  if (req.params.expiryDateId) {
    expiryDate = await expiryDateService.updateExpiryDateById(req.params.expiryDateId, req.body);
  } else if (req.params.symbol) {
    expiryDate = await expiryDateService.updateExpiryDateBySymbol(req.params.symbol, req.body);
  }
  res.send(expiryDate);
});

const deleteExpiryDate = catchAsync(async (req, res) => {
  if (req.params.expiryDateId) {
    await expiryDateService.deleteExpiryDateById(req.params.expiryDateId);
  } else if (req.params.symbol) {
    await expiryDateService.deleteExpiryDateBySymbol(req.params.symbol);
  }
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteAllExpiryDate = catchAsync(async (req, res) => {
  await expiryDateService.deleteAllExpiryDate();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createExpiryDate,
  getExpiryDates,
  getExpiryDate,
  updateExpiryDate,
  deleteExpiryDate,
  deleteAllExpiryDate,
};
