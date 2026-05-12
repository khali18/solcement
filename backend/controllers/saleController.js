const { Sale, Product, Customer, Transaction, CustomerPayment } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Generate unique invoice number
const generateInvoiceNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Count sales this month
  const count = await Sale.countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), 1),
      $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
  const { 
    customer, 
    status,
    paymentStatus,
    startDate,
    endDate,
    page = 1,
    limit = 20
  } = req.query;

  // Build query
  const query = {};

  if (customer) query.customer = customer;
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  
  // Filter by salesPerson if not admin
  if (req.user.role !== 'admin') {
    query.salesPerson = req.user.id;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const sales = await Sale.find(query)
    .populate('customer', 'name phone')
    .populate('items.product', 'name unit')
    .populate('salesPerson', 'name')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  const total = await Sale.countDocuments(query);

  // Calculate totals
  const totals = await Sale.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$total' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$amountDue' }
      }
    }
  ]);

  res.json({
    success: true,
    count: sales.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    summary: totals[0] || { totalSales: 0, totalPaid: 0, totalDue: 0 },
    data: sales
  });
});

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer', 'name phone email address')
    .populate('items.product', 'name unit category')
    .populate('salesPerson', 'name');

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  res.json({
    success: true,
    data: sale
  });
});

// @desc    Create sale
// @route   POST /api/sales
// @access  Private
const createSale = asyncHandler(async (req, res) => {
  const { customer, items, paymentMethod, amountPaid = 0, discount = 0, tax = 0, notes, deliveryAddress } = req.body;

  // Validate customer exists
  const customerDoc = await Customer.findById(customer);
  if (!customerDoc) {
    throw new AppError('Customer not found', 404);
  }

  // Validate and process items
  const saleItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new AppError(`Product not found: ${item.product}`, 404);
    }

    if (product.quantity < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.quantity}`, 400);
    }

    const totalPrice = item.quantity * item.unitPrice;
    subtotal += totalPrice;

    saleItems.push({
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice
    });

    // Update product quantity
    product.quantity -= item.quantity;
    await product.save();
  }

  // Calculate totals
  const total = subtotal - discount + tax;

  // Check credit limit for credit sales
  if (paymentMethod === 'credit') {
    const newCredit = customerDoc.currentCredit + (total - amountPaid);
    if (newCredit > customerDoc.creditLimit) {
      throw new AppError('Sale exceeds customer credit limit', 400);
    }
    customerDoc.currentCredit = newCredit;
  }

  // Update customer totals
  customerDoc.totalPurchases += total;
  customerDoc.totalPaid += amountPaid;
  await customerDoc.save();

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Create sale
  const sale = await Sale.create({
    invoiceNumber,
    customer,
    items: saleItems,
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    amountPaid,
    amountDue: total - amountPaid,
    salesPerson: req.user.id,
    notes,
    deliveryAddress
  });

  // Create transaction record
  await Transaction.create({
    type: 'sale',
    reference: invoiceNumber,
    referenceModel: 'Sale',
    referenceId: sale._id,
    amount: total,
    description: `Sale to ${customerDoc.name}`,
    paymentMethod,
    category: 'sales',
    date: new Date(),
    recordedBy: req.user.id
  });

  // If payment received, record it as a CustomerPayment
  if (amountPaid > 0) {
    await CustomerPayment.create({
      customer,
      amount: amountPaid,
      paymentMethod,
      referenceNumber: invoiceNumber,
      notes: `Initial payment for sale ${invoiceNumber}`,
      recordedBy: req.user.id,
      appliedToSales: [{
        sale: sale._id,
        amountApplied: amountPaid
      }]
    });

    // Create transaction record for the payment
    await Transaction.create({
      type: 'payment_received',
      reference: invoiceNumber,
      referenceModel: 'Sale',
      referenceId: sale._id,
      amount: amountPaid,
      description: `Payment received from ${customerDoc.name}`,
      paymentMethod,
      category: 'sales',
      date: new Date(),
      recordedBy: req.user.id
    });
  }

  res.status(201).json({
    success: true,
    data: sale
  });
});

// @desc    Update sale payment
// @route   PUT /api/sales/:id/payment
// @access  Private
const updatePayment = asyncHandler(async (req, res) => {
  const { amountPaid, paymentMethod } = req.body;

  const sale = await Sale.findById(req.params.id).populate('customer');
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  if (sale.status === 'cancelled') {
    throw new AppError('Cannot update payment for cancelled sale', 400);
  }

  const previousPaid = sale.amountPaid;
  const additionalPayment = amountPaid - previousPaid;

  // Update sale
  sale.amountPaid = amountPaid;
  sale.paymentMethod = paymentMethod || sale.paymentMethod;
  
  if (sale.amountPaid >= sale.total) {
    sale.paymentStatus = 'paid';
    sale.amountDue = 0;
  } else if (sale.amountPaid > 0) {
    sale.paymentStatus = 'partial';
    sale.amountDue = sale.total - sale.amountPaid;
  }

  await sale.save();

  // Update customer
  sale.customer.totalPaid += additionalPayment;
  
  // If it was a credit sale, reduce current credit
  if (sale.paymentMethod === 'credit' && additionalPayment > 0) {
    sale.customer.currentCredit = Math.max(0, sale.customer.currentCredit - additionalPayment);
  }
  
  await sale.customer.save();

  // Record as CustomerPayment
  if (additionalPayment > 0) {
    await CustomerPayment.create({
      customer: sale.customer._id,
      amount: additionalPayment,
      paymentMethod: paymentMethod || sale.paymentMethod,
      referenceNumber: sale.invoiceNumber,
      notes: `Additional payment for sale ${sale.invoiceNumber}`,
      recordedBy: req.user.id,
      appliedToSales: [{
        sale: sale._id,
        amountApplied: additionalPayment
      }]
    });

    await Transaction.create({
      type: 'payment_received',
      reference: sale.invoiceNumber,
      referenceModel: 'Sale',
      referenceId: sale._id,
      amount: additionalPayment,
      description: `Additional payment from ${sale.customer.name}`,
      paymentMethod: paymentMethod || sale.paymentMethod,
      category: 'sales',
      date: new Date(),
      recordedBy: req.user.id
    });
  }

  res.json({
    success: true,
    data: sale
  });
});

// @desc    Cancel sale
// @route   PUT /api/sales/:id/cancel
// @access  Private/Admin
const cancelSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id).populate('customer');
  
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  if (sale.status === 'cancelled') {
    throw new AppError('Sale is already cancelled', 400);
  }

  // Restore product quantities
  for (const item of sale.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantity += item.quantity;
      await product.save();
    }
  }

  // Update customer
  sale.customer.totalPurchases -= sale.total;
  sale.customer.totalPaid -= sale.amountPaid;
  
  // Restore credit if it was a credit sale
  if (sale.paymentMethod === 'credit') {
    sale.customer.currentCredit = Math.max(0, sale.customer.currentCredit - sale.amountDue);
  }
  
  await sale.customer.save();

  // Update sale status
  sale.status = 'cancelled';
  await sale.save();

  // Record cancellation transaction
  await Transaction.create({
    type: 'refund',
    reference: sale.invoiceNumber,
    referenceModel: 'Sale',
    referenceId: sale._id,
    amount: -sale.total,
    description: `Cancelled sale - ${sale.invoiceNumber}`,
    category: 'sales',
    date: new Date(),
    recordedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Sale cancelled successfully',
    data: sale
  });
});

// @desc    Get daily sales report
// @route   GET /api/sales/daily-report
// @access  Private
const getDailyReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  const queryDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

  const sales = await Sale.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' },
    ...(req.user.role !== 'admin' ? { salesPerson: req.user.id } : {})
  }).populate('customer', 'name');

  const report = {
    date: startOfDay,
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.total, 0),
    totalPaid: sales.reduce((sum, s) => sum + s.amountPaid, 0),
    totalDue: sales.reduce((sum, s) => sum + s.amountDue, 0),
    salesByPaymentMethod: {},
    sales: sales.map(s => ({
      invoiceNumber: s.invoiceNumber,
      customer: s.customer.name,
      total: s.total,
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus
    }))
  };

  // Group by payment method
  sales.forEach(sale => {
    if (!report.salesByPaymentMethod[sale.paymentMethod]) {
      report.salesByPaymentMethod[sale.paymentMethod] = { count: 0, amount: 0 };
    }
    report.salesByPaymentMethod[sale.paymentMethod].count++;
    report.salesByPaymentMethod[sale.paymentMethod].amount += sale.total;
  });

  res.json({
    success: true,
    data: report
  });
});

module.exports = {
  getSales,
  getSale,
  createSale,
  updatePayment,
  cancelSale,
  getDailyReport
};
