const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const symbolRateValidation = require('../../validations/symbolRate.validation');
const symbolRateController = require('../../controllers/symbolRate.controller');

const router = express.Router();
// 'getSymbolRate', 'manageSymbolRate'
router
  .route('/')
  .post(validate(symbolRateValidation.createSymbolRate), symbolRateController.createSymbolRate)
  .get(validate(symbolRateValidation.getSymbolRates), symbolRateController.getSymbolRates)
  .delete(symbolRateController.deleteAllSymbolRate);

router
  .route('/:symbolRateId')
  .get(validate(symbolRateValidation.getSymbolRate), symbolRateController.getSymbolRate)
  .patch(validate(symbolRateValidation.updateSymbolRate), symbolRateController.updateSymbolRate)
  .delete(auth('manageSymbolRate'), validate(symbolRateValidation.deleteSymbolRate), symbolRateController.deleteSymbolRate);

router
  .route('/symbolRate/:symbol/:running')
  .get(validate(symbolRateValidation.getSymbolRate), symbolRateController.getSymbolRate)
  .patch(validate(symbolRateValidation.updateSymbolRate), symbolRateController.updateSymbolRate)
  .delete(auth('manageSymbolRate'), validate(symbolRateValidation.deleteSymbolRate), symbolRateController.deleteSymbolRate);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: SymbolRates
 *   description: SymbolRate management and retrieval
 */
