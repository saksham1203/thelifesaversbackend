const mongoose = require('mongoose');

// Define the Review Schema
const ReviewSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    validate: {
      validator: function (v) {
        // Accept either a valid URL or a base64 encoded image string
        const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        const base64Pattern = /^data:image\/(png|jpg|jpeg|gif);base64,/;
        return urlPattern.test(v) || base64Pattern.test(v);
      },
      message: 'Invalid image format, must be a valid URL or base64-encoded string',
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Review', ReviewSchema);
