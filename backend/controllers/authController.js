const jwt = require('jsonwebtoken');
const { User } = require('../models');
const LoginAudit = require('../models/LoginAudit');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (first user) / Admin (subsequent users)
const register = asyncHandler(async (req, res) => {
  const { name, username, password, role, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ username: username?.toLowerCase().trim() });
  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  // Check if this is the first user (make them admin)
  const userCount = await User.countDocuments();
  const userRole = userCount === 0 ? 'admin' : (role || 'sales_staff');

  // Create user
  const user = await User.create({
    name,
    username: username?.toLowerCase().trim(),
    password,
    role: userRole,
    phone
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id)
      }
    });
  } else {
    throw new AppError('Invalid user data', 400);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  try {
    const { password } = req.body;
    const username = req.body.username?.toLowerCase().trim();
    
    if (!username || !password) {
      throw new AppError('Please provide username and password', 400);
    }

    // Check for user username
    const user = await User.findOne({ username }).select('+password');

    // Log failed login - user not found
    if (!user) {
      await LoginAudit.create({
        username,
        status: 'failed',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        reason: 'User not found'
      });
      throw new AppError('Invalid credentials', 401);
    }

    // Log failed login - account deactivated
    if (!user.isActive) {
      await LoginAudit.create({
        user: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: 'failed',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        reason: 'Account is deactivated'
      });
      throw new AppError('Account is deactivated', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    // Log failed login - wrong password
    if (!isMatch) {
      await LoginAudit.create({
        user: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        status: 'failed',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        reason: 'Invalid password'
      });
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await LoginAudit.create({
      user: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: 'success',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id)
      }
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    throw err;
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, username, phone },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: user
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};
