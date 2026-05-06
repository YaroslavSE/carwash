const router = require('express').Router();
const c = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/',           c.getMyOrders);
router.get('/:id',        c.getOrderById);
router.post('/',          c.createOrder);
router.patch('/:id/cancel', c.cancelOrder);

module.exports = router;
