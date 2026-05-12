const { Customer, Sale } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  const { 
    type, 
    search, 
    hasDebt,
    sortBy = '-createdAt',
    page = 1,
    limit = 20
  } = req.query;

  // Build query
  const query = { isActive: true };

  if (type) {
    query.type = type;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (hasDebt === 'true') {
    query.currentCredit = { $gt: 0 };
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const customers = await Customer.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Customer.countDocuments(query);

  res.json({
    success: true,
    count: customers.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: customers
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Get recent sales
  const recentSales = await Sale.find({ customer: req.params.id })
    .populate('items.product', 'name')
    .sort('-createdAt')
    .limit(10);

  res.json({
    success: true,
    data: {
      customer,
      recentSales
    }
  });
});

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);

  res.status(201).json({
    success: true,
    data: customer
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: customer
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = asyncHandler(async (req, res) => {
  // Check if customer has sales
  const salesCount = await Sale.countDocuments({ customer: req.params.id });
  
  if (salesCount > 0) {
    throw new AppError('Cannot delete customer with existing sales. Deactivate instead.', 400);
  }

  const customer = await Customer.findByIdAndDelete(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
});

// @desc    Update customer credit
// @route   PUT /api/customers/:id/credit
// @access  Private/Admin
const updateCredit = asyncHandler(async (req, res) => {
  const { creditLimit } = req.body;

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  customer.creditLimit = creditLimit;
  await customer.save();

  res.json({
    success: true,
    data: customer
  });
});

// @desc    Get customers with debt
// @route   GET /api/customers/with-debt
// @access  Private
const getCustomersWithDebt = asyncHandler(async (req, res) => {
  const customers = await Customer.find({
    isActive: true,
    currentCredit: { $gt: 0 }
  }).sort('-currentCredit');

  const totalDebt = customers.reduce((sum, c) => sum + c.currentCredit, 0);

  res.json({
    success: true,
    count: customers.length,
    totalDebt,
    data: customers
  });
});

// @desc    Get customer statement
// @route   GET /api/customers/:id/statement
// @access  Private
const getCustomerStatement = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Build date query
  const dateQuery = {};
  if (startDate) dateQuery.$gte = new Date(startDate);
  if (endDate) dateQuery.$lte = new Date(endDate);

  const sales = await Sale.find({
    customer: req.params.id,
    ...(Object.keys(dateQuery).length > 0 && { createdAt: dateQuery })
  })
    .populate('items.product', 'name')
    .sort('createdAt');

  const statement = {
    customer: {
      name: customer.name,
      phone: customer.phone,
      creditLimit: customer.creditLimit,
      currentCredit: customer.currentCredit
    },
    period: {
      startDate: startDate || 'All time',
      endDate: endDate || 'All time'
    },
    transactions: sales.map(sale => ({
      date: sale.createdAt,
      invoiceNumber: sale.invoiceNumber,
      items: sale.items.map(item => ({
        product: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.totalPrice
      })),
      total: sale.total,
      amountPaid: sale.amountPaid,
      balance: sale.amountDue,
      status: sale.paymentStatus
    })),
    summary: {
      totalPurchases: sales.reduce((sum, s) => sum + s.total, 0),
      totalPaid: sales.reduce((sum, s) => sum + s.amountPaid, 0),
      totalBalance: sales.reduce((sum, s) => sum + s.amountDue, 0)
    }
  };

  res.json({
    success: true,
    data: statement
  });
});

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  updateCredit,
  getCustomersWithDebt,
  getCustomerStatement
};
