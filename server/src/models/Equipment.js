const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Equipment = sequelize.define('equipment', {
  equipment_id:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  branch_id:        { type: DataTypes.INTEGER, allowNull: false },
  name:             { type: DataTypes.STRING(100), allowNull: false },
  type: {
    type: DataTypes.ENUM('pressure_washer', 'vacuum', 'polisher', 'dryer', 'conveyor'),
    allowNull: false,
  },
  purchase_date:    { type: DataTypes.DATEONLY },
  last_maintenance: { type: DataTypes.DATEONLY },
  next_maintenance: { type: DataTypes.DATEONLY },
  status: {
    type: DataTypes.ENUM('operational', 'maintenance', 'broken'),
    defaultValue: 'operational',
  },
});

module.exports = Equipment;

