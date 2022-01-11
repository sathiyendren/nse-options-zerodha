const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const settingValidation = require('../../validations/setting.validation');
const settingController = require('../../controllers/setting.controller');

const router = express.Router();
// 'getSetting', 'manageSetting'
router
  .route('/')
  .post(auth('manageSetting'), validate(settingValidation.createSetting), settingController.createSetting)
  .get(auth('getSetting'), validate(settingValidation.getSettings), settingController.getSettings)
  .delete(auth('manageSetting'), settingController.deleteAllSetting);

router
  .route('/:settingId')
  .get(auth('getSetting'), validate(settingValidation.getSetting), settingController.getSetting)
  .patch(auth('manageSetting'), validate(settingValidation.updateSetting), settingController.updateSetting)
  .delete(auth('manageSetting'), validate(settingValidation.deleteSetting), settingController.deleteSetting);

router
  .route('/user/:userId')
  .get(auth('getSetting'), validate(settingValidation.getSetting), settingController.getSetting)
  .patch(auth('manageSetting'), validate(settingValidation.updateSetting), settingController.updateSetting)
  .delete(auth('manageSetting'), validate(settingValidation.deleteSetting), settingController.deleteSetting);

module.exports = router;
