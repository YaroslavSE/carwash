const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Order = sequelize.define('order', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vehicle_id:      { type: DataTypes.INTEGER, allowNull: false },
  branch_id:       { type: DataTypes.INTEGER, allowNull: false },
  employee_id:     { type: DataTypes.INTEGER, allowNull: false },
  order_date:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  scheduled_time:  { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  total_amount:    { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  notes:           { type: DataTypes.TEXT },
}, {
  tableName: 'order', // зарезервоване слово — явно вказуємо
});

module.exports = Order;
