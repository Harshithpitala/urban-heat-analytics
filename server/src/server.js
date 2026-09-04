const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const startServer = async () => {
  try {
    // Attempt database connection (graceful fallback if MongoDB is not running)
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log('  URBAN HEAT & HUMAN ACTIVITY ANALYTICS API');
      console.log(`  Phase 10 Production Platform active on port: ${PORT}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Dashboard API: http://localhost:${PORT}/api/dashboard/overview`);
      console.log('====================================================');
    });

    // Graceful shutdown handling
    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server Fatal] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
