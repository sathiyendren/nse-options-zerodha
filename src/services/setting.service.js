const httpStatus = require('http-status');
const { Setting } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a Setting
 * @param {Object} SettingBody
 * @returns {Promise<Setting>}
 */
const createSetting = async (settingBody) => {
  if (await Setting.isUserIdTaken(settingBody.userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'UserId already taken');
  }
  return Setting.create(settingBody);
};

/**
 * Query for Settings
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1) * @returns {Promise<QueryResult>}
 */
const querySettings = async (filter, options) => {
  const Settings = await Setting.paginate(filter, options);
  return Settings;
};

/**
 * Get Setting by id
 * @param {ObjectId} id
 * @returns {Promise<Setting>}
 */
const getSettingById = async (id) => {
  return Setting.findById(id);
};

/**
 * Get Setting by userId
 * @param {string} userId
 * @returns {Promise<Setting>}
 */
const getSettingByUserId = async (userId) => {
  return Setting.findOne({ userId });
};

/**
 * Update Setting by id
 * @param {ObjectId} settingId
 * @param {Object} updateBody
 * @returns {Promise<Setting>}
 */
const updateSettingById = async (settingId, updateBody) => {
  const setting = await getSettingById(settingId);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
  }

  Object.assign(setting, updateBody);
  await setting.save();
  return setting;
};

/**
 * Update Setting by userId
 * @param {string} userId
 * @param {Object} updateBody
 * @returns {Promise<Setting>}
 */
const updateSettingByUserId = async (userId, updateBody) => {
  const setting = await getSettingByUserId(userId);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
  }

  Object.assign(setting, updateBody);
  await setting.save();
  return setting;
};

/**
 * Delete Setting by id
 * @param {ObjectId} settingId
 * @returns {Promise<Setting>}
 */
const deleteSettingById = async (settingId) => {
  const setting = await getSettingById(settingId);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
  }
  await setting.remove();
  return setting;
};

/**
 * Delete Setting by userId
 * @param {string} userId
 * @returns {Promise<Setting>}
 */
const deleteSettingByUserId = async (userId) => {
  const setting = await getSettingByUserId(userId);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Setting not found');
  }
  await setting.remove();
  return setting;
};

/**
 * Delete all Setting
 * @returns {Promise<Setting>}
 */
const deleteAllSetting = async () => {
  const settings = await Setting.remove({}, (error) => {
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete all Setting');
    }
  });
  return settings;
};

module.exports = {
  createSetting,
  querySettings,
  getSettingById,
  getSettingByUserId,
  updateSettingById,
  updateSettingByUserId,
  deleteSettingById,
  deleteSettingByUserId,
  deleteAllSetting,
};
