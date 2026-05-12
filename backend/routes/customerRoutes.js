const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { customerValidation } = require('../middleware/validation');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCredit,
  getCustomersWithDebt,
  getCustomerStatement
} = require('../controllers/customerController');

// Protect all routes
router.use(protect);

// All authenticated users can access
router.get('/', getCustomers);
router.get('/with-debt', getCustomersWithDebt);
router.get('/:id', getCustomer);
router.get('/:id/statement', getCustomerStatement);
router.post('/', customerValidation.create, createCustomer);
router.put('/:id', authorize('admin', 'store_manager'), updateCustomer);

// Admin only
router.put('/:id/credit', authorize('admin'), updateCredit);
router.delete('/:id', authorize('admin'), deleteCustomer);

module.exports = router;
