const { SubscriptionPlan, Subscription } = require('../models');

// GET /api/subscriptions/plans
async function getPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.findAll();
    return res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/subscriptions
async function subscribe(req, res) {
  const { plan_id } = req.body;

  try {
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) return res.status(404).json({ message: 'План не знайдено' });

    const start_date = new Date();
    const end_date   = new Date();
    end_date.setDate(end_date.getDate() + plan.duration_days);

    const subscription = await Subscription.create({
      client_id:        req.user.clientId,
      plan_id,
      start_date,
      end_date,
      washes_remaining: plan.washes_included,
      status:           'active',
    });

    return res.status(201).json(subscription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { getPlans, subscribe };
