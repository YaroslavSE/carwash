const { Review, Order, Vehicle } = require('../models');

// POST /api/orders/:id/review
async function createReview(req, res) {
  const { rating, comment } = req.body;
  const order_id = parseInt(req.params.id);

  try {
    const order = await Order.findByPk(order_id, {
      include: [{ model: Vehicle }],
    });

    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });

    if (order.vehicle.client_id !== req.user.clientId) {
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

module.exports = { createReview, getBranchReviews };
