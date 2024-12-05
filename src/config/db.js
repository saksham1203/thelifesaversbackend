const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug: Log MONGO_URI to verify if it's being loaded correctly
console.log('MONGO_URI:', process.env.MONGO_URI);

// Validate required environment variables
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is missing in the environment variables');
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // Timeout after 5 seconds if server not found
      socketTimeoutMS: 45000,          // Close socket after 45 seconds of inactivity
      maxPoolSize: 10                  // Set maximum pool size to maintain up to 10 connections
    });
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }

  // Log MongoDB disconnections
  mongoose.connection.on('disconnected', () => {
    console.error('MongoDB disconnected');
  });
};

module.exports = connectDB;
