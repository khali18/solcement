const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getLoginAudits,
  getLoginStats,
  clearLoginAudits
} = require('../controllers/loginAuditController');

// Protect all routes
router.use(protect);

router.route('/')
  .get(authorize('admin', 'store_manager'), getLoginAudits)
  .delete(authorize('admin'), clearLoginAudits);

router.get('/stats', authorize('admin', 'store_manager'), getLoginStats);

module.exports = router;
