const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: false,      // у нас свої поля created_at
      underscored: true,      // snake_case як в БД
      freezeTableName: true,  // не плюралізувати назви таблиць
    },
  }
);
module.exports = sequelize;