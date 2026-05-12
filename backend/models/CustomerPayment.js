const mongoose = require('mongoose');

const customerPaymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Payment amount must be greater than 0']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'check'],
    required: true
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Track which sales this payment applies to
  appliedToSales: [{
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    },
    amountApplied: {
      type: Number,
      required: true,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
customerPaymentSchema.index({ customer: 1, paymentDate: -1 });
customerPaymentSchema.index({ paymentDate: -1 });

// Generate receipt number
customerPaymentSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.receiptNumber = `PAY-${year}${month}-${sequence}`;
  }
  next();
});

module.exports = mongoose.model('CustomerPayment', customerPaymentSchema);
