const Review = require("../models/Review");
const User = require('../models/User');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { userId, rating, comment, image } = req.body;

    // Input validation
    if (!userId || !rating || !comment) {
      return res.status(400).json({ msg: "User ID, rating, and comment are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // Ensure the user exists before creating a review
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the user already has a review
    if (user.reviewId) {
      return res.status(400).json({ msg: 'User has already submitted a review' });
    }

    // Create and save the new review
    const newReview = new Review({ username: user.firstName, rating, comment, image });
    await newReview.save();

    // Link the review to the user
    user.reviewId = newReview._id;
    await user.save();

    res.status(201).json({ msg: "Review added successfully", review: newReview });
  } catch (err) {
    console.error("Error creating review:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, image } = req.body;

    // Validate review ID and new data
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    // Update only the fields provided
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (image) review.image = image;

    await review.save();

    res.json({ msg: "Review updated successfully", review });
  } catch (err) {
    console.error("Error updating review:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete a review by ID
exports.deleteReview = async (req, res) => {
  try {
    const { id: reviewId } = req.params;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    // Find the user linked to this review
    const user = await User.findOne({ reviewId });
    if (user) {
      // Remove the review reference from the user
      user.reviewId = undefined;
      await user.save();
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    res.json({ msg: "Review and reference in user data deleted successfully" });
  } catch (err) {
    console.error("Error deleting review:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get all reviews
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find();

    if (reviews.length === 0) {
      return res.status(404).json({ msg: "No reviews found" });
    }

    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};
