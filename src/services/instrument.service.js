const httpStatus = require('http-status');
const logger = require('../config/logger');
const { Instrument } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a Instrument
 * @param {Object} instrumentBody
 * @returns {Promise<Instrument>}
 */
const createInstrument = async (instrumentBody) => {
  if (await Instrument.isInstrumentTokenTaken(instrumentBody.instrumentToken)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'InstrumentToken already taken');
  }
  return Instrument.create(instrumentBody);
};

const createInstruments = async (instruments) => {
  return Instrument.collection.insert(instruments);
};

/**
 * Query for Instruments
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInstruments = async (filter, options) => {
  const instruments = await Instrument.paginate(filter, options);
  return instruments;
};

/**
 * Get Instrument by id
 * @param {ObjectId} id
 * @returns {Promise<Instrument>}
 */
const getInstrumentById = async (id) => {
  return Instrument.findById(id);
};

/**
 * Update instrument by id
 * @param {ObjectId} instrumentId
 * @param {Object} updateBody
 * @returns {Promise<Instrument>}
 */
const updateInstrumentById = async (instrumentId, updateBody) => {
  const instrument = await getInstrumentById(instrumentId);
  if (!instrument) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Instrument not found');
  }

  Object.assign(instrument, updateBody);
  await instrument.save();
  return instrument;
};

/**
 * Delete instrument by id
 * @param {ObjectId} instrumentId
 * @returns {Promise<Instrument>}
 */
const deleteInstrumentById = async (instrumentId) => {
  const instrument = await getInstrumentById(instrumentId);
  if (!instrument) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Instrument not found');
  }
  await instrument.remove();
  return instrument;
};

/**
 * Delete all Instrument
 * @returns {Promise<Instrument>}
 */
const deleteAllInstrument = async () => {
  const instruments = await Instrument.remove({}, (error) => {
    if (error) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Unable to delete all Instruments');
    }
  });
  return instruments;
};

module.exports = {
  createInstrument,
  createInstruments,
  queryInstruments,
  getInstrumentById,
  updateInstrumentById,
  deleteInstrumentById,
  deleteAllInstrument,
};
