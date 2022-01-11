// const httpStatus = require('http-status');
const pick = require('../utils/pick');
// const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { optionChainService } = require('../services');

const getOptionChain = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['symbol', 'expiryDate']);
  const result = await optionChainService.queryOptionChain(filter);
  res.send(result);
});

module.exports = {
  getOptionChain,
};
