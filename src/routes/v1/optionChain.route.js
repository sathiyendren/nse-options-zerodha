const express = require('express');
const validate = require('../../middlewares/validate');
const optionChainValidation = require('../../validations/optionChain.validation');
const optionChainController = require('../../controllers/optionChain.controller');

const router = express.Router();

router.route('/').get(validate(optionChainValidation.getOptionScripts), optionChainController.getOptionChain);

module.exports = router;
