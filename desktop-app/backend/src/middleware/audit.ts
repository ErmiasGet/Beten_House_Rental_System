import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuditAction } from '@beten-homes-rent/shared';

export const auditLog = (action: AuditAction, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.json.bind(res);
    
    res.json = function (body: any) {
      if (req.user && res.statusCode < 400) {
        const entityId = req.params.id || body?.data?.id || '';
        prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action,
            entity,
            entityId,
            ipAddress: req.ip,
          },
        }).catch((err) => console.error('Audit log error:', err));
      }
      return originalSend(body);
    };
    
    next();
  };
};
