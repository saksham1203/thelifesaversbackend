const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateUser,
  forgotPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  contactUs
} = require('../controllers/userController');
const {
  authenticateToken,
  verifyPassword
} = require('../middleware/auth');
const User = require('../models/User');
const {
  createReview,
  updateReview,
  deleteReview,
  getReviews
} = require('../controllers/reviewController');
const { body, param } = require('express-validator');
const chatController = require('../controllers/chatController'); // Import the chatController

// Register a new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('mobileNumber').isMobilePhone().withMessage('Invalid mobile number'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  registerUser
);

// Login user
router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('Email or mobile number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

// Update user details (authenticated)
router.put(
  '/users/:id',
  [
    authenticateToken,
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
  ],
  updateUser
);

// Verify user password (authenticated)
router.post(
  '/verify-password',
  authenticateToken,
  [
    body('password').notEmpty().withMessage('Password is required')
  ],
  verifyPassword
);

// Forgot password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  resetPassword
);

// Send OTP for email verification
router.post(
  '/send-verification-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  sendOtp
);

// Verify OTP
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
  ],
  verifyOtp
);

// Get users with optional filters and exclude the logged-in user
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { bloodGroup, country, state, district, city } = req.query;
    const loggedInUserId = req.user.id;

    const query = { _id: { $ne: loggedInUserId } }; // Exclude logged-in user
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (country) query.country = country;
    if (state) query.state = state;
    if (district) query.district = district;
    if (city) query.city = city;

    const users = await User.find(query);

    if (users.length === 0) {
      return res.status(404).json({ msg: 'No users found with the specified details' });
    }

    res.json(users);
  } catch (err) {
    console.error('Error in filtering users:', err.message);
    res.status(500).send('Server error');
  }
});

// Review routes (Authenticated)
router.post(
  '/reviews',
  authenticateToken,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().withMessage('Comment is required'),
  ],
  createReview
);

router.put(
  '/reviews/:reviewId',
  authenticateToken,
  [
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().notEmpty().withMessage('Comment is required'),
  ],
  updateReview
);

router.delete(
  '/reviews/:id',
  authenticateToken,
  [
    param('id').isMongoId().withMessage('Invalid review ID'),
  ],
  deleteReview
);

router.get('/reviews', getReviews); // Public route to get all reviews

// Contact Us route
router.post(
  '/contact',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('phoneNumber').isMobilePhone().withMessage('Invalid phone number'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  contactUs // Handle the contact form submission
);

// Chat history route (to retrieve chat history)
router.get('/chat/history', chatController.getChatHistory); // Public route to get chat history

module.exports = router;
