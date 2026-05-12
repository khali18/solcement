const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersWithBalance
} = require('../controllers/supplierController');

// Protect all routes
router.use(protect);

// All authenticated users
router.get('/', getSuppliers);
router.get('/with-balance', getSuppliersWithBalance);
router.get('/:id', getSupplier);

// Admin and store manager
router.post('/', authorize('admin', 'store_manager'), createSupplier);
router.put('/:id', authorize('admin', 'store_manager'), updateSupplier);

// Admin only
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;
