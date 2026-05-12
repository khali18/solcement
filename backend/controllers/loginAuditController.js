const LoginAudit = require('../models/LoginAudit');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all login audits (Admin only)
// @route   GET /api/login-audits
// @access  Private/Admin
const getLoginAudits = asyncHandler(async (req, res) => {
  const { status, username, startDate, endDate, page = 1, limit = 50 } = req.query;

  // Build filter
  const filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  if (username) {
    filter.username = { $regex: username, $options: 'i' };
  }
  
  if (startDate || endDate) {
    filter.loginTime = {};
    if (startDate) {
      filter.loginTime.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.loginTime.$lte = new Date(endDate);
    }
  }

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Get audits with user details
  const audits = await LoginAudit.find(filter)
    .populate('user', 'name username role')
    .sort({ loginTime: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Get total count for pagination
  const total = await LoginAudit.countDocuments(filter);

  // Get statistics
  const stats = await LoginAudit.aggregate([
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);

  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStats = await LoginAudit.aggregate([
    {
      $match: {
        loginTime: { $gte: today }
      }
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);

  // Get recent unique users
  const uniqueUsers = await LoginAudit.distinct('username', {
    loginTime: { $gte: today }
  });

  res.json({
    success: true,
    data: audits,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    },
    stats: {
      overall: stats[0] || { totalAttempts: 0, successful: 0, failed: 0 },
      today: todayStats[0] || { totalAttempts: 0, successful: 0, failed: 0 },
      uniqueUsersToday: uniqueUsers.length
    }
  });
});

// @desc    Get login audit statistics
// @route   GET /api/login-audits/stats
// @access  Private/Admin
const getLoginStats = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Number(days));
  startDate.setHours(0, 0, 0, 0);

  // Get daily login trends
  const dailyTrends = await LoginAudit.aggregate([
    {
      $match: {
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);

  // Get top users by login attempts
  const topUsers = await LoginAudit.aggregate([
    {
      $match: {
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$username',
        name: { $first: '$name' },
        totalLogins: { $sum: 1 },
        successfulLogins: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        failedLogins: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { totalLogins: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Get failed login reasons
  const failedReasons = await LoginAudit.aggregate([
    {
      $match: {
        status: 'failed',
        loginTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      dailyTrends,
      topUsers,
      failedReasons
    }
  });
});

// @desc    Clear old login audits (Admin only)
// @route   DELETE /api/login-audits
// @access  Private/Admin
const clearLoginAudits = asyncHandler(async (req, res) => {
  const { days = 30 } = req.body;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(days));

  const result = await LoginAudit.deleteMany({
    loginTime: { $lt: cutoffDate }
  });

  res.json({
    success: true,
    message: `${result.deletedCount} login audit records cleared`,
    deletedCount: result.deletedCount
  });
});

module.exports = {
  getLoginAudits,
  getLoginStats,
  clearLoginAudits
};
