// src/routes/blogRoutes.js
const express = require('express');
const blogController = require('../controllers/blogController');
const router = express.Router();

// Route to create a new blog post
router.post('/', blogController.createBlog);

// Route to get all blog posts
router.get('/', blogController.getBlogs);

// Route to get a specific blog post by ID
router.get('/:id', blogController.getBlogById);

// Route to update a blog post by ID
router.put('/:id', blogController.updateBlog);

// Route to delete a blog post by ID
router.delete('/:id', blogController.deleteBlog);

module.exports = router;
