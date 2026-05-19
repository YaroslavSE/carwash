const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Public route for carousel
router.get('/latest', reviewController.getLatestReviews);

// Admin route
router.get('/', requireAuth, requireRole('admin', 'manager'), reviewController.getAllReviews);

// Client route to create review
router.post('/order/:id', requireAuth, reviewController.createReview);

module.exports = router;
