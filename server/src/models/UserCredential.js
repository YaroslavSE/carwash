const { DataTypes } = require('sequelize');
const sequelize = require('../db/sequelize');

const UserCredential = sequelize.define('user_credential', {
  credential_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
  },
  provider: {
    type: DataTypes.ENUM('local', 'google', 'cognito'),
    defaultValue: 'local',
  },
  provider_uid: {
    type: DataTypes.STRING(255),
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verification_token: {
    type: DataTypes.STRING(255),
  },
  reset_token: {
    type: DataTypes.STRING(255),
  },
  reset_token_expires: {
    type: DataTypes.DATE,
  },
  last_login: {
    type: DataTypes.DATE,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = UserCredential;
