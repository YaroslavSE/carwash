const { Branch, BranchService, Service } = require('../models');
const sequelize = require('../db/sequelize');

// GET /api/branches
async function getAllBranches(req, res) {
  try {
    const branches = await Branch.findAll({
      where: { is_active: true },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COALESCE(AVG(r.rating), 0)
              FROM review AS r
              JOIN "order" AS o ON o.order_id = r.order_id
              WHERE o.branch_id = branch.branch_id
            )`),
            'rating'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(r.review_id)
              FROM review AS r
              JOIN "order" AS o ON o.order_id = r.order_id
              WHERE o.branch_id = branch.branch_id
            )`),
            'reviews_count'
          ]
        ]
      }
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
