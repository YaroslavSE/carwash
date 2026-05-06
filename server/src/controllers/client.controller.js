const { Client, Vehicle, Account, Subscription, SubscriptionPlan, Review, Order } = require('../models');

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

// GET /api/clients/me/vehicles
async function getMyVehicles(req, res) {
  try {
    const vehicles = await Vehicle.findAll({
      where: { client_id: req.user.clientId },
    });
    return res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/clients/me/vehicles
async function addVehicle(req, res) {
  const { license_plate, brand, model, color, vehicle_type, year } = req.body;

  try {
    const vehicle = await Vehicle.create({
      client_id: req.user.clientId,
      license_plate,
      brand,
      model,
      color,
      vehicle_type,
      year,
    });
    return res.status(201).json(vehicle);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Авто з таким номером вже існує' });
    }
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// DELETE /api/clients/me/vehicles/:id
async function deleteVehicle(req, res) {
  try {
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: req.params.id, client_id: req.user.clientId },
    });

    if (!vehicle) return res.status(404).json({ message: 'Авто не знайдено' });

    await vehicle.destroy();
    return res.json({ message: 'Авто видалено' });
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
      include: [{ model: SubscriptionPlan }],
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
  getMyVehicles,
  addVehicle,
  deleteVehicle,
  getMySubscriptions,
};
