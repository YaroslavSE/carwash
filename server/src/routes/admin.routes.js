const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);
router.use(requireRole('admin', 'manager'));

router.get('/orders',                    c.getAllOrders);
router.patch('/orders/:id/status',       c.updateOrderStatus);

router.get('/employees',                 c.getEmployees);
router.post('/employees',                requireRole('admin', 'manager'), c.createEmployee);
router.put('/employees/:id',             requireRole('admin', 'manager'), c.updateEmployee);
router.delete('/employees/:id',          requireRole('admin', 'manager'), c.deleteEmployee);


router.get('/branches',                  requireRole('admin'), c.getBranches);
router.post('/branches',                 requireRole('admin'), c.createBranch);
router.put('/branches/:id',              requireRole('admin'), c.updateBranch);
router.delete('/branches/:id',           requireRole('admin'), c.deleteBranch);

router.get('/services',                  requireRole('admin'), c.getServices);
router.post('/services',                 requireRole('admin'), c.createService);
router.put('/services/:id',              requireRole('admin'), c.updateService);
router.delete('/services/:id',           requireRole('admin'), c.deleteService);

router.get('/plans',                     requireRole('admin'), c.getPlans);
router.post('/plans',                    requireRole('admin'), c.createPlan);
router.put('/plans/:id',                 requireRole('admin'), c.updatePlan);
router.delete('/plans/:id',              requireRole('admin'), c.deletePlan);

router.get('/reports/revenue',           c.getRevenueReport);
router.get('/reports/popular-services',  c.getPopularServices);
router.get('/reports/revenue-over-time', c.getRevenueOverTime);
router.get('/reports/subscriptions',     c.getSubscriptionStats);

module.exports = router;
