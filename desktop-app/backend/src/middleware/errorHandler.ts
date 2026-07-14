import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

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

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    ['P1001', 'P1002', 'P1003', 'P1008', 'P1017'].includes(err.code)
  ) {
    const dbError = new DatabaseError('Database temporarily unavailable. Please try again.');
    res.status(dbError.statusCode).json({
      success: false,
      message: dbError.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
