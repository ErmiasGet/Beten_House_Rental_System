import prisma, { withQueryRetry } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { RoomStatus } from '@beten-homes-rent/shared';

export class RoomService {
  async create(data: {
    roomNumber: string;
    floorNumber: number;
    length: number;
    width: number;
    bedrooms: number;
    bathrooms: number;
    hasKitchen: boolean;
    monthlyRent: number;
    depositAmount: number;
    houseId: string;
  }) {
    const house = await prisma.house.findUnique({ where: { id: data.houseId } });
    if (!house) throw new NotFoundError('House not found');

    const existing = await prisma.room.findUnique({
      where: { houseId_roomNumber: { houseId: data.houseId, roomNumber: data.roomNumber } },
    });
    if (existing) throw new BadRequestError('Room number already exists in this house');

    return prisma.room.create({ data });
  }

  async findAll(houseId?: string, page: number = 1, limit: number = 10) {
    const where = houseId ? { houseId } : {};
    const skip = (page - 1) * limit;

    const [data, total]: [any[], number] = await Promise.all([
      withQueryRetry(() =>
        prisma.room.findMany({
          where,
          include: {
            house: { select: { id: true, name: true } },
            tenants: { take: 1 },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.room.count({ where })),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        house: true,
        tenants: true,
        rentalContracts: {
          include: { tenant: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!room) throw new NotFoundError('Room not found');
    return room;
  }

  async update(
    id: string,
    data: Partial<{
      roomNumber: string;
      floorNumber: number;
      length: number;
      width: number;
      bedrooms: number;
      bathrooms: number;
      hasKitchen: boolean;
      monthlyRent: number;
      depositAmount: number;
      status: RoomStatus;
    }>
  ) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundError('Room not found');

    if (data.roomNumber && data.roomNumber !== room.roomNumber) {
      const existing = await prisma.room.findUnique({
        where: { houseId_roomNumber: { houseId: room.houseId, roomNumber: data.roomNumber } },
      });
      if (existing) throw new BadRequestError('Room number already exists in this house');
    }

    return prisma.room.update({ where: { id }, data });
  }

  async delete(id: string) {
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundError('Room not found');

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { roomId: id } });
      await tx.rentalContract.deleteMany({ where: { roomId: id } });
      await tx.tenant.updateMany({ where: { roomId: id }, data: { roomId: null } });
      await tx.room.delete({ where: { id } });
    });
  }

  async getVacantRooms(houseId?: string) {
    const where: any = { status: 'AVAILABLE' };
    if (houseId) where.houseId = houseId;

    return prisma.room.findMany({
      where,
      include: { house: { select: { id: true, name: true } } },
    });
  }
}
