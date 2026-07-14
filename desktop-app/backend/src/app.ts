import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { isDbConnected } from './config/database';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import houseRoutes from './routes/house.routes';
import roomRoutes from './routes/room.routes';
import tenantRoutes from './routes/tenant.routes';
import contractRoutes from './routes/contract.routes';
import paymentRoutes from './routes/payment.routes';
import expenseRoutes from './routes/expense.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.isDev ? true : config.cors.origin,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.isDev) {
  app.use(morgan('dev'));
}

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check (always available, even in degraded mode)
app.get('/health', async (_req, res) => {
  const { checkDatabaseHealth } = await import('./config/database');
  const dbHealth = await checkDatabaseHealth();

  const status = dbHealth.connected ? 'ok' : 'degraded';
  const statusCode = dbHealth.connected ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    database: {
      connected: dbHealth.connected,
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error && { error: dbHealth.error }),
    },
  });
});

// Degraded mode guard: block API requests when DB is down
app.use('/api/', (_req, res, next) => {
  if (!isDbConnected()) {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database is unreachable. Retrying in background.',
    });
    return;
  }
  next();
});

const apiPrefix = '/api/v1';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/houses`, houseRoutes);
app.use(`${apiPrefix}/rooms`, roomRoutes);
app.use(`${apiPrefix}/tenants`, tenantRoutes);
app.use(`${apiPrefix}/contracts`, contractRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);
app.use(`${apiPrefix}/expenses`, expenseRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/reports`, reportRoutes);

app.use(errorHandler);

export default app;
