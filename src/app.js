require('dotenv').config();
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));

app.get('/', (req, res) => res.json({ name: 'TestSync API', status: 'running', health: '/health' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);

app.use((error, req, res, next) => {
  console.error('Server Error Detail:', error);
  const status = error.statusCode || (error.code === 11000 ? 409 : 500);
  const message = error.code === 11000
    ? 'An account with this email address already exists'
    : (error.message || 'Server error, please try again');
  return res.status(status).json({ message });
});

module.exports = app;
