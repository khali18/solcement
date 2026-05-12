const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getUserActivity
} = require('../controllers/userController');

// All routes are protected and admin-only
router.use(protect, authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/reset-password', resetPassword);
router.get('/:id/activity', getUserActivity);

module.exports = router;
