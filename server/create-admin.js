const bcrypt = require('bcryptjs');
const sequelize = require('./src/db/sequelize');
const { Employee, Branch } = require('./src/models');
require('dotenv').config();

async function createAdmin() {
  try {
    await sequelize.authenticate();
    try {
      await sequelize.query("ALTER TABLE employee ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';");
    } catch (e) {
      // Column might already exist
    }
    
    // Check if any branch exists, if not create a default one
    let branch = await Branch.findOne();
    if (!branch) {
      branch = await Branch.create({
        name: 'Головна Філія',
        address: 'Київ, вул. Хрещатик 1',
        phone: '0440000000',
        opening_hours: '08:00 - 22:00'
      });
      console.log('Створено дефолтну філію.');
    }

    const phone = '0000000000';
    const password = 'admin';

    // Check if admin already exists
    const existing = await Employee.findOne({ where: { phone } });
    if (existing) {
      console.log('Адміністратор вже існує!');
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(password, 12);

    await Employee.create({
      first_name: 'Головний',
      last_name: 'Адмін',
      phone: phone,
      password_hash: password_hash,
      role: 'admin',
      branch_id: branch.branch_id,
      hire_date: new Date(),
      salary: 0
    });

    console.log('✅ Першого адміністратора успішно створено!');
    console.log(`📱 Телефон: ${phone}`);
    console.log(`🔑 Пароль: ${password}`);

  } catch (error) {
    console.error('Помилка:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
