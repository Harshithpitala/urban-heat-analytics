const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

/**
 * Establishes connection to MongoDB.
 * Implements graceful degradation so server continues serving mock/demo APIs
 * even if a local MongoDB service is not actively running during Phase 1.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} / database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Notice] Database connection could not be established (${error.message}).`);
    console.warn('[MongoDB Notice] Operating in fallback mode. In-memory demo data and mock endpoints will continue to work smoothly.');
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Connection disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.warn(`[MongoDB Error] ${err.message}`);
});

module.exports = connectDB;
