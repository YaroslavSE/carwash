const { Review, Order, Client, Branch } = require('../models');

// POST /api/orders/:id/review
async function createReview(req, res) {
  const { rating, comment } = req.body;
  const order_id = parseInt(req.params.id);

  try {
    const order = await Order.findByPk(order_id);

    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });

    if (order.client_id !== req.user.clientId) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Можна залишити відгук лише для завершеного замовлення' });
    }

    const existing = await Review.findOne({ where: { order_id } });
    if (existing) {
      return res.status(409).json({ message: 'Відгук вже існує' });
    }

    const review = await Review.create({
      order_id,
      client_id: req.user.clientId,
      rating,
      comment,
    });

    return res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/branches/:id/reviews
async function getBranchReviews(req, res) {
  try {
    const reviews = await Review.findAll({
      include: [{
        model: Order,
        where: { branch_id: req.params.id },
        attributes: [],
      }],
      order: [['created_at', 'DESC']],
    });
    return res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}
// GET /api/reviews/latest
async function getLatestReviews(req, res) {
  console.log('HITTING /api/reviews/latest');
  try {
    const { Op } = require('sequelize');
    console.log('Fetching reviews...');
    const reviews = await Review.findAll({
      where: { rating: { [Op.gte]: 4 } },
      include: [
        { model: Client, attributes: ['first_name', 'last_name'] },
        { model: Order, include: [{ model: Branch, attributes: ['name'] }] }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    console.log('Found reviews:', reviews.length);
    res.json(reviews);
    console.log('Response sent');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/admin/reviews (used by admin routes if needed, or we just put it here)
async function getAllReviews(req, res) {
  try {
    const reviews = await Review.findAll({
      include: [
        { model: Client, attributes: ['first_name', 'last_name', 'phone'] },
        { model: Order, include: [{ model: Branch, attributes: ['name'] }] }
      ],
      order: [['created_at', 'DESC']]
    });
    return res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { createReview, getBranchReviews, getLatestReviews, getAllReviews };
