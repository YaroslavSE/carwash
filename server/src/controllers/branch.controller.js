const { Branch, BranchService, Service } = require('../models');

// GET /api/branches
async function getAllBranches(req, res) {
  try {
    const branches = await Branch.findAll({
      where: { is_active: true },
    });
    return res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/branches/:id/services
async function getBranchServices(req, res) {
  try {
    const services = await BranchService.findAll({
      where: { branch_id: req.params.id, is_available: true },
      include: [{ model: Service }],
    });
    return res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { getAllBranches, getBranchServices };
