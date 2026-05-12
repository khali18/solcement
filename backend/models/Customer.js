const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  type: {
    type: String,
    enum: ['individual', 'contractor', 'company', 'retailer'],
    default: 'individual'
  },
  creditLimit: {
    type: Number,
    default: 0,
    min: [0, 'Credit limit cannot be negative']
  },
  currentCredit: {
    type: Number,
    default: 0,
    min: [0, 'Current credit cannot be negative']
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for available credit
customerSchema.virtual('availableCredit').get(function() {
  return this.creditLimit - this.currentCredit;
});

// Virtual for total debt
customerSchema.virtual('totalDebt').get(function() {
  return this.currentCredit;
});

// Method to check if customer has available credit
customerSchema.methods.hasAvailableCredit = function(amount) {
  return this.availableCredit >= amount;
};

// Index for phone search
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
