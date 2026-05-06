const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const OrderItem = sequelize.define('order_item', {
  order_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id:   { type: DataTypes.INTEGER, allowNull: false },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity:   { type: DataTypes.INTEGER, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    // GENERATED ALWAYS — Sequelize не пише в це поле
  },
});

module.exports = OrderItem;
