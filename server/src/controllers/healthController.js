const mongoose = require('mongoose');

const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Urban Heat Analytics API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealth,
};
