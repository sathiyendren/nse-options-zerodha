const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { zerodhaService } = require('../services');

const refreshZerodhaConfig = catchAsync(async (req, res) => {
  await zerodhaService.refreshZerodhaConfig();
  res.status(httpStatus.CREATED).send({ status: 'success' });
});

const placeSingleOrder = catchAsync(async (req, res) => {
  await zerodhaService.placeSingleOrder(req.body);
  res.status(httpStatus.CREATED).send({ status: 'success' });
});

const placeMultipleOrder = catchAsync(async (req, res) => {
  await zerodhaService.placeMultipleOrder(req.body);
  res.status(httpStatus.CREATED).send({ status: 'success' });
});

module.exports = {
  refreshZerodhaConfig,
  placeSingleOrder,
  placeMultipleOrder,
};
