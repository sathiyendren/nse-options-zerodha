const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { settingService } = require('../services');

const createSetting = catchAsync(async (req, res) => {
  const setting = await settingService.createSetting(req.body);
  res.status(httpStatus.CREATED).send(setting);
});

const getSettings = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await settingService.querySettings(filter, options);
  res.send(result);
});

const getSetting = catchAsync(async (req, res) => {
  let setting = null;
  if (req.params.settingId) {
    setting = await settingService.getSettingById(req.params.settingId);
  } else if (req.params.userId) {
    setting = await settingService.getSettingByUserId(req.params.userId);
  }

  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
  }
  res.send(setting);
});

const updateSetting = catchAsync(async (req, res) => {
  let setting = null;
  if (req.params.settingId) {
    setting = await settingService.updateSettingById(req.params.settingId, req.body);
  } else if (req.params.userId) {
    setting = await settingService.updateSettingByUserId(req.params.userId, req.body);
  }
  res.send(setting);
});

const deleteSetting = catchAsync(async (req, res) => {
  if (req.params.settingId) {
    await settingService.deleteSettingById(req.params.settingId);
  } else if (req.params.userId) {
    await settingService.deleteSettingByUserId(req.params.userId);
  }
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteAllSetting = catchAsync(async (req, res) => {
  await settingService.deleteAllSetting();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSetting,
  getSettings,
  getSetting,
  updateSetting,
  deleteSetting,
  deleteAllSetting,
};
