const { Customer, CustomerPayment, Sale, Transaction } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { generatePaymentReceiptPDF } = require('../utils/paymentReceiptTemplate');

// @desc    Get all customer payments
// @route   GET /api/customer-payments
// @access  Private
const getCustomerPayments = asyncHandler(async (req, res) => {
  const { customer, search, startDate, endDate, page = 1, limit = 20 } = req.query;
  const filter = {};
  
  if (customer) {
    filter.customer = customer;
  }

  if (search) {
    // Find customers matching search for name search
    const matchingCustomers = await Customer.find({
      name: { $regex: search, $options: 'i' }
    }).select('_id');
    const customerIds = matchingCustomers.map(c => c._id);

    filter.$or = [
      { receiptNumber: { $regex: search, $options: 'i' } },
      { referenceNumber: { $regex: search, $options: 'i' } },
      { customer: { $in: customerIds } }
    ];
  }
  
  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) filter.paymentDate.$lte = new Date(endDate);
  }

  // Calculate pagination
  const skip = (Number(page) - 1) * Number(limit);

  const payments = await CustomerPayment.find(filter)
    .populate('customer', 'name email phone')
    .populate('recordedBy', 'name')
    .populate('appliedToSales.sale', 'invoiceNumber total')
    .sort({ paymentDate: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await CustomerPayment.countDocuments(filter);

  res.json({
    success: true,
    data: payments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// @desc    Create customer payment
// @route   POST /api/customer-payments
// @access  Private
const createCustomerPayment = asyncHandler(async (req, res) => {
  const { customer, amount, paymentMethod, referenceNumber, notes, appliedToSales = [] } = req.body;

  // Validate customer exists
  const customerDoc = await Customer.findById(customer);
  if (!customerDoc) {
    throw new AppError('Customer not found', 404);
  }

  // Check if payment amount exceeds outstanding balance
  if (amount > customerDoc.currentCredit) {
    throw new AppError('Payment amount exceeds outstanding balance', 400);
  }

  // Handle auto-application to sales if none provided
  const finalAppliedToSales = [...appliedToSales];
  if (finalAppliedToSales.length === 0) {
    const outstandingSales = await Sale.find({
      customer: customer,
      amountDue: { $gt: 0 }
    }).sort({ createdAt: 1 }); // FIFO

    let remainingAmount = amount;
    for (const sale of outstandingSales) {
      if (remainingAmount <= 0) break;
      
      const amountToApply = Math.min(sale.amountDue, remainingAmount);
      finalAppliedToSales.push({
        sale: sale._id,
        amountApplied: amountToApply
      });
      
      sale.amountPaid += amountToApply;
      sale.amountDue = sale.total - sale.amountPaid;
      if (sale.amountDue <= 0) {
        sale.paymentStatus = 'paid';
      } else {
        sale.paymentStatus = 'partial';
      }
      await sale.save();
      
      remainingAmount -= amountToApply;
    }
  } else {
    // Validate and update provided applied sales
    for (const appliedSale of appliedToSales) {
      const sale = await Sale.findById(appliedSale.sale);
      if (!sale) {
        throw new AppError(`Sale not found: ${appliedSale.sale}`, 404);
      }
      if (sale.customer.toString() !== customer) {
        throw new AppError('Sale does not belong to this customer', 400);
      }
      
      sale.amountPaid += appliedSale.amountApplied;
      sale.amountDue = sale.total - sale.amountPaid;
      if (sale.amountDue <= 0) {
        sale.paymentStatus = 'paid';
      } else {
        sale.paymentStatus = 'partial';
      }
      await sale.save();
    }
  }

  // Create payment record
  const payment = await CustomerPayment.create({
    customer,
    amount,
    paymentMethod,
    referenceNumber,
    notes,
    recordedBy: req.user.id,
    appliedToSales: finalAppliedToSales
  });

  // Create financial transaction
  await Transaction.create({
    type: 'payment_received',
    reference: payment.receiptNumber,
    referenceModel: 'Customer',
    referenceId: customer,
    amount: amount,
    description: `Payment from ${customerDoc.name}`,
    paymentMethod,
    category: 'sales',
    recordedBy: req.user.id
  });

  // Update customer's credit balance
  customerDoc.currentCredit -= amount;
  customerDoc.totalPaid += amount;
  await customerDoc.save();

  // Get populated payment
  const populatedPayment = await CustomerPayment.findById(payment._id)
    .populate('customer', 'name email phone')
    .populate('recordedBy', 'name')
    .populate('appliedToSales.sale', 'invoiceNumber total');

  res.status(201).json({
    success: true,
    data: populatedPayment
  });
});

// @desc    Get customer payment by ID
// @route   GET /api/customer-payments/:id
// @access  Private
const getCustomerPayment = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('recordedBy', 'name')
    .populate('appliedToSales.sale', 'invoiceNumber total');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  res.json({
    success: true,
    data: payment
  });
});

// @desc    Get customer outstanding sales
// @route   GET /api/customer-payments/outstanding/:customerId
// @access  Private
const getCustomerOutstandingSales = asyncHandler(async (req, res) => {
  const customerId = req.params.customerId;

  // Validate customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Get sales with outstanding balance
  const outstandingSales = await Sale.find({
    customer: customerId,
    amountDue: { $gt: 0 }
  })
    .populate('items.product', 'name')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        currentCredit: customer.currentCredit,
        creditLimit: customer.creditLimit
      },
      outstandingSales
    }
  });
});

