const { SubscriptionPlan, Subscription } = require('../models');
const { Op } = require('sequelize');

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

  const t = await require('../db/sequelize').transaction();
  try {
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      await t.rollback();
      return res.status(404).json({ message: 'План не знайдено' });
    }

    const activeSub = await Subscription.findOne({
      where: {
        client_id: req.user.clientId,
        status: 'active',
        end_date: { [Op.gt]: new Date() }
      }
    });

    if (activeSub) {
      await t.rollback();
      return res.status(400).json({ message: 'У вас вже є активна підписка. Одночасно можна мати лише одну.' });
    }

    const { Account, AccountTransaction } = require('../models');
    const account = await Account.findOne({ where: { client_id: req.user.clientId } });
    if (!account) {
      await t.rollback();
      return res.status(400).json({ message: 'Рахунок не знайдено' });
    }
    if (parseFloat(account.balance) < parseFloat(plan.price)) {
      await t.rollback();
      return res.status(400).json({ message: 'Недостатньо коштів на балансі' });
    }

    const balanceBefore = account.balance;
    const balanceAfter = parseFloat(account.balance) - parseFloat(plan.price);

    await AccountTransaction.create({
      account_id: account.account_id,
      type: 'payment',
      amount: plan.price,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `Оплата підписки: ${plan.name}`,
    }, { transaction: t });

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
    }, { transaction: t });

    await t.commit();

    return res.status(201).json(subscription);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { getPlans, subscribe };
