const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Account = sequelize.define('account', {
  account_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id:  { type: DataTypes.INTEGER, allowNull: false, unique: true },
  balance:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Account;
