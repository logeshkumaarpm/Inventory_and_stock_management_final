require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { seedAdmin } = require('./controllers/authController');

const app = express();

let startupPromise;

const initializeApp = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

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

app.get('/api/health', async (req, res) => {
  res.json({
    ok: true,
    databaseReady: mongoose.connection.readyState === 1,
  });
});

app.get('/', (req, res) => res.send('API Running'));

app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({
    message: error.message || 'Internal server error',
  });
});

module.exports = {
  app,
  initializeApp,
};
