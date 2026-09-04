const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const { CLIENT_URL } = require('./config/env');

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || origin === CLIENT_URL || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// In production, serve compiled React SPA assets
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // In development, provide API discovery ping at root
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Urban Heat & Human Activity Analytics API',
      version: '1.0.0',
      phase: 'Phase 10 — Production Analytics Platform',
      healthCheck: '/api/health',
      dashboardSummary: '/api/dashboard/summary',
    });
  });
}

// Fallback error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
