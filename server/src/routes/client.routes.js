const router = require('express').Router();
const c = require('../controllers/client.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/',                    c.getMe);
router.put('/',                    c.updateMe);
router.get('/subscriptions',       c.getMySubscriptions);

module.exports = router;
