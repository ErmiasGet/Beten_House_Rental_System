import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof DatabaseError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const errorCode =
    'code' in err && typeof (err as Record<string, unknown>).code === 'string'
      ? (err as { code: string }).code
      : null;
  if (errorCode && ['P1001', 'P1002', 'P1003', 'P1008', 'P1017'].includes(errorCode)) {
    const dbError = new DatabaseError('Database temporarily unavailable. Please try again.');
    res.status(dbError.statusCode).json({
      success: false,
      message: dbError.message,
    });
    return;
  }

  if (errorCode === 'P2003') {
    res.status(400).json({
      success: false,
      message: 'Cannot delete this item because it is still referenced by other records.',
    });
    return;
  }

  if (errorCode === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
