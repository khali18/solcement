const { Product } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { 
    category, 
    search, 
    lowStock, 
    sortBy = 'name',
    page = 1,
    limit = 20
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$text = { $search: search };
  }

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$quantity', '$minStockLevel'] };
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find(query)
    .populate('supplier', 'name phone')
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    count: products.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('supplier', 'name phone email');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin/StoreManager
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin/StoreManager
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    data: product
  });
});

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// @desc    Update stock quantity
// @route   PUT /api/products/:id/stock
// @access  Private/StoreManager
const updateStock = asyncHandler(async (req, res) => {
  const { quantity, operation } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (operation === 'add') {
    product.quantity += Number(quantity);
  } else if (operation === 'subtract') {
    if (product.quantity < quantity) {
      throw new AppError('Insufficient stock', 400);
    }
    product.quantity -= Number(quantity);
  } else if (operation === 'set') {
    product.quantity = Number(quantity);
  } else {
    throw new AppError('Invalid operation. Use add, subtract, or set', 400);
  }

  await product.save();

  res.json({
    success: true,
    data: product
  });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    $expr: { $lte: ['$quantity', '$minStockLevel'] }
  }).populate('supplier', 'name phone');

  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = [
    { value: 'cement', label: 'Cement', unit: 'bag' },
    { value: 'iron_rods', label: 'Iron Rods', unit: 'piece' },
    { value: 'zinc', label: 'Zinc/Roofing', unit: 'piece' },
    { value: 'paint', label: 'Paint', unit: 'liter' },
    { value: 'tiles', label: 'Tiles', unit: 'square_meter' },
    { value: 'sand', label: 'Sand', unit: 'cubic_meter' },
    { value: 'gravel', label: 'Gravel', unit: 'cubic_meter' },
    { value: 'bricks', label: 'Bricks', unit: 'piece' },
    { value: 'wood', label: 'Wood/Timber', unit: 'piece' },
    { value: 'plumbing', label: 'Plumbing', unit: 'piece' },
    { value: 'electrical', label: 'Electrical', unit: 'piece' },
    { value: 'tools', label: 'Tools', unit: 'piece' },
    { value: 'other', label: 'Other', unit: 'piece' }
  ];

  res.json({
    success: true,
    data: categories
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories
};
