const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();
const { JWT_SECRET } = process.env;

// Middleware to authenticate JWT token
exports.authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer TOKEN" format

    // Check if token is provided
    if (!token) {
      return res.status(401).json({ msg: 'Authorization denied, token is required' });
    }

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Provide more detailed error messages for debugging
        const errorMsg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
        return res.status(401).json({ msg: errorMsg });
      }

      req.user = decoded.user; // Store user data from the token payload
      next();
    });
  } catch (err) {
    console.error('Error during token authentication:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Middleware to verify user password
exports.verifyPassword = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  // Input validation
  if (!password) {
    return res.status(400).json({ msg: 'Password is required' });
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Compare the provided password with the user's hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return res.json({ isValid: true });
    } else {
      return res.status(400).json({ msg: 'Incorrect password' });
    }
  } catch (err) {
    console.error('Error during password verification:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get users with optional filters and exclude the logged-in user
exports.getUsers = async (req, res) => {
  try {
    const { bloodGroup, country, state, district, city } = req.query;
    const loggedInUserId = req.user.id;

    // Query to find users except the logged-in user
    const query = { _id: { $ne: loggedInUserId } };

    // Add filters if provided in query params
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (country) query.country = country;
    if (state) query.state = state;
    if (district) query.district = district;
    if (city) query.city = city;

    // Fetch users based on the query
    const users = await User.find(query);

    // If no users found, return 404
    if (users.length === 0) {
      return res.status(404).json({ msg: 'No users found with the specified details' });
    }

    res.json(users); // Respond with found users
  } catch (err) {
    console.error('Error during user filtering:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};
