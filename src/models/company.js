// src/models/company.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Ensure the path to db.js is correct

const Company = sequelize.define('Company', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  logo: {
    type: DataTypes.STRING,
  },
  facebook: {
    type: DataTypes.STRING,
  },
  linkedin: {
    type: DataTypes.STRING,
  },
  twitter: {
    type: DataTypes.STRING,
  },
  instagram: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  phone: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  screenshot: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Company;
