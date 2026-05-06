const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Subscription = sequelize.define('subscription', {
  subscription_id:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  client_id:        { type: DataTypes.INTEGER, allowNull: false },
  plan_id:          { type: DataTypes.INTEGER, allowNull: false },
  start_date:       { type: DataTypes.DATEONLY, allowNull: false },
  end_date:         { type: DataTypes.DATEONLY, allowNull: false },
  washes_remaining: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled'),
    defaultValue: 'active',
  },
});

module.exports = Subscription;

