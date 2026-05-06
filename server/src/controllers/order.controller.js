const { Order, OrderItem, Vehicle, Branch, Employee, Service, Payment } = require('../models');
const sequelize = require('../db/sequelize');

// GET /api/orders — мої замовлення
async function getMyOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Vehicle, attributes: ['brand', 'model', 'license_plate'] },
        { model: Branch,  attributes: ['name', 'address'] },
        { model: OrderItem, include: [{ model: Service, attributes: ['name'] }] },
        { model: Payment, attributes: ['amount', 'payment_method', 'status'] },
      ],
      where: {
        '$vehicle.client_id$': req.user.clientId,
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
        { model: Vehicle },
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
  const { vehicle_id, branch_id, employee_id, scheduled_time, services, notes } = req.body;
  // services: [{ service_id, quantity }]

  const t = await sequelize.transaction();
  try {
    // Перевіряємо що авто належить клієнту
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id, client_id: req.user.clientId },
    });
    if (!vehicle) {
      await t.rollback();
      return res.status(403).json({ message: 'Авто не знайдено' });
    }

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

    // Рахуємо загальну суму
    let total_amount = 0;
    const orderItems = services.map(s => {
      const bs = branchServices.find(b => b.service_id === s.service_id);
      const subtotal = bs.price * s.quantity;
      total_amount += subtotal;
      return {
        service_id: s.service_id,
        quantity: s.quantity,
        unit_price: bs.price,
      };
    });

    const order = await Order.create({
      vehicle_id,
      branch_id,
      employee_id,
      scheduled_time,
      total_amount,
      notes,
    }, { transaction: t });

    await OrderItem.bulkCreate(
      orderItems.map(item => ({ ...item, order_id: order.order_id })),
      { transaction: t }
    );

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
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Vehicle }],
    });

    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });
    if (order.vehicle.client_id !== req.user.clientId) {
      return res.status(403).json({ message: 'Немає доступу' });
    }
    if (!['pending', 'in_progress'].includes(order.status)) {
      return res.status(400).json({ message: 'Не можна скасувати це замовлення' });
    }

    await order.update({ status: 'cancelled' });

    return res.json({ message: 'Замовлення скасовано', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { getMyOrders, getOrderById, createOrder, cancelOrder };
