const router = require('express').Router();
const c = require('../controllers/subscription.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/plans',  c.getPlans);
router.post('/',      requireAuth, c.subscribe);

module.exports = router;
