const express = require('express');
const router = express.Router();
const c = require('../controllers/stripe.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Note: /webhook is mounted in app.js before express.json()
router.post('/create-checkout-session', requireAuth, c.createCheckoutSession);

module.exports = router;
