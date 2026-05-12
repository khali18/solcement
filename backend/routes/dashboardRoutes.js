const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getSalesChart,
  getTopProducts
} = require('../controllers/dashboardController');

// Protect all routes
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);

module.exports = router;
