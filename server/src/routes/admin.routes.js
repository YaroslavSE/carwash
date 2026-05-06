const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

router.get('/orders',                    c.getAllOrders);
router.patch('/orders/:id/status',       c.updateOrderStatus);

router.get('/employees',                 c.getEmployees);
router.post('/employees',                requireRole('admin'), c.createEmployee);
router.put('/employees/:id',             requireRole('admin'), c.updateEmployee);
router.delete('/employees/:id',          requireRole('admin'), c.deleteEmployee);

router.get('/equipment',                 c.getEquipment);
router.post('/equipment',                c.createEquipment);
router.patch('/equipment/:id/status',    c.updateEquipmentStatus);

router.get('/reports/revenue',           c.getRevenueReport);
router.get('/reports/popular-services',  c.getPopularServices);

module.exports = router;
