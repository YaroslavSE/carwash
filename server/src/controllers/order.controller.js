const { Order, OrderItem, Branch, Employee, Service, Payment, Subscription, SubscriptionPlan, Review } = require('../models');
const sequelize = require('../db/sequelize');

// GET /api/orders — мої замовлення
async function getMyOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Branch,  attributes: ['name', 'address'] },
        { model: OrderItem, include: [{ model: Service, attributes: ['name'] }] },
        { model: Payment, attributes: ['amount', 'payment_method', 'status'] },
        { model: Review, attributes: ['review_id', 'rating'] },
      ],
      where: {
        client_id: req.user.clientId,
      },
      order: [['order_date', 'DESC']],
    });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/orders/:id
async function getOrderById(req, res) {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Branch },
        { model: Employee, attributes: ['first_name', 'last_name', 'role'] },
        { model: OrderItem, include: [{ model: Service }] },
        { model: Payment },
      ],
    });

    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });

    return res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/orders
async function createOrder(req, res) {
  const { branch_id, employee_id, scheduled_time, services, box_number, notes } = req.body;
  // services: [{ service_id, quantity }]

  const t = await sequelize.transaction();
  try {

    // Отримуємо ціни послуг з branch_service
    const { BranchService } = require('../models');
    const branchServices = await BranchService.findAll({
      where: {
        branch_id,
        service_id: services.map(s => s.service_id),
        is_available: true,
      },
      include: [{ model: Service }],
    });

    if (branchServices.length !== services.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Деякі послуги недоступні в цій філії' });
    }

    // Рахуємо загальну суму та тривалість
    let total_amount = 0;
    let duration_minutes = 0;
    let applied_subscription_id = null;
    let discount_amount = 0;
    
    // Перевірка активної підписки
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const activeSubscription = await Subscription.findOne({
      where: { 
        client_id: req.user.clientId, 
        status: 'active',
        end_date: { [Op.gte]: today }
      },
      include: [{ 
        model: SubscriptionPlan, 
        include: [{ model: Service }]
      }]
    });

    let canUseSubscription = false;
    let planServiceIds = [];
    
    if (activeSubscription) {
      planServiceIds = activeSubscription.subscription_plan.services.map(s => s.service_id);
      const requestedServiceIds = services.map(s => s.service_id);
      const hasCoveredService = requestedServiceIds.some(id => planServiceIds.includes(id));
      
      if (hasCoveredService) {
        if (activeSubscription.subscription_plan.is_unlimited) {
          // Перевірка денного ліміту
          const usageCount = await Order.count({
            where: {
              client_id: req.user.clientId,
              subscription_id: activeSubscription.subscription_id,
              order_date: { [Op.gte]: today },
              status: { [Op.ne]: 'cancelled' }
            }
          });
          if (usageCount < activeSubscription.subscription_plan.daily_limit) {
            canUseSubscription = true;
          }
        } else {
          // Лімітована підписка
          if (activeSubscription.washes_remaining > 0) {
            canUseSubscription = true;
          }
        }
      }
    }

    const orderItems = services.map(s => {
      const bs = branchServices.find(b => b.service_id === s.service_id);
      let priceToCharge = bs.price;
      
      // Якщо підписка застосовується і покриває цю послугу
      if (canUseSubscription && planServiceIds.includes(s.service_id)) {
        discount_amount += priceToCharge * s.quantity;
        priceToCharge = 0;
      }
      
      const subtotal = priceToCharge * s.quantity;
      total_amount += subtotal;
      duration_minutes += bs.service.duration_minutes * s.quantity;
      
      return {
        service_id: s.service_id,
        quantity: s.quantity,
        unit_price: priceToCharge,
      };
    });

    if (canUseSubscription) {
      applied_subscription_id = activeSubscription.subscription_id;
    }

    const order = await Order.create({
      client_id: req.user.clientId,
      branch_id,
      employee_id,
      subscription_id: applied_subscription_id,
      scheduled_time,
      duration_minutes,
      box_number,
      total_amount,
      discount_amount,
      notes,
    }, { transaction: t });

    await OrderItem.bulkCreate(
      orderItems.map(item => ({ ...item, order_id: order.order_id })),
      { transaction: t }
    );
    
    // Списання балансу/лімітів підписок відбуватиметься при зміні статусу на 'completed'

    await t.commit();

    return res.status(201).json(order);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// PATCH /api/orders/:id/cancel
async function cancelOrder(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });
    if (order.client_id !== req.user.clientId) {
      return res.status(403).json({ message: 'Немає доступу' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Не можна скасувати це замовлення' });
    }

    await order.update({ status: 'cancelled' });

    return res.json({ message: 'Замовлення скасовано', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/orders/schedule?branch_id=X&date=YYYY-MM-DD
async function getSchedule(req, res) {
  const { branch_id, date } = req.query;
  if (!branch_id || !date) {
    return res.status(400).json({ message: 'branch_id and date are required' });
  }

  try {
    const { Op } = require('sequelize');
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.findAll({
      attributes: ['order_id', 'scheduled_time', 'duration_minutes', 'box_number', 'status'],
      where: {
        branch_id,
        scheduled_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
        status: {
          [Op.ne]: 'cancelled'
        }
      },
    });

    return res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { getMyOrders, getOrderById, createOrder, cancelOrder, getSchedule };
