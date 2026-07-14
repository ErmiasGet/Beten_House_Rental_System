import { Request, Response, NextFunction } from 'express';
import { ContractService } from '../services/contract.service';

const contractService = new ContractService();

export class ContractController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        ...req.body,
        startDate: new Date(req.body.startDate),
      };
      const contract = await contractService.create(data);
      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const result = await contractService.findAll(page, limit, status);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await contractService.findById(req.params.id);
      res.json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }

  async terminate(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await contractService.terminate(req.params.id);
      res.json({
        success: true,
        message: 'Contract terminated successfully',
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }
}
