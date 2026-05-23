const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from the backend folder
dotenv.config({ path: '../backend/.env' }); // or use the known production URI

const MONGODB_URI = "mongodb+srv://sheripha2_db_user:rbZiuXOblwvpC3ft@cluster0.bafzrhl.mongodb.net/construction_materials?retryWrites=true&w=majority&appName=Cluster0";

const createWalkin = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to DB');

    const Customer = require('../backend/models/Customer');

    // Check if Walk-in Customer exists
    let walkin = await Customer.findOne({ name: 'Walk-in Customer' });
    
    if (!walkin) {
      walkin = await Customer.create({
        name: 'Walk-in Customer',
        phone: '0000000000',
        type: 'individual',
        notes: 'Default customer for walk-in sales',
        creditLimit: 0,
        currentCredit: 0
      });
      console.log('Created Walk-in Customer:', walkin._id);
    } else {
      console.log('Walk-in Customer already exists:', walkin._id);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createWalkin();
