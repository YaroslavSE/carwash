const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Vehicle = sequelize.define('vehicle', {
  vehicle_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  license_plate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING(30),
  },
  vehicle_type: {
    type: DataTypes.ENUM('sedan', 'suv', 'truck', 'minivan', 'motorcycle'),
    allowNull: false,
  },
  year: {
    type: DataTypes.SMALLINT,
  },
});

module.exports = Vehicle;
