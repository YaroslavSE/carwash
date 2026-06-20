const router = require('express').Router();
const c = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validate, rules } = require('../middleware/validate.middleware');

router.use(requireAuth);

router.get('/',        c.getAccount);
// Old unsafe top-up endpoint disabled in favor of Stripe
// router.post('/top-up', validate, rules.topUp, c.topUpAccount);

module.exports = router;
