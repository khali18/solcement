const { Supplier, Purchase } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = asyncHandler(async (req, res) => {
  const { 
    category,
    search,
    sortBy = 'name',
    page = 1,
    limit = 20
  } = req.query;

  const query = { isActive: true };

  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { contactPerson: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const suppliers = await Supplier.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Supplier.countDocuments(query);

  res.json({
    success: true,
    count: suppliers.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: suppliers
  });
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Get recent purchases
  const recentPurchases = await Purchase.find({ supplier: req.params.id })
    .populate('items.product', 'name')
    .sort('-createdAt')
    .limit(10);

  res.json({
    success: true,
    data: {
      supplier,
      recentPurchases
    }
  });
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private/Admin/StoreManager
const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.create(req.body);

  res.status(201).json({
    success: true,
    data: supplier
  });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin/StoreManager
const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  res.json({
    success: true,
    data: supplier
  });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByIdAndDelete(req.params.id);

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  res.json({
    success: true,
    message: 'Supplier deleted successfully'
  });
});

// @desc    Get suppliers with outstanding balance
// @route   GET /api/suppliers/with-balance
// @access  Private
const getSuppliersWithBalance = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({
    isActive: true,
    $expr: { $gt: [{ $subtract: ['$totalPurchases', '$totalPaid'] }, 0] }
  }).sort({ totalPurchases: -1 });

  const totalBalance = suppliers.reduce((sum, s) => sum + (s.totalPurchases - s.totalPaid), 0);

  res.json({
    success: true,
    count: suppliers.length,
    totalBalance,
    data: suppliers
  });
});

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersWithBalance
};
