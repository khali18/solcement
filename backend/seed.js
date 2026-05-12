const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Supplier = require('./models/Supplier');
require('dotenv').config();

const connectDB = require('./config/database');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Customer.deleteMany();
    await Supplier.deleteMany();

    console.log('Creating default accounts...');

    // Create default users
    const adminPassword = await bcrypt.hash('admin123', 12);
    const salesPassword = await bcrypt.hash('sales123', 12);
    const managerPassword = await bcrypt.hash('manager123', 12);

    const users = await User.insertMany([
      {
        name: 'Administrator',
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        phone: '08012345678',
        isActive: true
      },
      {
        name: 'Sales Staff',
        username: 'sales',
        password: salesPassword,
        role: 'sales_staff',
        phone: '08012345679',
        isActive: true
      },
      {
        name: 'Store Manager',
        username: 'manager',
        password: managerPassword,
        role: 'store_manager',
        phone: '08012345680',
        isActive: true
      }
    ]);

    console.log('Users created:');
    console.log('  admin / admin123 (Admin)');
    console.log('  sales / sales123 (Sales Staff)');
    console.log('  manager / manager123 (Store Manager)');

    // Create sample products
    const products = await Product.insertMany([
      {
        name: 'Dangote Cement 50kg',
        description: 'Premium quality cement for construction',
        category: 'cement',
        unit: 'bag',
        quantity: 150,
        minStockLevel: 50,
        costPrice: 4500,
        sellingPrice: 5200,
        location: 'Warehouse A',
        isActive: true
      },
      {
        name: 'Iron Rod 12mm',
        description: 'Steel reinforcement bar',
        category: 'iron_rods',
        unit: 'piece',
        quantity: 200,
        minStockLevel: 30,
        costPrice: 3500,
        sellingPrice: 4200,
        location: 'Warehouse B',
        isActive: true
      },
      {
        name: 'Zinc Roofing Sheet',
        description: 'Aluminum zinc coated roofing',
        category: 'zinc',
        unit: 'piece',
        quantity: 80,
        minStockLevel: 20,
        costPrice: 8500,
        sellingPrice: 10000,
        location: 'Warehouse A',
        isActive: true
      },
      {
        name: 'Dulux Paint 20L',
        description: 'Weather shield exterior paint',
        category: 'paint',
        unit: 'liter',
        quantity: 45,
        minStockLevel: 15,
        costPrice: 18000,
        sellingPrice: 22000,
        location: 'Warehouse C',
        isActive: true
      },
      {
        name: 'Floor Tiles 60x60',
        description: 'Ceramic floor tiles',
        category: 'tiles',
        unit: 'square_meter',
        quantity: 300,
        minStockLevel: 50,
        costPrice: 4500,
        sellingPrice: 5500,
        location: 'Warehouse A',
        isActive: true
      }
    ]);

    console.log(`Created ${products.length} products`);

    // Create sample customers
    const customers = await Customer.insertMany([
      {
        name: 'ABC Construction Ltd',
        email: 'abc@construction.com',
        phone: '08098765432',
        type: 'company',
        creditLimit: 500000,
        currentCredit: 0,
        totalPurchases: 0,
        totalPaid: 0,
        isActive: true
      },
      {
        name: 'John Contractor',
        email: 'john@email.com',
        phone: '08087654321',
        type: 'contractor',
        creditLimit: 200000,
        currentCredit: 0,
        totalPurchases: 0,
        totalPaid: 0,
        isActive: true
      },
      {
        name: 'Mike Retailer',
        email: 'mike@retail.com',
        phone: '08076543210',
        type: 'retailer',
        creditLimit: 100000,
        currentCredit: 0,
        totalPurchases: 0,
        totalPaid: 0,
        isActive: true
      }
    ]);

    console.log(`Created ${customers.length} customers`);

    // Create sample suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'Dangote Cement Distributor',
        contactPerson: 'Mr. Adamu',
        email: 'dangote@supply.com',
        phone: '08011111111',
        category: 'cement',
        totalPurchases: 0,
        totalPaid: 0,
        paymentTerms: 'immediate',
        isActive: true
      },
      {
        name: 'Nigerian Steel Ltd',
        contactPerson: 'Mrs. Okonkwo',
        email: 'steel@supply.com',
        phone: '08022222222',
        category: 'iron_rods',
        totalPurchases: 0,
        totalPaid: 0,
        paymentTerms: '15_days',
        isActive: true
      },
      {
        name: 'Premium Paints Nigeria',
        contactPerson: 'Mr. Emeka',
        email: 'paints@supply.com',
        phone: '08033333333',
        category: 'paint',
        totalPurchases: 0,
        totalPaid: 0,
        paymentTerms: '30_days',
        isActive: true
      }
    ]);

    console.log(`Created ${suppliers.length} suppliers`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\nDefault Login Accounts:');
    console.log('------------------------');
    console.log('Admin:      admin / admin123');
    console.log('Sales:      sales / sales123');
    console.log('Manager:    manager / manager123');
    console.log('------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
