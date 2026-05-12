const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['sale', 'purchase', 'payment_received', 'payment_made', 'expense', 'refund', 'adjustment'],
    required: true
  },
  reference: {
    type: String,
    required: true
  },
  referenceModel: {
    type: String,
    enum: ['Sale', 'Purchase', 'Customer', 'Supplier', 'Expense'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'cheque', 'check', 'credit', 'mixed', 'other'],
    default: 'cash'
  },
  category: {
    type: String,
    enum: ['sales', 'purchases', 'salaries', 'rent', 'utilities', 'transport', 'maintenance', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    default: Date.now
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for transaction queries
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
