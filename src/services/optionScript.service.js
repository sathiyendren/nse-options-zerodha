const httpStatus = require('http-status');
const { OptionScript } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a OptionScript
 * @param {Object} optionScriptBody
 * @returns {Promise<OptionScript>}
 */
const createOptionScript = async (optionScriptBody) => {
  if (await OptionScript.isIdentifierTakenForUser(optionScriptBody.identifier, optionScriptBody.userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Identifier already taken');
  }
  return OptionScript.create(optionScriptBody);
};

/**
 * Query for OptionScripts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryOptionScripts = async (filter, options) => {
  const optionScripts = await OptionScript.paginate(filter, options);
  return optionScripts;
};

/**
 * Get OptionScript by id
 * @param {ObjectId} id
 * @returns {Promise<OptionScript>}
 */
const getOptionScriptById = async (id) => {
  return OptionScript.findById(id);
};

/**
 * Get OptionScript by userId
 * @param {string} userId
 * @returns {Promise<OptionScript>}
 */
const getOptionScriptByUserId = async (userId) => {
  return OptionScript.find({ userId });
};

/**
 * Update optionScript by id
 * @param {ObjectId} optionScriptId
 * @param {Object} updateBody
 * @returns {Promise<OptionScript>}
 */
const updateOptionScriptById = async (optionScriptId, updateBody) => {
  const optionScript = await getOptionScriptById(optionScriptId);
  if (!optionScript) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OptionScript not found');
  }

  Object.assign(optionScript, updateBody);
  await optionScript.save();
  return optionScript;
};

/**
 * Delete optionScript by id
 * @param {ObjectId} optionScriptId
 * @returns {Promise<OptionScript>}
 */
const deleteOptionScriptById = async (optionScriptId) => {
  const optionScript = await getOptionScriptById(optionScriptId);
  if (!optionScript) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OptionScript not found');
  }
  await optionScript.remove();
  return optionScript;
};

/**
 * Delete optionScripts by userId
 * @param {string} userId
 * @returns {Promise<OptionScript>}
 */
const deleteOptionScriptsByUserId = async (userId) => {
  const optionScripts = await getOptionScriptByUserId(userId);
  if (!optionScripts) {
    throw new ApiError(httpStatus.NOT_FOUND, 'OptionScripts not found');
  }
  await OptionScript.deleteMany({ userId });
  return optionScripts;
};

/**
 * Delete all OptionScript
 * @returns {Promise<OptionScript>}
 */
const deleteAllOptionScript = async () => {
  const optionScripts = await OptionScript.remove({}, (error) => {
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete all OptionScripts');
    }
  });
  return optionScripts;
};

module.exports = {
  createOptionScript,
  queryOptionScripts,
  getOptionScriptById,
  getOptionScriptByUserId,
  updateOptionScriptById,
  deleteOptionScriptById,
  deleteOptionScriptsByUserId,
  deleteAllOptionScript,
};
