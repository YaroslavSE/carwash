const {
  Order, Employee, Branch, Service,
  BranchService, Client, SubscriptionPlan,
  sequelize: sq
} = require('../models');
const sequelize = require('../db/sequelize');
const { Op } = require('sequelize');

// ── Замовлення ───────────────────────────────────────────────

// GET /api/admin/orders
async function getAllOrders(req, res) {
  const { status, branch_id, date_from, date_to } = req.query;
  const where = {};

  if (status) where.status = status;
  if (branch_id) where.branch_id = branch_id;
  if (date_from || date_to) {
    where.scheduled_time = {};
    if (date_from) where.scheduled_time[Op.gte] = new Date(date_from);
    if (date_to) where.scheduled_time[Op.lte] = new Date(date_to);
  }

  try {
    const orders = await Order.findAll({
      where,
      include: [
        { model: Employee, attributes: ['first_name', 'last_name'] },
        { model: Branch, attributes: ['name'] },
      ],
      order: [['order_id', 'DESC']],
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

  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Замовлення не знайдено' });
    }

    if (status === 'completed' && order.status !== 'completed') {
      const amountToPay = parseFloat(order.total_amount);
      
      // Списання ліміту підписки
      if (order.subscription_id) {
        const { Subscription, SubscriptionPlan } = require('../models');
        const sub = await Subscription.findByPk(order.subscription_id, { include: [SubscriptionPlan], transaction: t });
        if (sub && !sub.subscription_plan.is_unlimited) {
          if (sub.washes_remaining <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Ліміт підписки вичерпано. Неможливо завершити.' });
          }
          const newRemaining = sub.washes_remaining - 1;
          const updates = { washes_remaining: newRemaining };
          if (newRemaining <= 0) {
            updates.status = 'expired';
          }
          await sub.update(updates, { transaction: t });
        }
      }

      // Списання з балансу
      if (amountToPay > 0) {
        const { Account, AccountTransaction } = require('../models');
        const account = await Account.findOne({ where: { client_id: order.client_id }, transaction: t });
        if (!account || parseFloat(account.balance) < amountToPay) {
          await t.rollback();
          return res.status(400).json({ message: 'Недостатньо коштів на балансі клієнта для завершення' });
        }

        const balanceBefore = account.balance;
        const balanceAfter = parseFloat(account.balance) - amountToPay;

        await AccountTransaction.create({
          account_id: account.account_id,
          order_id: order.order_id,
          type: 'payment',
          amount: amountToPay,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Оплата замовлення #${order.order_id}`,
        }, { transaction: t });
      }

      // Створення Payment для звітності
      const { Payment } = require('../models');
      const existingPayment = await Payment.findOne({ where: { order_id: order.order_id }, transaction: t });
      
      if (amountToPay > 0) {
        if (!existingPayment) {
          await Payment.create({
            order_id: order.order_id,
            amount: amountToPay,
            payment_method: 'online',
            status: 'completed',
          }, { transaction: t });
        } else {
          await existingPayment.update({ status: 'completed' }, { transaction: t });
        }
      } else if (existingPayment) {
        await existingPayment.update({ status: 'completed' }, { transaction: t });
      }
    }

    await order.update({ status }, { transaction: t });
    await t.commit();
    return res.json(order);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Співробітники ────────────────────────────────────────────

// GET /api/admin/employees
async function getEmployees(req, res) {
  try {
    const where = {};
    if (req.user.role === 'manager') {
      where.branch_id = req.employee.branch_id;
    }
    const employees = await Employee.findAll({
      where,
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
  const { first_name, last_name, role, phone, hire_date, salary, password } = req.body;
  let { branch_id } = req.body;
  
  if (req.user.role === 'manager') {
    branch_id = req.employee.branch_id;
  }
  
  const bcrypt = require('bcryptjs');

  try {
    const passwordToHash = password || phone; // тимчасовий пароль = вказаний або телефон
    const password_hash = await bcrypt.hash(passwordToHash, 10);
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
  const { password, ...updateData } = req.body;
  const bcrypt = require('bcryptjs');
  
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Співробітника не знайдено' });

    if (req.user.role === 'manager' && employee.branch_id !== req.employee.branch_id) {
      return res.status(403).json({ message: 'Немає доступу до співробітника іншої філії' });
    }
    if (req.user.role === 'manager') {
      delete updateData.branch_id;
    }

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    await employee.update(updateData);
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

    if (req.user.role === 'manager' && employee.branch_id !== req.employee.branch_id) {
      return res.status(403).json({ message: 'Немає доступу до співробітника іншої філії' });
    }

    await employee.destroy();
    return res.json({ message: 'Співробітника видалено' });
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Неможливо видалити співробітника, оскільки він має повʼязані замовлення.' });
    }
    res.status(500).json({ message: 'Помилка сервера' });
  }
}
// ── Звіти ────────────────────────────────────────────────────

// GET /api/admin/reports/revenue?date_from=&date_to=
async function getRevenueReport(req, res) {
  const { date_from, date_to } = req.query;

  try {
    let branchFilter = '';
    const replacements = { date_from, date_to };
    if (req.user.role === 'manager') {
      branchFilter = 'AND o.branch_id = :branch_id';
      replacements.branch_id = req.employee.branch_id;
    }

    const result = await sequelize.query(`
      SELECT 
        b.name                          AS branch,
        COUNT(o.order_id)               AS total_orders,
        COALESCE(SUM(p.amount), 0)      AS total_revenue,
        COALESCE(AVG(p.amount), 0)      AS avg_order_value
      FROM "order" o
      LEFT JOIN payment p  ON p.order_id  = o.order_id AND p.status = 'completed'
      JOIN branch  b  ON b.branch_id = o.branch_id
      WHERE o.status = 'completed'
        AND o.scheduled_time BETWEEN :date_from AND :date_to
        ${branchFilter}
      GROUP BY b.name
      ORDER BY total_revenue DESC
    `, {
      replacements,
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
    let joinBranch = '';
    let branchFilter = '';
    const replacements = {};
    if (req.user.role === 'manager') {
      joinBranch = 'JOIN "order" o ON o.order_id = oi.order_id';
      branchFilter = 'WHERE o.branch_id = :branch_id';
      replacements.branch_id = req.employee.branch_id;
    }

    const result = await sequelize.query(`
      SELECT 
        s.name,
        s.category,
        COUNT(oi.order_item_id)   AS times_ordered,
        SUM(oi.subtotal)          AS total_revenue
      FROM order_item oi
      JOIN service s ON s.service_id = oi.service_id
      ${joinBranch}
      ${branchFilter}
      GROUP BY s.name, s.category
      ORDER BY times_ordered DESC
      LIMIT 10
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/admin/reports/revenue-over-time?period=(day|week|month)
async function getRevenueOverTime(req, res) {
  const { period = 'day' } = req.query;
  const validPeriods = ['day', 'week', 'month'];
  if (!validPeriods.includes(period)) {
    return res.status(400).json({ message: 'Invalid period' });
  }

  try {
    let branchFilter = '';
    const replacements = {};
    if (req.user.role === 'manager') {
      branchFilter = 'AND o.branch_id = :branch_id';
      replacements.branch_id = req.employee.branch_id;
    }

    const result = await sequelize.query(`
      SELECT 
        DATE_TRUNC('${period}', o.scheduled_time) AS date,
        COALESCE(SUM(p.amount), 0) AS revenue,
        COUNT(o.order_id) AS orders
      FROM "order" o
      LEFT JOIN payment p ON p.order_id = o.order_id AND p.status = 'completed'
      WHERE o.status = 'completed'
      ${branchFilter}
      GROUP BY date
      ORDER BY date ASC
    `, { replacements, type: sequelize.QueryTypes.SELECT });

    return res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// GET /api/admin/reports/subscriptions
async function getSubscriptionStats(req, res) {
  try {
    const result = await sequelize.query(`
      SELECT 
        COUNT(s.subscription_id) AS total_subscriptions,
        COALESCE(SUM(p.price), 0) AS total_revenue
      FROM subscription s
      JOIN subscription_plan p ON s.plan_id = p.plan_id
      WHERE DATE_TRUNC('month', s.start_date) = DATE_TRUNC('month', CURRENT_DATE)
    `, { type: sequelize.QueryTypes.SELECT });

    return res.json(result[0] || { total_subscriptions: 0, total_revenue: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Філії ────────────────────────────────────────────────────

async function getBranches(req, res) {
  try {
    const branches = await Branch.findAll();
    return res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function createBranch(req, res) {
  try {
    const branch = await Branch.create(req.body);
    return res.status(201).json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function updateBranch(req, res) {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Філію не знайдено' });

    await branch.update(req.body);
    return res.json(branch);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function deleteBranch(req, res) {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Філію не знайдено' });

    await branch.destroy();
    return res.json({ message: 'Філію видалено' });
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Неможливо видалити філію, оскільки вона має повʼязані дані (співробітники, замовлення тощо).' });
    }
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Послуги ──────────────────────────────────────────────────

async function getServices(req, res) {
  try {
    const services = await Service.findAll({ order: [['service_id', 'ASC']] });
    return res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function createService(req, res) {
  try {
    const service = await Service.create(req.body);
    // Автоматично додаємо послугу до всіх існуючих філій з базовою ціною
    const branches = await Branch.findAll();
    if (branches.length > 0) {
      const branchServices = branches.map(b => ({
        branch_id: b.branch_id,
        service_id: service.service_id,
        price: service.base_price,
        is_available: true
      }));
      await BranchService.bulkCreate(branchServices);
    }
    return res.status(201).json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function updateService(req, res) {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Послугу не знайдено' });

    await service.update(req.body);
    return res.json(service);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function deleteService(req, res) {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return res.status(404).json({ message: 'Послугу не знайдено' });

    await service.destroy();
    return res.json({ message: 'Послугу видалено' });
  } catch (err) {
    console.error(err);
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Неможливо видалити послугу, оскільки вона використовується в замовленнях або філіях.' });
    }
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// ── Плани Підписок ───────────────────────────────────────────

async function getPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.findAll({ 
      include: [{ model: Service, through: { attributes: [] } }],
      order: [['price', 'ASC']] 
    });
    return res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function createPlan(req, res) {
  const { name, description, price, duration_days, is_unlimited, washes_included, daily_limit, discount_percent, services } = req.body;
  const t = await sequelize.transaction();
  try {
    const plan = await SubscriptionPlan.create({
      name, description, price, duration_days, is_unlimited, washes_included, daily_limit, discount_percent
    }, { transaction: t });
    
    if (services && services.length > 0) {
      // Use sequelize magic method to associate services
      await plan.addServices(services, { transaction: t });
    }
    
    await t.commit();
    
    // Fetch newly created plan with services
    const createdPlan = await SubscriptionPlan.findByPk(plan.plan_id, {
      include: [{ model: Service, through: { attributes: [] } }]
    });
    
    return res.status(201).json(createdPlan);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function updatePlan(req, res) {
  const { services, ...planData } = req.body;
  const t = await sequelize.transaction();
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      await t.rollback();
      return res.status(404).json({ message: 'План не знайдено' });
    }

    await plan.update(planData, { transaction: t });
    
    if (services !== undefined) {
      await plan.setServices(services, { transaction: t });
    }
    
    await t.commit();
    
    const updatedPlan = await SubscriptionPlan.findByPk(req.params.id, {
      include: [{ model: Service, through: { attributes: [] } }]
    });
    return res.json(updatedPlan);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

async function deletePlan(req, res) {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ message: 'План не знайдено' });

    await plan.destroy();
    return res.json({ message: 'План видалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = {
  getAllOrders, updateOrderStatus,
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getRevenueReport, getPopularServices, getRevenueOverTime, getSubscriptionStats,
  getBranches, createBranch, updateBranch, deleteBranch,
  getServices, createService, updateService, deleteService,
  getPlans, createPlan, updatePlan, deletePlan,
};
