import app from './app';
import { config } from './config';
import { initializeFirebase } from './config/firebase';
import { logger } from './utils/logger';
import { startPaymentChecker } from './jobs/paymentChecker';
import prisma, {
  connectWithRetry,
  isDbConnected,
  startBackgroundReconnect,
  verifyConnection,
} from './config/database';

async function startServer(): Promise<void> {
  try {
    await connectWithRetry();

    if (!isDbConnected()) {
      logger.warn('Server starting in DEGRADED mode - database unavailable');
      startBackgroundReconnect();
    }

    if (config.firebase.projectId) {
      initializeFirebase();
    } else {
      logger.warn('Firebase not configured - push notifications and Firebase Auth disabled');
    }

    startPaymentChecker();
    logger.info('Scheduled jobs started');

    if (!isDbConnected()) {
      const connected = await verifyConnection();
      if (connected) {
        logger.info('Database connection verified after startup');
      }
    }

    app.listen(config.port, config.host, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API: http://${config.host}:${config.port}/api/v1`);
      if (!isDbConnected()) {
        logger.warn('DEGRADED MODE: API requests requiring database will return 503');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
