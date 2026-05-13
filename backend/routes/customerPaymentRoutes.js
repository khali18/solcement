const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCustomerPayments,
  createCustomerPayment,
  getCustomerPayment,
  updateCustomerPayment,
  deleteCustomerPayment,
  syncExistingPayments,
  getCustomerOutstandingSales,
  getCustomerPaymentHistory,
  generatePaymentReceipt
} = require('../controllers/customerPaymentController');

// All routes are protected
router.use(protect);

// @route   GET /api/customer-payments
// @access  Private
router.route('/')
  .get(getCustomerPayments)
  .post(createCustomerPayment);

// @route   GET /api/customer-payments/outstanding/:customerId
// @access  Private
router.get('/outstanding/:customerId', getCustomerOutstandingSales);

// @route   GET /api/customer-payments/history/:customerId
// @access  Private
router.get('/history/:customerId', getCustomerPaymentHistory);

// @route   GET /api/customer-payments/:id
// @access  Private
router.route('/:id')
  .get(getCustomerPayment)
  .put(updateCustomerPayment)
  .delete(deleteCustomerPayment);

// @route   GET /api/customer-payments/:id/receipt
// @access  Private
router.get('/:id/receipt', generatePaymentReceipt);

// @route   POST /api/customer-payments/sync
// @access  Private/Admin
router.post('/sync', syncExistingPayments);

module.exports = router;
