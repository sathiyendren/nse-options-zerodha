const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const ping = catchAsync(async (req, res) => {
  res.status(httpStatus.CREATED).send({ healthy: true });
});

module.exports = {
  ping,
};
