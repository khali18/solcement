# SOL CEMENT - AMINU YAKUBU ENTERPRISE - Development Guide

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Core Features & Modules](#2-core-features--modules)
3. [Database Design](#3-database-design)
4. [Backend Development](#4-backend-development)
5. [Frontend Design](#5-frontend-design)
6. [Security & Performance](#6-security--performance)
7. [Advanced Features](#7-advanced-features)
8. [Step-by-Step Development Plan](#8-step-by-step-development-plan)
9. [Installation & Setup](#9-installation--setup)

---

## 1. System Overview

### Purpose
The **SOL CEMENT - AMINU YAKUBU ENTERPRISE Management System** is a comprehensive business solution designed for SOL CEMENT construction material suppliers. It helps businesses efficiently manage inventory, track sales, handle customer relationships, and monitor financial performance.

### Key Users

#### Admin
- **Responsibilities**: Full system management, user administration, financial oversight
- **Permissions**: All features including user management, deletion privileges, financial reports
- **Dashboard View**: Complete business analytics, all modules accessible

#### Sales Staff
- **Responsibilities**: Processing sales, generating invoices, customer management
- **Permissions**: Create/view sales, manage customers, view products
- **Dashboard View**: Today's sales, recent customers, available products

#### Store Manager
- **Responsibilities**: Inventory management, stock monitoring, supplier relations
- **Permissions**: Product CRUD operations, supplier management, stock adjustments
- **Dashboard View**: Stock levels, low stock alerts, supplier information

---

## 2. Core Features & Modules

### Inventory Management

#### Stock Tracking
- Real-time quantity monitoring
- Unit-based tracking (bags, pieces, kg, meters, liters, etc.)
- Storage location management
- Barcode support (ready for future implementation)

#### Low Stock Alerts
- Configurable minimum stock levels per product
- Visual indicators on dashboard
- Alert notifications for reordering
- Filter view for low stock items

#### Product Categories
- Cement (bags)
- Iron Rods (pieces)
- Zinc/Roofing materials
- Paint (liters)
- Tiles (square meters)
- Sand & Gravel (cubic meters)
- Bricks (pieces)
- Wood/Timber
- Plumbing supplies
- Electrical supplies
- Tools
- Other

### Sales & Invoicing

#### Invoice Generation
- Auto-generated unique invoice numbers (INV-YYMM-XXXX)
- Customer and item details
- Automatic calculations (subtotal, discount, tax, total)
- Payment status tracking

#### Payment Tracking
- Multiple payment methods: Cash, Bank Transfer, Mobile Money, Credit
- Partial payment support
- Balance due calculation
- Payment history per invoice

#### Debt/Credit System
- Customer credit limits
- Real-time credit balance tracking
- Outstanding payments dashboard
- Credit approval workflow

### Supplier Management

#### Purchase Tracking
- Supplier relationship management
- Purchase order creation
- Cost tracking per supplier
- Outstanding balance monitoring

#### Supplier Records
- Contact information
- Supply categories
- Payment terms (immediate, 15/30/60 days)
- Performance rating

### Customer Management

#### Customer History
- Complete purchase history
- Payment patterns analysis
- Credit utilization tracking
- Contact and address management

#### Customer Types
- Individual customers
- Contractors
- Companies
- Retailers

### Financial Dashboard

#### Daily Sales
- Today's revenue and transaction count
- Payment method breakdown
- Hourly sales trends

#### Revenue Analytics
- Monthly/weekly/yearly comparisons
- Profit estimation (selling price - cost price)
- Outstanding receivables

### User Authentication & RBAC

#### Role-Based Access Control
```
┌─────────────────────────────────────────────────┐
│ Role          │ Inventory │ Sales │ Admin │     │
├─────────────────────────────────────────────────┤
│ Admin         │    CRUD   │  CRUD │  Full │     │
│ Sales Staff   │    Read   │  CRUD │  None │     │
│ Store Manager │    CRUD   │  Read │  None │     │
└─────────────────────────────────────────────────┘
```

---

## 3. Database Design (MongoDB)

### Collections Overview

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,           // User's full name
  email: String,          // Unique email address
  password: String,         // Hashed password
  role: String,           // Enum: 'admin', 'sales_staff', 'store_manager'
  phone: String,          // Contact number
  isActive: Boolean,      // Account status
  lastLogin: Date,        // Last login timestamp
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,           // Product name
  description: String,    // Product description
  category: String,       // Enum of categories
  unit: String,           // Unit of measurement
  quantity: Number,       // Current stock level
  minStockLevel: Number,  // Alert threshold
  costPrice: Number,      // Purchase cost
  sellingPrice: Number,   // Sale price
  supplier: ObjectId,     // Reference to Supplier
  location: String,       // Storage location
  barcode: String,        // Optional barcode
  isActive: Boolean,      // Soft delete flag
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Customers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,          // Required
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  type: String,           // Enum: 'individual', 'contractor', 'company', 'retailer'
  creditLimit: Number,    // Maximum credit allowed
  currentCredit: Number,  // Currently owed amount
  totalPurchases: Number, // Lifetime purchase value
  totalPaid: Number,      // Lifetime payments received
  isActive: Boolean,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Suppliers Collection
```javascript
{
  _id: ObjectId,
  name: String,
  contactPerson: String,
  email: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  category: String,       // Supply category
  totalPurchases: Number,
  totalPaid: Number,
  balance: Number,
  paymentTerms: String, // Enum: 'immediate', '15_days', '30_days', '60_days'
  isActive: Boolean,
  notes: String,
  rating: Number,       // 1-5 rating
  createdAt: Date,
  updatedAt: Date
}
```

#### Sales Collection
```javascript
{
  _id: ObjectId,
  invoiceNumber: String,  // Unique: INV-YYMM-XXXX
  customer: ObjectId,     // Reference to Customer
  items: [{
    product: ObjectId,
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number
  }],
  subtotal: Number,
  discount: Number,
  tax: Number,
  total: Number,
  paymentMethod: String,
  paymentStatus: String,  // Enum: 'paid', 'partial', 'unpaid'
  amountPaid: Number,
  amountDue: Number,
  status: String,         // Enum: 'pending', 'completed', 'cancelled', 'refunded'
  salesPerson: ObjectId,  // Reference to User
  notes: String,
  deliveryAddress: String,
  deliveryStatus: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Transactions Collection
```javascript
{
  _id: ObjectId,
  type: String,           // Enum: 'sale', 'purchase', 'payment_received', etc.
  reference: String,      // Invoice/Order number
  referenceModel: String, // Model name
  referenceId: ObjectId,  // Reference document ID
  amount: Number,
  description: String,
  paymentMethod: String,
  category: String,
  date: Date,
  recordedBy: ObjectId,
  notes: String,
  createdAt: Date
}
```

### Database Relationships

```
Users (salesPerson) ───────┐
                           │
Customers ───┐             │
             │             │
             └─────► Sales ◄┘
             │
Products ◄───┘ (items.product)
             │
Suppliers ───┘ (products.supplier)
```

---

## 4. Backend Development (Node.js + Express)

### Folder Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication
│   ├── userController.js    # User management
│   ├── productController.js # Product CRUD
│   ├── customerController.js# Customer management
│   ├── supplierController.js# Supplier management
│   ├── saleController.js    # Sales processing
│   └── dashboardController.js# Analytics
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Error handling
│   └── validation.js        # Input validation
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Customer.js
│   ├── Supplier.js
│   ├── Sale.js
│   ├── Purchase.js
│   └── Transaction.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── productRoutes.js
│   ├── customerRoutes.js
│   ├── supplierRoutes.js
│   ├── saleRoutes.js
│   └── dashboardRoutes.js
├── server.js                # Entry point
└── package.json
```

### API Routes Structure

#### Authentication Routes (`/api/auth`)
```
POST /register     - Register new user (first user becomes admin)
POST /login        - User login
GET  /profile      - Get current user
PUT  /profile      - Update profile
PUT  /change-password
```

#### User Routes (`/api/users`) - Admin Only
```
GET    /           - List all users
POST   /           - Create user
GET    /:id        - Get user details
PUT    /:id        - Update user
DELETE /:id        - Soft delete user
PUT    /:id/reset-password
```

#### Product Routes (`/api/products`)
```
GET    /           - List products (with filters)
POST   /           - Create product (Admin/Store Manager)
GET    /:id        - Get product details
PUT    /:id        - Update product (Admin/Store Manager)
DELETE /:id        - Soft delete (Admin only)
PUT    /:id/stock  - Update stock quantity
GET    /low-stock  - Get low stock products
GET    /categories - Get category list
```

#### Customer Routes (`/api/customers`)
```
GET    /           - List customers
POST   /           - Create customer
GET    /:id        - Get customer details (with purchase history)
PUT    /:id        - Update customer
DELETE /:id        - Delete customer (Admin only)
PUT    /:id/credit - Update credit limit (Admin only)
GET    /with-debt  - Get customers with outstanding debt
GET    /:id/statement - Get customer statement
```

#### Supplier Routes (`/api/suppliers`)
```
GET    /           - List suppliers
POST   /           - Create supplier
GET    /:id        - Get supplier details
PUT    /:id        - Update supplier
DELETE /:id        - Delete supplier
GET    /with-balance - Suppliers with outstanding balance
```

#### Sales Routes (`/api/sales`)
```
GET    /           - List sales (with filters)
POST   /           - Create sale
GET    /:id        - Get sale details
PUT    /:id/payment - Update payment
PUT    /:id/cancel - Cancel sale (Admin only)
GET    /daily-report - Daily sales report
```

#### Dashboard Routes (`/api/dashboard`)
```
GET /stats         - Dashboard statistics
GET /sales-chart   - Sales chart data
GET /top-products  - Top selling products
```

### Middleware System

#### Authentication Middleware
```javascript
// Verify JWT token and attach user to request
const protect = async (req, res, next) => {
  // 1. Check for Authorization header
  // 2. Verify JWT token
  // 3. Find user in database
  // 4. Attach user to req.user
  // 5. Call next()
};
```

#### Authorization Middleware
```javascript
// Check user role permissions
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if req.user.role is in allowed roles
    // Return 403 if not authorized
  };
};
```

#### Error Handler
```javascript
// Centralized error handling
const errorHandler = (err, req, res, next) => {
  // Handle specific error types:
  // - ValidationError (MongoDB)
  // - CastError (invalid ObjectId)
  // - Duplicate key (11000)
  // - JWT errors
  // Return appropriate status codes and messages
};
```

---

## 5. Frontend Design

### Technology Stack
- **React 18**: Component-based UI
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client
- **Recharts**: Data visualization
- **Lucide React**: Icons
- **React Hot Toast**: Notifications

### Folder Structure
```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── Layout.js        # Main layout with sidebar
│   ├── context/
│   │   └── AuthContext.js   # Authentication state
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Products.js
│   │   ├── ProductForm.js
│   │   ├── Sales.js
│   │   ├── SaleForm.js
│   │   ├── SaleDetail.js
│   │   ├── Customers.js
│   │   ├── CustomerForm.js
│   │   ├── CustomerDetail.js
│   │   ├── Suppliers.js
│   │   ├── SupplierForm.js
│   │   ├── Reports.js
│   │   ├── Users.js
│   │   ├── UserForm.js
│   │   ├── Login.js
│   │   └── NotFound.js
│   ├── utils/
│   │   ├── api.js          # API helper functions
│   │   └── formatters.js   # Data formatting utilities
│   ├── App.js
│   ├── index.js
│   └── index.css           # Tailwind directives
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

### Page Layout

#### Dashboard
```
┌─────────────────────────────────────────────────────┐
│ HEADER: Logo, Notifications, Profile Dropdown       │
├────────────┬────────────────────────────────────────┤
│            │ DASHBOARD                              │
│  SIDEBAR   │ ┌────────┬────────┬────────┬────────┐│
│  - Home    │ │ Stats  │ Stats  │ Stats  │ Stats  ││
│  - Inv.    │ └────────┴────────┴────────┴────────┘│
│  - Sales   │ ┌─────────────────┐ ┌───────────────┐│
│  - Cust.   │ │   Sales Chart   │ │ Low Stock     ││
│  - Supp.   │ │                 │ │ Alerts        ││
│  - Reports │ └─────────────────┘ └───────────────┘│
│  - Users   │ ┌─────────────────────────────────────┐│
│            │ │      Recent Sales Table             ││
│            │ └─────────────────────────────────────┘│
└────────────┴────────────────────────────────────────┘
```

#### Sales Form
```
┌─────────────────────────────────────────────────────┐
│ NEW SALE                                            │
├─────────────────────────────────────────────────────┤
│ CUSTOMER INFO                                       │
│ [Select Customer Dropdown *]                        │
├─────────────────────────────────────────────────────┤
│ PRODUCTS                                            │
│ [Product Select] [Qty] [+]                         │
│ ┌─────────────────────────────────────────────────┐│
│ │ Product    │ Qty │ Price │ Total │ Action       ││
│ │ Cement...  │  5  │ ₦3500 │ ₦17500│ [Delete]     ││
│ │ Iron Rod.. │ 10  │ ₦5000 │ ₦50000│ [Delete]     ││
│ └─────────────────────────────────────────────────┘│
│          Subtotal: ₦67500                         │
│          Discount: [₦0]                           │
│          TOTAL: ₦67500                            │
├─────────────────────────────────────────────────────┤
│ PAYMENT                                             │
│ Method: [Cash ▼]  Amount Paid: [₦67500]           │
│                                                     │
│ [Cancel]                    [Create Invoice]      │
└─────────────────────────────────────────────────────┘
```

### Color Scheme
```css
/* Primary Colors */
--primary-600: #2563eb;  /* Buttons, links, active states */
--primary-100: #dbeafe;  /* Light backgrounds */

/* Semantic Colors */
--success: #10b981;      /* Success states, paid status */
--warning: #f59e0b;      /* Warnings, partial payments */
--danger: #ef4444;       /* Errors, unpaid status, delete */
--info: #3b82f6;         /* Information */

/* Neutral Colors */
--gray-50: #f9fafb;      /* Page background */
--gray-100: #f3f4f6;     /* Card backgrounds, hover */
--gray-200: #e5e7eb;     /* Borders */
--gray-500: #6b7280;     /* Secondary text */
--gray-900: #111827;     /* Primary text */
```

---

## 6. Security & Performance

### Security Features

#### JWT Authentication
```javascript
// Token generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Token verification middleware
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  next();
};
```

#### Password Security
- bcryptjs for password hashing (salt rounds: 12)
- Minimum password length: 6 characters
- Password never returned in API responses

#### Data Validation
```javascript
// Using express-validator
const userValidation = {
  register: [
    body('name').notEmpty().isLength({ max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'sales_staff', 'store_manager'])
  ]
};
```

#### Security Headers (Helmet)
```javascript
app.use(helmet());
```

#### Rate Limiting
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests
});
app.use(limiter);
```

#### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

### Performance Optimizations

#### Database Indexing
```javascript
// Product schema indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1, minStockLevel: 1 });

// Sale schema indexes
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ customer: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });
```

#### Pagination
```javascript
// All list endpoints support pagination
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 20;
const skip = (page - 1) * limit;

const data = await Model.find().skip(skip).limit(limit);
const total = await Model.countDocuments();
```

---

## 7. Advanced Features

### Low Stock Notifications
- Background job ready structure
- Dashboard alert badges
- Email notification ready (requires email service integration)

### PDF Invoice Generation (Ready for Implementation)
```javascript
// Using PDFKit for future implementation
const PDFDocument = require('pdfkit');

const generateInvoice = (sale) => {
  const doc = new PDFDocument();
  // Generate professional PDF invoice
  return doc;
};
```

### Sales Reports and Analytics
- Daily/weekly/monthly sales charts
- Top selling products
- Revenue trends
- Customer purchase patterns

### Multi-Store Support (Future Enhancement)
- Store entity in database schema
- Store-based filtering
- Inter-store transfers
- Store-specific permissions

---

## 8. Step-by-Step Development Plan

### Phase 1: MVP (Weeks 1-2)

#### Week 1: Backend Foundation
- [x] Project setup and structure
- [x] Database models (Users, Products, Customers, Sales)
- [x] Authentication system (JWT)
- [x] Basic API routes
- [x] Error handling and validation

#### Week 2: Frontend Foundation
- [x] React project setup
- [x] Authentication context
- [x] Dashboard layout
- [x] Login page
- [x] Protected routes

### Phase 2: Core Features (Weeks 3-4)

#### Week 3: Inventory & Sales
- [x] Product management (CRUD)
- [x] Stock tracking
- [x] Low stock alerts
- [x] Sales processing
- [x] Invoice generation

#### Week 4: Customers & Dashboard
- [x] Customer management
- [x] Credit tracking
- [x] Dashboard analytics
- [x] Sales charts
- [x] Reporting basics

### Phase 3: Advanced Features (Weeks 5-6)

#### Week 5: Suppliers & Refinements
- [x] Supplier management
- [x] Purchase tracking
- [x] Payment management
- [x] User management (Admin)

#### Week 6: Polish & Enhancements
- [x] Responsive design
- [x] Print-friendly invoices
- [x] Data export
- [x] Performance optimization
- [ ] PDF generation
- [ ] Email notifications
- [ ] Barcode scanning
- [ ] Mobile app

---

## 9. Installation & Setup

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/construction_materials
JWT_SECRET=your_secure_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

Start development server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
```

Start development server:
```bash
npm start
```

### First User Registration
The first user to register automatically becomes an **Admin**.

### Default Ports
- Backend API: http://localhost:5000
- Frontend App: http://localhost:3000

---

## API Testing

Use the following endpoints for testing:

```bash
# Health check
GET http://localhost:5000/api/health

# Register first admin user
POST http://localhost:5000/api/auth/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123"
}

# Login
POST http://localhost:5000/api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - Feel free to use for commercial purposes.

## Support

For issues and feature requests, please create an issue in the repository.

---

**Built for construction material businesses in developing countries.**
