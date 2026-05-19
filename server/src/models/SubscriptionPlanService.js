const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const SubscriptionPlanService = sequelize.define('subscription_plan_service', {
  plan_service_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  plan_id:         { type: DataTypes.INTEGER, allowNull: false },
  service_id:      { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: 'subscription_plan_service',
});

module.exports = SubscriptionPlanService;
