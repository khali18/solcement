const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['cement', 'iron_rods', 'zinc', 'paint', 'tiles', 'sand', 'gravel', 'bricks', 'wood', 'plumbing', 'electrical', 'tools', 'other'],
    default: 'other'
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['bag', 'piece', 'kg', 'meter', 'liter', 'square_meter', 'cubic_meter', 'roll', 'set', 'box'],
    default: 'piece'
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  location: {
    type: String,
    trim: true,
    description: 'Storage location in warehouse'
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
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

// Index for searching
productSchema.index({ name: 'text', description: 'text', category: 'text' });

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.minStockLevel) return 'low_stock';
  return 'in_stock';
});

// Method to check if stock is low
productSchema.methods.isLowStock = function() {
  return this.quantity <= this.minStockLevel;
};

module.exports = mongoose.model('Product', productSchema);
