const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { symbolRateService } = require('../services');

const createSymbolRate = catchAsync(async (req, res) => {
  const symbolRate = await symbolRateService.createSymbolRate(req.body);
  res.status(httpStatus.CREATED).send(symbolRate);
});

const getSymbolRates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['symbol', 'running']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await symbolRateService.querySymbolRates(filter, options);
  res.send(result);
});

const getSymbolRate = catchAsync(async (req, res) => {
  let symbolRate = null;
  if (req.params.symbolRateId) {
    symbolRate = await symbolRateService.getSymbolRateById(req.params.symbolRateId);
  } else if (req.params.symbol && req.params.running) {
    symbolRate = await symbolRateService.getSymbolRateBySymbolAndRunning(req.params.symbol, req.params.running === 'true');
  }

  if (!symbolRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SymbolRate not found');
  }
  res.send(symbolRate);
});

const updateSymbolRate = catchAsync(async (req, res) => {
  let symbolRate = null;
  if (req.params.symbolRateId) {
    symbolRate = await symbolRateService.updateSymbolRateById(req.params.symbolRateId, req.body);
  } else if (req.params.symbol && req.params.running) {
    symbolRate = await symbolRateService.updateSymbolRateBySymbolAndRunning(
      req.params.symbol,
      req.params.running === 'true',
      req.body
    );
  }
  res.send(symbolRate);
});

const deleteSymbolRate = catchAsync(async (req, res) => {
  if (req.params.symbolRateId) {
    await symbolRateService.deleteSymbolRateById(req.params.symbolRateId);
  } else if (req.params.symbol && req.params.running) {
    await symbolRateService.deleteSymbolRateBySymbolAndRunning(req.params.symbol, req.params.running === 'true');
  }
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteAllSymbolRate = catchAsync(async (req, res) => {
  await symbolRateService.deleteAllSymbolRate();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSymbolRate,
  getSymbolRates,
  getSymbolRate,
  updateSymbolRate,
  deleteSymbolRate,
  deleteAllSymbolRate,
};
