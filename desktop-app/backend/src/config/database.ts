import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const MAX_RETRIES = 10;
const INITIAL_RETRY_DELAY_MS = 1000;
const QUERY_MAX_RETRIES = 3;
const QUERY_RETRY_DELAY_MS = 500;

let _dbConnected = false;

export function isDbConnected(): boolean {
  return _dbConnected;
}

export async function connectWithRetry(
  retries = MAX_RETRIES,
  delayMs = INITIAL_RETRY_DELAY_MS
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      _dbConnected = true;
      logger.info('Connected to database');
      return;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      logger.warn(`Database connection attempt ${attempt}/${retries} failed: ${error}`);

      if (isLastAttempt) {
        _dbConnected = false;
        logger.error(
          'All database connection attempts exhausted. Server will start in degraded mode.'
        );
        return;
      }

      const backoffMs = delayMs * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1003', 'P1008', 'P1017'].includes(error.code);
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("can't reach database server") ||
      msg.includes('connection') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset')
    );
  }
  return false;
}

export async function withQueryRetry<T>(
  fn: () => Promise<T>,
  retries = QUERY_MAX_RETRIES,
  delayMs = QUERY_RETRY_DELAY_MS
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const transient = isTransientError(error);

      if (!transient || isLastAttempt) {
        throw error;
      }

      const backoffMs = delayMs * Math.pow(2, attempt - 1);
      logger.warn(
        `Transient DB error (attempt ${attempt}/${retries}), retrying in ${backoffMs}ms: ${error}`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw new Error('Unreachable');
}

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    _dbConnected = true;
    return { connected: true, latencyMs };
  } catch (error) {
    _dbConnected = false;
    return { connected: false, error: String(error) };
  }
}

export async function verifyConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    _dbConnected = true;
    return true;
  } catch {
    return false;
  }
}

const RECONNECT_INTERVAL_MS = 30_000;
let _reconnectTimer: ReturnType<typeof setInterval> | null = null;

export function startBackgroundReconnect(): void {
  if (_reconnectTimer) return;
  _reconnectTimer = setInterval(async () => {
    if (_dbConnected) return;
    logger.info('Attempting background database reconnection...');
    try {
      await prisma.$connect();
      _dbConnected = true;
      logger.info('Background reconnection successful');
      if (_reconnectTimer) {
        clearInterval(_reconnectTimer);
        _reconnectTimer = null;
      }
    } catch {
      logger.warn('Background reconnection failed, will retry in 30s');
    }
  }, RECONNECT_INTERVAL_MS);
}

export default prisma;
