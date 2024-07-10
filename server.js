const express = require('express');
const path = require('path'); // Ensure the path module is imported
const sequelize = require('./src/config/db');
const companyRoutes = require('./src/routes/companyRoutes');
const cors = require('cors'); // CORS middleware

const app = express();

app.use(express.json());
app.use(cors()); // Use the cors middleware

// Static file serving for logos and screenshots
app.use('/screenshots', express.static(path.join(__dirname, 'src/screenshots')));
app.use('/logos', express.static(path.join(__dirname, 'src/logos')));

// Company routes
app.use('/api/companies', companyRoutes);

// Sync the database and start the server
sequelize.sync({ force: true })
  .then(() => {
    console.log('Database & tables created!');
    app.listen(8000, () => {
      console.log('Server is running on port 8000');
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
