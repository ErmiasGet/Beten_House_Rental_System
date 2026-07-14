import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';

const tenantService = new TenantService();

export class TenantController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      if ((req as any).file?.path) {
        data.contractImage = (req as any).file.path;
      }
      const tenant = await tenantService.create(data);
      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const result = await tenantService.findAll(page, limit, search);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await tenantService.findById(req.params.id);
      res.json({ success: true, data: tenant });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await tenantService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await tenantService.delete(req.params.id);
      res.json({ success: true, message: 'Tenant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
