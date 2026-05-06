const router = require('express').Router();
const c = require('../controllers/branch.controller');

router.get('/',               c.getAllBranches);
router.get('/:id/services',   c.getBranchServices);

module.exports = router;
