const { 
  Order, Employee, Branch, Service, 
  BranchService, Equipment, Client,
  sequelize: sq 
} = require('../models');
const sequelize = require('../db/sequelize');
const { Op } = require('sequelize');

// ── Замовлення ───────────────────────────────────────────────

// GET /api/admin/orders
async function getAllOrders(req, res) {
  const { status, branch_id, date_from, date_to } = req.query;
  const where = {};

  if (status)    where.status    = status;
  if (branch_id) where.branch_id = branch_id;
  if (date_from || date_to) {
    where.scheduled_time = {};
    if (date_from) where.scheduled_time[Op.gte] = new Date(date_from);
    if (date_to)   where.scheduled_time[Op.lte] = new Date(date_to);
  }

  try {
    const orders = await Order.findAll({
      where,
      include: [
        { model: Employee, attributes: ['first_name', 'last_name'] },
        { model: Branch,   attributes: ['name'] },
      ],
      order: [['scheduled_time', 'DESC']],
    });
    return res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// PATCH /api/admin/orders/:id/status
async function updateOrderStatus(req, res) {
  const { status } = req.body;
  const allowed = ['pending', 'in_progress', 'completed', 'cancelled'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Невірний статус' });
  }

  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Замовлення не знайдено' });

    await order.update({ status });
    return res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Співробітники ────────────────────────────────────────────

// GET /api/admin/employees
async function getEmployees(req, res) {
  try {
    const employees = await Employee.findAll({
      include: [{ model: Branch, attributes: ['name'] }],
    });
    return res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/admin/employees
async function createEmployee(req, res) {
  const { branch_id, first_name, last_name, role, phone, hire_date, salary } = req.body;
  const bcrypt = require('bcryptjs');

  try {
    const password_hash = await bcrypt.hash(phone, 10); // тимчасовий пароль = телефон
    const employee = await Employee.create({
      branch_id, first_name, last_name,
      role, phone, hire_date, salary,
      password_hash,
    });
    return res.status(201).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// PUT /api/admin/employees/:id
async function updateEmployee(req, res) {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Співробітника не знайдено' });

    await employee.update(req.body);
    return res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// DELETE /api/admin/employees/:id
async function deleteEmployee(req, res) {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Співробітника не знайдено' });

    await employee.update({ is_active: false });
    return res.json({ message: 'Співробітника деактивовано' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Обладнання ───────────────────────────────────────────────

// GET /api/admin/equipment
async function getEquipment(req, res) {
  try {
    const equipment = await Equipment.findAll({
      include: [{ model: Branch, attributes: ['name'] }],
    });
    return res.json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/admin/equipment
async function createEquipment(req, res) {
  try {
    const equipment = await Equipment.create(req.body);
    return res.status(201).json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// PATCH /api/admin/equipment/:id/status
async function updateEquipmentStatus(req, res) {
  const { status } = req.body;
  const allowed = ['operational', 'maintenance', 'broken'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Невірний статус' });
  }

  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) return res.status(404).json({ message: 'Обладнання не знайдено' });

    await equipment.update({ status });
    return res.json(equipment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Звіти ────────────────────────────────────────────────────

// GET /api/admin/reports/revenue?date_from=&date_to=
async function getRevenueReport(req, res) {
  const { date_from, date_to } = req.query;

  try {
    const result = await sequelize.query(`
      SELECT 
        b.name                          AS branch,
        COUNT(o.order_id)               AS total_orders,
        SUM(p.amount)                   AS total_revenue,
        AVG(p.amount)                   AS avg_order_value
      FROM "order" o
      JOIN payment p  ON p.order_id  = o.order_id
      JOIN branch  b  ON b.branch_id = o.branch_id
      WHERE p.status = 'completed'
        AND o.scheduled_time BETWEEN :date_from AND :date_to
      GROUP BY b.name
      ORDER BY total_revenue DESC
    `, {
      replacements: { date_from, date_to },
      type: sequelize.QueryTypes.SELECT,
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/admin/reports/popular-services
async function getPopularServices(req, res) {
  try {
    const result = await sequelize.query(`
      SELECT 
        s.name,
        s.category,
        COUNT(oi.order_item_id)   AS times_ordered,
        SUM(oi.subtotal)          AS total_revenue
      FROM order_item oi
      JOIN service s ON s.service_id = oi.service_id
      GROUP BY s.name, s.category
      ORDER BY times_ordered DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = {
  getAllOrders, updateOrderStatus,
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getEquipment, createEquipment, updateEquipmentStatus,
  getRevenueReport, getPopularServices,
};
