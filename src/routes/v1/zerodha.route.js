const express = require('express');
const validate = require('../../middlewares/validate');
const zerodhaValidation = require('../../validations/zerodha.validation');
const zerodhaController = require('../../controllers/zerodha.controller');

const router = express.Router();

router.route('/refresh').get(validate(zerodhaValidation.refreshConfig), zerodhaController.refreshZerodhaConfig);
router.route('/placeSingleOrder').post(validate(zerodhaValidation.placeOrder), zerodhaController.placeSingleOrder);
router.route('/placeMultipleOrder').post(validate(zerodhaValidation.placeOrder), zerodhaController.placeMultipleOrder);
module.exports = router;
