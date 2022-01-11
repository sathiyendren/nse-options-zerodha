const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const optionScriptValidation = require('../../validations/optionScript.validation');
const optionScriptController = require('../../controllers/optionScript.controller');

const router = express.Router();

router
  .route('/')
  .post(
    // auth('manageOptionScripts'),
    validate(optionScriptValidation.createOptionScript),
    optionScriptController.createOptionScript
  )
  .get(auth('getOptionScripts'), validate(optionScriptValidation.getOptionScripts), optionScriptController.getOptionScripts)
  .delete(auth('manageOptionScripts'), optionScriptController.deleteAllOptionScript);

router
  .route('/:optionScriptId')
  .get(auth('getOptionScripts'), validate(optionScriptValidation.getOptionScript), optionScriptController.getOptionScript)
  .patch(
    auth('manageOptionScripts'),
    validate(optionScriptValidation.updateOptionScript),
    optionScriptController.updateOptionScript
  )
  .delete(
    auth('manageOptionScripts'),
    validate(optionScriptValidation.deleteOptionScript),
    optionScriptController.deleteOptionScript
  );

router
  .route('/user/:userId')
  .get(
    auth('getOptionScripts'),
    validate(optionScriptValidation.getOptionScript),
    optionScriptController.getOptionScriptsByUserId
  )
  .delete(
    auth('manageOptionScripts'),
    validate(optionScriptValidation.deleteOptionScript),
    optionScriptController.deleteOptionScriptsByUserId
  );
module.exports = router;

/**
 * @swagger
 * tags:
 *   name: OptionScripts
 *   description: OptionScript management and retrieval
 */
