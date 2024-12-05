const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');

    // Define the default mobile number and regex for valid mobile numbers
    const defaultMobileNumber = process.env.DEFAULT_MOBILE_NUMBER || '+911234567890'; // Fallback to default number if not in env
    const validMobileRegex = /^\+?[1-9]\d{1,14}$/;

    // Find users with invalid mobile numbers (excluding already valid ones)
    const invalidUsers = await User.find({ mobileNumber: { $not: validMobileRegex } });
    console.log(`Found ${invalidUsers.length} users with invalid mobile numbers`);

    // Use bulk update to improve performance
    const bulkOperations = invalidUsers.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { mobileNumber: defaultMobileNumber } }
      }
    }));

    if (bulkOperations.length > 0) {
      const bulkWriteResult = await User.bulkWrite(bulkOperations);
      console.log(`Updated ${bulkWriteResult.modifiedCount} users with invalid mobile numbers`);
    } else {
      console.log('No users with invalid mobile numbers found.');
    }

    process.exit();
  } catch (error) {
    console.error('Error updating user mobile numbers:', error.message);
    process.exit(1);
  }
};

connectDB();
