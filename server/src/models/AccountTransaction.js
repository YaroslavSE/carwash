const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const AccountTransaction = sequelize.define('account_transaction', {
  transaction_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  account_id:     { type: DataTypes.INTEGER, allowNull: false },
  order_id:       { type: DataTypes.INTEGER },
  type: {
    type: DataTypes.ENUM('top_up', 'payment', 'refund', 'bonus'),
    allowNull: false,
  },
  amount:         { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  balance_before: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  balance_after:  { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description:    { type: DataTypes.STRING(255) },
  created_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = AccountTransaction;
