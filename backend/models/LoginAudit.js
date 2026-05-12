const mongoose = require('mongoose');

const loginAuditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'sales_staff', 'store_manager', null]
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  reason: {
    type: String
  },
  loginTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
loginAuditSchema.index({ loginTime: -1 });
loginAuditSchema.index({ username: 1 });
loginAuditSchema.index({ status: 1 });

module.exports = mongoose.model('LoginAudit', loginAuditSchema);
