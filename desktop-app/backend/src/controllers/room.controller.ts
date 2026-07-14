import { Request, Response, NextFunction } from 'express';
import { RoomService } from '../services/room.service';

const roomService = new RoomService();

export class RoomController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await roomService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const houseId = req.query.houseId as string;
      const result = await roomService.findAll(houseId, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await roomService.findById(req.params.id);
      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await roomService.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Room updated successfully',
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await roomService.delete(req.params.id);
      res.json({ success: true, message: 'Room deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getVacant(req: Request, res: Response, next: NextFunction) {
    try {
      const houseId = req.query.houseId as string;
      const rooms = await roomService.getVacantRooms(houseId);
      res.json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }
}
