const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const SubscriptionPlan = sequelize.define('subscription_plan', {
  plan_id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:             { type: DataTypes.STRING(100), allowNull: false },
  description:      { type: DataTypes.TEXT },
  price:            { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duration_days:    { type: DataTypes.INTEGER, allowNull: false },
  washes_included:  { type: DataTypes.INTEGER, allowNull: false },
  discount_percent: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = SubscriptionPlan;

