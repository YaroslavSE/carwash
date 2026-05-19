const { Client, Account, Subscription, SubscriptionPlan, Review, Order, Service } = require('../models');

// GET /api/clients/me
async function getMe(req, res) {
  try {
    const client = await Client.findByPk(req.user.clientId, {
      attributes: { exclude: [] },
      include: [{ model: Account, attributes: ['balance'] }],
    });

    if (!client) return res.status(404).json({ message: 'Клієнта не знайдено' });

    return res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// PUT /api/clients/me
async function updateMe(req, res) {
  const { first_name, last_name, phone } = req.body;

  try {
    const client = await Client.findByPk(req.user.clientId);
    if (!client) return res.status(404).json({ message: 'Клієнта не знайдено' });

    await client.update({ first_name, last_name, phone });

    return res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}


// GET /api/clients/me/subscriptions
async function getMySubscriptions(req, res) {
  try {
    const subscriptions = await Subscription.findAll({
      where: { client_id: req.user.clientId },
      include: [{ 
        model: SubscriptionPlan,
        include: [{ model: Service, through: { attributes: [] } }]
      }],
      order: [['start_date', 'DESC']],
    });
    return res.json(subscriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = {
  getMe,
  updateMe,
  getMySubscriptions,
};
