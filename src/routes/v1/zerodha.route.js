const express = require('express');
const validate = require('../../middlewares/validate');
const zerodhaValidation = require('../../validations/zerodha.validation');
const zerodhaController = require('../../controllers/zerodha.controller');

const router = express.Router();

router.route('/refresh').get(validate(zerodhaValidation.refreshConfig), zerodhaController.refreshZerodhaConfig);
module.exports = router;
