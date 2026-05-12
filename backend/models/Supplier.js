const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  contactPerson: {
    type: String,
    trim: true
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
  category: {
    type: String,
    enum: ['cement', 'iron_rods', 'zinc', 'paint', 'general', 'other'],
    default: 'general'
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', '15_days', '30_days', '60_days'],
    default: 'immediate'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Virtual for outstanding balance
supplierSchema.virtual('outstandingBalance').get(function() {
  return this.totalPurchases - this.totalPaid;
});

// Index for phone search
supplierSchema.index({ phone: 1 });
supplierSchema.index({ name: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
