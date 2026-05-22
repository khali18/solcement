const { body, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'sales_staff', 'store_manager']).withMessage('Invalid role'),
    handleValidationErrors
  ],
  login: [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required'),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ]
};

// Product validation rules
const productValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Product name is required'),
    body('category')
      .notEmpty().withMessage('Category is required')
      .isIn(['cement', 'iron_rods', 'zinc', 'paint', 'tiles', 'sand', 'gravel', 'bricks', 'wood', 'plumbing', 'electrical', 'tools', 'other']),
    body('unit')
      .notEmpty().withMessage('Unit is required')
      .isIn(['bag', 'piece', 'kg', 'meter', 'liter', 'square_meter', 'cubic_meter', 'roll', 'set', 'box']),
    body('quantity')
      .isNumeric().withMessage('Quantity must be a number')
      .isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
    body('costPrice')
      .isNumeric().withMessage('Cost price must be a number')
      .isFloat({ min: 0 }).withMessage('Cost price cannot be negative'),
    body('sellingPrice')
      .isNumeric().withMessage('Selling price must be a number')
      .isFloat({ min: 0 }).withMessage('Selling price cannot be negative'),
    body('minStockLevel')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 }),
    handleValidationErrors
  ],
  update: [
    param('id')
      .isMongoId().withMessage('Invalid product ID'),
    handleValidationErrors
  ]
};

// Customer validation rules
const customerValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Customer name is required'),
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required'),
    body('email')
      .optional({ checkFalsy: true })
      .isEmail().withMessage('Invalid email format'),
    body('type')
      .optional()
      .isIn(['individual', 'contractor', 'company', 'retailer']),
    body('creditLimit')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 }),
    handleValidationErrors
  ]
};

// Sale validation rules
const saleValidation = {
  create: [
    body('customer')
      .notEmpty().withMessage('Customer is required')
      .isMongoId().withMessage('Invalid customer ID'),
    body('items')
      .isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product')
      .notEmpty().withMessage('Product is required')
      .isMongoId().withMessage('Invalid product ID'),
    body('items.*.quantity')
      .isNumeric().withMessage('Quantity must be a number')
      .isFloat({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['cash', 'bank_transfer', 'mobile_money', 'credit', 'mixed']),
    body('amountPaid')
      .optional()
      .isNumeric()
      .isFloat({ min: 0 }),
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  productValidation,
  customerValidation,
  saleValidation,
  handleValidationErrors
};
