const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const Review = sequelize.define('review', {
  review_id:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id:   { type: DataTypes.INTEGER, allowNull: false, unique: true },
  client_id:  { type: DataTypes.INTEGER, allowNull: false },
  rating:     { type: DataTypes.SMALLINT, allowNull: false },
  comment:    { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Review;
