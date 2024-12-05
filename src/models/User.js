const mongoose = require('mongoose');

// Define the User Schema
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,  // Trim spaces from the beginning and end
    maxlength: 50,  // Limit first name length to avoid excessively long names
  },
  lastName: {
    type: String,
    required: true,
    trim: true,  // Trim spaces
    maxlength: 50,  // Limit last name length
  },
  email: {
    type: String,
    required: true,
    unique: true,  // Ensure unique email
    lowercase: true,  // Convert email to lowercase for consistency
    trim: true,  // Trim spaces
    validate: {
      validator: function (email) {
        // Simple email validation regex
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
      },
      message: 'Invalid email format',
    }
  },
  password: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true,  // Trim spaces
    unique: true,  // Ensure mobile number is unique
    validate: {
      validator: function (mobile) {
        // Basic mobile number validation (adjust based on country)
        return /^\+?[1-9]\d{1,14}$/.test(mobile);
      },
      message: 'Invalid mobile number format',
    }
  },
  dob: {
    type: Date, // Store date of birth as a Date object
    required: true, // Make it mandatory
    validate: {
      validator: function (value) {
        // Ensure the date is in the past
        return value < new Date();
      },
      message: 'Date of birth must be in the past',
    },
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],  // Only allow valid blood groups
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'], // Ensure the enum values match expected values (case-sensitive)
    lowercase: true,  // Automatically convert gender to lowercase
  },
  availability: {
    type: Boolean,
    default: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  district: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  termsAccepted: {
    type: Boolean,
    required: true,
  },
  resetPasswordOtp: {
    type: String,
    select: false,  // Hide this field by default when querying users
  },
  resetPasswordExpires: {
    type: Date,
    select: false,  // Hide this field by default when querying users
  },
  
  // Reference to Review
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
  }
}, {
  timestamps: true  // Automatically handle createdAt and updatedAt fields
});

// Indexes for faster querying on frequently used fields
UserSchema.index({ email: 1 });
UserSchema.index({ mobileNumber: 1 });
UserSchema.index({ bloodGroup: 1 });
UserSchema.index({ city: 1 });

module.exports = mongoose.model('User', UserSchema);
