import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export class PaymentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        status: req.query.status as string,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        houseId: req.query.houseId as string,
        tenantId: req.query.tenantId as string,
      };
      const result = await paymentService.findAll(page, limit, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.findById(req.params.id);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await paymentService.delete(req.params.id);
      res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async payOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.payOverdue(req.body);
      res.json({
        success: true,
        message: 'Partial payment applied to overdue records',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTenantBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await paymentService.getTenantBalance(req.params.tenantId);
      res.json({ success: true, data: balance });
    } catch (error) {
      next(error);
    }
  }
}
