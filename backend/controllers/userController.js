const { User } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');

  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, username, password, role, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ username });
  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  const user = await User.create({
    name,
    username,
    password,
    role,
    phone
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      phone: user.phone
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, username, role, phone, isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, username, role, phone, isActive },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Delete user (soft delete by deactivating)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting yourself
  if (user._id.toString() === req.user.id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  // Soft delete by deactivating
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Reset user password (admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Get user activity log
// @route   GET /api/users/:id/activity
// @access  Private/Admin
const getUserActivity = asyncHandler(async (req, res) => {
  const { Sale, LoginAudit, CustomerPayment } = require('../models');
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Fetch various activities
  const [logins, sales, payments] = await Promise.all([
    LoginAudit.find({ user: userId }).sort('-loginTime').limit(20),
    Sale.find({ salesPerson: userId }).sort('-createdAt').limit(20),
    CustomerPayment.find({ recordedBy: userId }).sort('-createdAt').limit(20)
  ]);

  // Combine and format
  const activities = [
    ...logins.map(l => ({
      type: 'login',
      status: l.status,
      description: l.status === 'success' ? 'Logged in successfully' : `Failed login: ${l.reason}`,
      date: l.loginTime,
      reference: l.ipAddress
    })),
    ...sales.map(s => ({
      type: 'sale',
      status: s.status,
      description: `Created invoice ${s.invoiceNumber} for GH₵${s.total.toLocaleString()}`,
      date: s.createdAt,
      reference: s.invoiceNumber,
      id: s._id
    })),
    ...payments.map(p => ({
      type: 'payment',
      status: 'success',
      description: `Recorded payment of GH₵${p.amount.toLocaleString()} from a customer`,
      date: p.createdAt,
      reference: p.receiptNumber,
      id: p._id
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    success: true,
    data: activities
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  getUserActivity
};
