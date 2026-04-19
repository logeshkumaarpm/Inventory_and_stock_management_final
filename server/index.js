require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const { seedAdmin } = require('./controllers/authController');

// Connect Database
connectDB().then(() => {
  seedAdmin();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/queries', require('./routes/queryRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
