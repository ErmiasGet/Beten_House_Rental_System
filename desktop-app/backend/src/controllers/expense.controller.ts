import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';

const expenseService = new ExpenseService();

export class ExpenseController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        ...req.body,
        recordedById: req.user!.userId,
      };
      const expense = await expenseService.create(data);
      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: expense,
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
        houseId: req.query.houseId as string,
        category: req.query.category as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const result = await expenseService.findAll(page, limit, filters);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expenseService.findById(req.params.id);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await expenseService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await expenseService.delete(req.params.id);
      res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
