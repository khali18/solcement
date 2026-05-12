const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');

// Public routes
router.post('/register', userValidation.register, register);
router.post('/login', userValidation.login, login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
