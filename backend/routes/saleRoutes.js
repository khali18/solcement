const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { saleValidation } = require('../middleware/validation');
const {
  getSales,
  getSale,
  createSale,
  updatePayment,
  cancelSale,
  getDailyReport
} = require('../controllers/saleController');

// Protect and authorize sales routes
router.use(protect);
router.use(authorize('admin', 'sales_staff'));

// Sales routes
router.route('/')
  .get(getSales)
  .post(saleValidation.create, createSale);

router.get('/daily-report', getDailyReport);
router.get('/:id', getSale);
router.put('/:id/payment', authorize('admin'), updatePayment);
router.put('/:id/cancel', authorize('admin'), cancelSale);

module.exports = router;