// @desc    Get customer payment history
// @route   GET /api/customer-payments/history/:customerId
// @access  Private
const getCustomerPaymentHistory = asyncHandler(async (req, res) => {
  const customerId = req.params.customerId;
  const { page = 1, limit = 20 } = req.query;

  const payments = await CustomerPayment.find({ customer: customerId })
    .populate('recordedBy', 'name')
    .populate('appliedToSales.sale', 'invoiceNumber')
    .sort({ paymentDate: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await CustomerPayment.countDocuments({ customer: customerId });

  res.json({
    success: true,
    data: payments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
});

// @desc    Update customer payment
// @route   PUT /api/customer-payments/:id
// @access  Private/Admin
const updateCustomerPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, referenceNumber, notes } = req.body;
  
  const payment = await CustomerPayment.findById(req.params.id);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  const customer = await Customer.findById(payment.customer);
  
  // Revert old payment from customer
  customer.currentCredit += payment.amount;
  customer.totalPaid -= payment.amount;

  // Revert old applied amounts from sales
  for (const applied of payment.appliedToSales) {
    const sale = await Sale.findById(applied.sale);
    if (sale) {
      sale.amountPaid -= applied.amountApplied;
      sale.amountDue = sale.total - sale.amountPaid;
      if (sale.amountDue <= 0) {
        sale.paymentStatus = 'paid';
      } else if (sale.amountPaid > 0) {
        sale.paymentStatus = 'partial';
      } else {
        sale.paymentStatus = 'unpaid';
      }
      await sale.save();
    }
  }

  // Update payment with new values
  payment.amount = amount || payment.amount;
  payment.paymentMethod = paymentMethod || payment.paymentMethod;
  payment.referenceNumber = referenceNumber || payment.referenceNumber;
  payment.notes = notes || payment.notes;

  // Apply new payment to customer
  customer.currentCredit -= payment.amount;
  customer.totalPaid += payment.amount;
  await customer.save();

  // Handle re-application to sales (FIFO)
  const finalAppliedToSales = [];
  const outstandingSales = await Sale.find({
    customer: payment.customer,
    amountDue: { $gt: 0 }
  }).sort({ createdAt: 1 });

  let remainingAmount = payment.amount;
  for (const sale of outstandingSales) {
    if (remainingAmount <= 0) break;
    
    const amountToApply = Math.min(sale.amountDue, remainingAmount);
    finalAppliedToSales.push({
      sale: sale._id,
      amountApplied: amountToApply
    });
    
    sale.amountPaid += amountToApply;
    sale.amountDue = sale.total - sale.amountPaid;
    if (sale.amountDue <= 0) {
      sale.paymentStatus = 'paid';
    } else {
      sale.paymentStatus = 'partial';
    }
    await sale.save();
    
    remainingAmount -= amountToApply;
  }

  payment.appliedToSales = finalAppliedToSales;
  await payment.save();

  // Update/Sync transaction
  await Transaction.findOneAndUpdate(
    { reference: payment.receiptNumber },
    {
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      description: `Updated payment from ${customer.name}`
    }
  );

  res.json({
    success: true,
    data: payment
  });
});

// @desc    Delete customer payment
// @route   DELETE /api/customer-payments/:id
// @access  Private/Admin
const deleteCustomerPayment = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findById(req.params.id);
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  const customer = await Customer.findById(payment.customer);
  
  // Revert payment from customer
  customer.currentCredit += payment.amount;
  customer.totalPaid -= payment.amount;
  await customer.save();

  // Revert applied amounts from sales
  for (const applied of payment.appliedToSales) {
    const sale = await Sale.findById(applied.sale);
    if (sale) {
      sale.amountPaid -= applied.amountApplied;
      sale.amountDue = sale.total - sale.amountPaid;
      if (sale.amountDue <= 0) {
        sale.paymentStatus = 'paid';
      } else if (sale.amountPaid > 0) {
        sale.paymentStatus = 'partial';
      } else {
        sale.paymentStatus = 'unpaid';
      }
      await sale.save();
    }
  }

  // Delete transaction
  await Transaction.findOneAndDelete({ reference: payment.receiptNumber });

  // Delete payment
  await payment.deleteOne();

  res.json({
    success: true,
    message: 'Payment deleted successfully'
  });
});

