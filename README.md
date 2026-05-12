# SOL CEMENT - AMINU YAKUBU ENTERPRISE

A modern, secure, and scalable inventory and sales management system for SOL CEMENT construction material business.

## System Overview

This system helps construction material businesses manage:
- **Inventory**: Track cement, iron rods, zinc, paint, and other supplies
- **Sales**: Generate invoices, track payments, manage credit/debt
- **Customers**: Maintain customer history and credit records
- **Suppliers**: Track purchases and supplier relationships
- **Finances**: Monitor daily sales, revenue, and profit

## Key Users
- **Admin**: Full system access, user management, financial reports
- **Sales Staff**: Process sales, generate invoices, customer management
- **Store Manager**: Inventory management, stock monitoring, low stock alerts

## Tech Stack
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React + Tailwind CSS
- **Authentication**: JWT
- **PDF Generation**: PDFKit

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Features

### Phase 1 (MVP)
- User authentication with roles
- Product inventory management
- Sales processing with invoicing
- Customer and supplier management
- Basic financial dashboard

### Phase 2 (Enhancements)
- PDF invoice generation
- Low stock notifications
- Sales reports and analytics
- Credit/debt tracking

### Phase 3 (Advanced)
- Multi-store support
- Advanced analytics
- Mobile responsiveness
- Barcode scanning

## Project Structure
```
construction-materials-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── App.js
└── README.md
```
