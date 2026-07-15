import prisma, { withQueryRetry } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class HouseService {
  async create(data: {
    name: string;
    address: string;
    numberOfFloors: number;
    totalRooms: number;
    images?: string[];
    ownerId: string;
  }) {
    return prisma.house.create({
      data: {
        name: data.name,
        address: data.address,
        numberOfFloors: data.numberOfFloors,
        totalRooms: data.totalRooms,
        images: data.images || [],
        ownerId: data.ownerId,
      },
      include: {
        rooms: true,
      },
    });
  }

  async findAll(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total]: [any[], number] = await Promise.all([
      withQueryRetry(() =>
        prisma.house.findMany({
          where: { ownerId: userId },
          include: {
            _count: {
              select: {
                rooms: true,
                rentalContracts: { where: { status: 'ACTIVE' } },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.house.count({ where: { ownerId: userId } })),
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
    const house = await prisma.house.findUnique({
      where: { id },
      include: {
        rooms: true,
        rentalContracts: {
          include: {
            tenant: true,
            _count: { select: { payments: true } },
          },
        },
      },
    });

    if (!house) throw new NotFoundError('House not found');
    return house;
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string;
      numberOfFloors?: number;
      totalRooms?: number;
      images?: string[];
    }
  ) {
    const house = await prisma.house.findUnique({ where: { id } });
    if (!house) throw new NotFoundError('House not found');

    return prisma.house.update({
      where: { id },
      data,
      include: { rooms: true },
    });
  }

  async delete(id: string) {
    const house = await prisma.house.findUnique({ where: { id } });
    if (!house) throw new NotFoundError('House not found');

    await prisma.$transaction(async (tx) => {
      const rooms = await tx.room.findMany({ where: { houseId: id }, select: { id: true } });
      const roomIds = rooms.map((r) => r.id);

      await tx.expense.deleteMany({ where: { houseId: id } });

      if (roomIds.length > 0) {
        await tx.payment.deleteMany({ where: { roomId: { in: roomIds } } });
      }

      await tx.rentalContract.deleteMany({ where: { houseId: id } });

      if (roomIds.length > 0) {
        await tx.tenant.updateMany({
          where: { roomId: { in: roomIds } },
          data: { roomId: null },
        });
        await tx.room.deleteMany({ where: { houseId: id } });
      }

      await tx.house.delete({ where: { id } });
    });
  }

  async search(query: string, userId: string) {
    return prisma.house.findMany({
      where: {
        ownerId: userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { _count: { select: { rooms: true } } },
      take: 20,
    });
  }
}
