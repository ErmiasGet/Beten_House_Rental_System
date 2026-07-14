import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getFirebaseAuth } from '../config/firebase';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { IJwtPayload, UserRole } from '@beten-homes-rent/shared';
import prisma from '../config/database';

declare global {
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}

async function verifyFirebaseToken(token: string): Promise<IJwtPayload | null> {
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token);
    if (!decoded.email) return null;
    const firebaseUser = await prisma.user.findUnique({
      where: { email: decoded.email },
    });
    if (!firebaseUser) return null;
    return {
      userId: firebaseUser.id,
      email: firebaseUser.email,
      role: firebaseUser.role as UserRole,
    };
  } catch {
    return null;
  }
}

function verifyCustomJwt(token: string): IJwtPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as IJwtPayload;
  } catch {
    return null;
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    let payload: IJwtPayload | null = null;

    payload = await verifyFirebaseToken(token);
    if (!payload) {
      payload = verifyCustomJwt(token);
    }

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};
