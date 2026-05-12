const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { productValidation } = require('../middleware/validation');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories
} = require('../controllers/productController');

// Protect all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getProducts);
router.get('/low-stock', getLowStockProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);

// Protected routes (admin and store_manager only)
router.post('/', authorize('admin', 'store_manager'), productValidation.create, createProduct);
router.put('/:id', authorize('admin', 'store_manager'), productValidation.update, updateProduct);
router.put('/:id/stock', authorize('admin', 'store_manager'), updateStock);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