// @desc    Sync existing payments (from transactions)
// @route   POST /api/customer-payments/sync
// @access  Private/Admin
const syncExistingPayments = asyncHandler(async (req, res) => {
  // Find all payment_received transactions that don't have a corresponding CustomerPayment
  const paymentTransactions = await Transaction.find({
    type: 'payment_received',
    referenceModel: { $in: ['Sale', 'Customer'] }
  });

  let syncedCount = 0;
  for (const tx of paymentTransactions) {
    // Check if CustomerPayment exists with this receipt or reference
    const existing = await CustomerPayment.findOne({
      $or: [
        { receiptNumber: tx.reference },
        { referenceNumber: tx.reference }
      ]
    });

    if (!existing) {
      // Create a CustomerPayment record
      const customerId = tx.referenceModel === 'Customer' ? tx.referenceId : null;
      
      let finalCustomerId = customerId;
      let appliedToSales = [];

      if (tx.referenceModel === 'Sale') {
        const sale = await Sale.findById(tx.referenceId);
        if (sale) {
          finalCustomerId = sale.customer;
          appliedToSales.push({
            sale: sale._id,
            amountApplied: tx.amount
          });
        }
      }

      if (finalCustomerId) {
        await CustomerPayment.create({
          customer: finalCustomerId,
          amount: tx.amount,
          paymentMethod: tx.paymentMethod || 'cash',
          referenceNumber: tx.reference,
          notes: tx.description,
          recordedBy: tx.recordedBy,
          paymentDate: tx.date,
          appliedToSales
        });
        syncedCount++;
      }
    }
  }

  res.json({
    success: true,
    message: `${syncedCount} payments synced successfully`
  });
});

// @desc    Generate payment receipt PDF
// @route   GET /api/customer-payments/:id/receipt
// @access  Private
const generatePaymentReceipt = asyncHandler(async (req, res) => {
  const payment = await CustomerPayment.findById(req.params.id)
    .populate('customer')
    .populate('appliedToSales.sale');

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${payment.receiptNumber}.pdf`);

  generatePaymentReceiptPDF(payment, res);
});

module.exports = {
  getCustomerPayments,
  createCustomerPayment,
  getCustomerPayment,
  getCustomerOutstandingSales,
  getCustomerPaymentHistory,
  updateCustomerPayment,
  deleteCustomerPayment,
  syncExistingPayments,
  generatePaymentReceipt
};
