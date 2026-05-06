const { Payment, Order, Account, AccountTransaction, Vehicle } = require('../models');
const sequelize = require('../db/sequelize');

// POST /api/orders/:id/pay
async function payOrder(req, res) {
  const { payment_method } = req.body;
  const order_id = parseInt(req.params.id);

  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(order_id, {
      include: [{ model: Vehicle }],
      transaction: t,
      lock: true,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Замовлення не знайдено' });
    }

    if (order.vehicle.client_id !== req.user.clientId) {
      await t.rollback();
      return res.status(403).json({ message: 'Немає доступу' });
    }

    const existingPayment = await Payment.findOne({ where: { order_id }, transaction: t });
    if (existingPayment) {
      await t.rollback();
      return res.status(409).json({ message: 'Замовлення вже оплачено' });
    }

    const amount = parseFloat(order.total_amount) - parseFloat(order.discount_amount);

    // Якщо оплата з балансу рахунку
    if (payment_method === 'online') {
      const account = await Account.findOne({
        where: { client_id: req.user.clientId },
        transaction: t,
        lock: true,
      });

      if (!account || parseFloat(account.balance) < amount) {
        await t.rollback();
        return res.status(400).json({ message: 'Недостатньо коштів на рахунку' });
      }

      await AccountTransaction.create({
        account_id:     account.account_id,
        order_id,
        type:           'payment',
        amount,
        balance_before: account.balance,
        balance_after:  parseFloat(account.balance) - amount,
        description:    `Оплата замовлення #${order_id}`,
      }, { transaction: t });
    }

    const payment = await Payment.create({
      order_id,
      amount,
      payment_method,
      status: 'completed',
    }, { transaction: t });

    // Нараховуємо loyalty points (1 бал за кожні 10 грн)
    const points = Math.floor(amount / 10);
    if (points > 0) {
      await order.vehicle.client.increment('loyalty_points', {
        by: points,
        transaction: t,
      });
    }

    await t.commit();
    return res.status(201).json(payment);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/account/top-up
async function topUpAccount(req, res) {
  const { amount } = req.body;

  const t = await sequelize.transaction();
  try {
    const account = await Account.findOne({
      where: { client_id: req.user.clientId },
      transaction: t,
      lock: true,
    });

    if (!account) {
      await t.rollback();
      return res.status(404).json({ message: 'Рахунок не знайдено' });
    }

    await AccountTransaction.create({
      account_id:     account.account_id,
      type:           'top_up',
      amount,
      balance_before: account.balance,
      balance_after:  parseFloat(account.balance) + parseFloat(amount),
      description:    'Поповнення рахунку',
    }, { transaction: t });

    await t.commit();

    const updated = await Account.findByPk(account.account_id);
    return res.json({ balance: updated.balance });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/account
async function getAccount(req, res) {
  try {
    const account = await Account.findOne({
      where: { client_id: req.user.clientId },
      include: [{
        model: AccountTransaction,
        order: [['created_at', 'DESC']],
        limit: 20,
      }],
    });

    if (!account) return res.status(404).json({ message: 'Рахунок не знайдено' });

    return res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { payOrder, topUpAccount, getAccount };
