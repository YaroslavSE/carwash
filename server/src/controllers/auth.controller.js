const bcrypt = require('bcryptjs');
const { Client, UserCredential, Account, Employee } = require('../models');
const tokenService = require('../services/token.service');
const sequelize = require('../db/sequelize');
// POST /api/auth/register
async function register(req, res) {
  const { first_name, last_name, phone, email, password } = req.body;

  const t = await sequelize.transaction();
  try {
    const existing = await UserCredential.findOne({ where: { email } });
    if (existing) {
      await t.rollback();
      return res.status(409).json({ message: 'Email вже використовується' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const client = await Client.create(
      { first_name, last_name, phone, email },
      { transaction: t }
    );

    await UserCredential.create(
      { client_id: client.client_id, email, password_hash },
      { transaction: t }
    );

    await Account.create(
      { client_id: client.client_id },
      { transaction: t }
    );

    await t.commit();

    const tokens = tokenService.generateTokens({
      clientId: client.client_id,
      email,
    });
    await tokenService.saveRefreshToken(client.client_id, tokens.refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.status(201).json({
      accessToken: tokens.accessToken,
      client: {
        clientId: client.client_id,
        first_name,
        last_name,
        email,
      },
    });
  } catch (err) {
    try { await t.rollback(); } catch(e) {}
    console.error("REGISTRATION ERROR:", err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Цей email або телефон вже використовується' });
    }
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  try {
    const credential = await UserCredential.findOne({
      where: { email, provider: 'local' },
      include: [{ model: Client, attributes: ['client_id', 'first_name', 'last_name'] }],
    });

    if (!credential) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    const valid = await bcrypt.compare(password, credential.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Невірний email або пароль' });
    }

    await credential.update({ last_login: new Date() });

    const tokens = tokenService.generateTokens({
      clientId: credential.client_id,
      email,
    });
    await tokenService.saveRefreshToken(credential.client_id, tokens.refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({
      accessToken: tokens.accessToken,
      client: {
        clientId: credential.client_id,
        first_name: credential.client.first_name,
        last_name: credential.client.last_name,
        email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

// POST /api/auth/refresh
async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Не авторизовано' });

  try {
    const payload = tokenService.verifyRefresh(token);
    const stored  = await tokenService.getRefreshToken(payload.clientId);

    if (stored !== token) {
      return res.status(401).json({ message: 'Невалідний токен' });
    }

    const tokens = tokenService.generateTokens({
      clientId: payload.clientId,
      email: payload.email,
    });
    await tokenService.saveRefreshToken(payload.clientId, tokens.refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });

    return res.json({ accessToken: tokens.accessToken });
  } catch {
    return res.status(401).json({ message: 'Невалідний токен' });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const payload = tokenService.verifyRefresh(token);
      await tokenService.deleteRefreshToken(payload.clientId);
    } catch {}
  }
  res.clearCookie('refreshToken');
  return res.json({ message: 'Вийшли успішно' });
}

async function employeeLogin(req, res) {
  const { phone, password } = req.body;
  try {
    const employee = await Employee.findOne({
      where: { phone, is_active: true },
    });
    if (!employee) {
      return res.status(401).json({ message: 'Невірний телефон або пароль' });
    }
    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Невірний телефон або пароль' });
    }
    const tokens = tokenService.generateTokens({
      employeeId: employee.employee_id,
      role: employee.role,
      branchId: employee.branch_id,
    });
    await tokenService.saveRefreshToken(`emp_${employee.employee_id}`, tokens.refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
    });
    return res.json({
      accessToken: tokens.accessToken,
      employee: {
        employeeId: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        role: employee.role,
        branch_id: employee.branch_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
}

module.exports = { register, login, refresh, logout, employeeLogin };
