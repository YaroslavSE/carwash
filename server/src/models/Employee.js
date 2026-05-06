const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Employee = sequelize.define('employee', {
  employee_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('washer', 'manager', 'admin', 'cashier'),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  hire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Employee;
