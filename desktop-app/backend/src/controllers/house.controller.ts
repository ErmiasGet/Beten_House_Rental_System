import { Request, Response, NextFunction } from 'express';
import { HouseService } from '../services/house.service';

const houseService = new HouseService();

export class HouseController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = {
        ...req.body,
        ownerId: req.user!.userId,
        images: req.files ? (req.files as Express.Multer.File[]).map((f) => f.path) : [],
      };
      const house = await houseService.create(data);
      res.status(201).json({
        success: true,
        message: 'House created successfully',
        data: house,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await houseService.findAll(req.user!.userId, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const house = await houseService.findById(req.params.id);
      res.json({ success: true, data: house });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const house = await houseService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'House updated successfully',
        data: house,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await houseService.delete(req.params.id);
      res.json({ success: true, message: 'House deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const houses = await houseService.search(query, req.user!.userId);
      res.json({ success: true, data: houses });
    } catch (error) {
      next(error);
    }
  }
}
