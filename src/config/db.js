// src/config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('companyscraper', 'sunayrautela', 'yourpassword', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
});

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully');
  })
  .catch(err => {
    console.error('Unable to connect to PostgreSQL:', err);
  });

module.exports = sequelize;
