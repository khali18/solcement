const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      connectTimeoutMS: 10000,
      bufferCommands: false, // Disable buffering
    });
    
    // Also disable buffering globally
    mongoose.set('bufferCommands', false);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Do not call process.exit(1) on Vercel as it crashes the serverless function
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
