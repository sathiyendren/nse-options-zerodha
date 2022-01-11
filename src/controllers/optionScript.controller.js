const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { optionScriptService } = require('../services');

const createOptionScript = catchAsync(async (req, res) => {
  const optionScript = await optionScriptService.createOptionScript(req.body);
  res.status(httpStatus.CREATED).send(optionScript);
});

const getOptionScripts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userId', 'type']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await optionScriptService.queryOptionScripts(filter, options);
  res.send(result);
});

const getOptionScript = catchAsync(async (req, res) => {
  const optionScript = await optionScriptService.getOptionScriptById(req.params.optionScriptId);
  if (!optionScript) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OptionScript not found');
  }
  res.send(optionScript);
});

const getOptionScriptsByUserId = catchAsync(async (req, res) => {
  const optionScripts = await optionScriptService.getOptionScriptByUserId(req.params.userId);
  if (!optionScripts) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OptionScripts not found');
  }
  res.send(optionScripts);
});

const updateOptionScript = catchAsync(async (req, res) => {
  const optionScript = await optionScriptService.updateOptionScriptById(req.params.optionScriptId, req.body);
  res.send(optionScript);
});

const deleteOptionScript = catchAsync(async (req, res) => {
  await optionScriptService.deleteOptionScriptById(req.params.optionScriptId);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteOptionScriptsByUserId = catchAsync(async (req, res) => {
  await optionScriptService.deleteOptionScriptsByUserId(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteAllOptionScript = catchAsync(async (req, res) => {
  await optionScriptService.deleteAllOptionScript();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createOptionScript,
  getOptionScripts,
  getOptionScript,
  getOptionScriptsByUserId,
  updateOptionScript,
  deleteOptionScript,
  deleteOptionScriptsByUserId,
  deleteAllOptionScript,
};
