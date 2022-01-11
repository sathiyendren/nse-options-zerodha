const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const transactionValidation = require('../../validations/transaction.validation');
const transactionController = require('../../controllers/transaction.controller');

const router = express.Router();
// 'getTransaction', 'manageTransaction'
router
  .route('/')
  .post(validate(transactionValidation.createTransaction), transactionController.createTransaction)
  .get(validate(transactionValidation.getTransactions), transactionController.getTransactions)
  .delete(auth('manageTransaction'), transactionController.deleteAllTransaction);

router
  .route('/:transactionId')
  .get(validate(transactionValidation.getTransaction), transactionController.getTransaction)
  .patch(validate(transactionValidation.updateTransaction), transactionController.updateTransaction)
  .delete(
    auth('manageTransaction'),
    validate(transactionValidation.deleteTransaction),
    transactionController.deleteTransaction
  );

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management and retrieval
 */
