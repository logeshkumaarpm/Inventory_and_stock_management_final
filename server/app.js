require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');

const app = express();

let startupPromise;

const initializeApp = async () => {
  if (!startupPromise) {
    startupPromise = connectDB().then(() => seedAdmin());
  }

  return startupPromise;
};

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => res.send('API Running'));

module.exports = {
  app,
  initializeApp,
};
