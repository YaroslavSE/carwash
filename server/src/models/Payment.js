const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Payment = sequelize.define('payment', {
  payment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id:       { type: DataTypes.INTEGER, allowNull: false, unique: true },
  amount:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'online', 'subscription'),
    allowNull: false,
  },
  payment_date:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'refunded'),
    defaultValue: 'pending',
  },
  transaction_id: { type: DataTypes.STRING(100), unique: true },
});

module.exports = Payment;
