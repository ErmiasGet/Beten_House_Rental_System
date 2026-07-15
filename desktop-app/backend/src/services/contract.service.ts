import prisma, { withQueryRetry } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class ContractService {
  async create(data: {
    tenantId: string;
    houseId: string;
    roomId: string;
    startDate: Date;
    monthlyRent: number;
    deposit: number;
    paymentDay: number;
  }) {
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundError('Room not found');
    if (room.status !== 'AVAILABLE') throw new BadRequestError('Room is not available');

    const contract = await prisma.$transaction(async (tx: TransactionClient) => {
      const newContract = await tx.rentalContract.create({ data });

      await tx.room.update({
        where: { id: data.roomId },
        data: { status: 'OCCUPIED' },
      });

      await tx.tenant.update({
        where: { id: data.tenantId },
        data: { roomId: data.roomId },
      });

      return newContract;
    });

    return prisma.rentalContract.findUnique({
      where: { id: contract.id },
      include: {
        tenant: true,
        house: true,
        room: true,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total]: [any[], number] = await Promise.all([
      withQueryRetry(() =>
        prisma.rentalContract.findMany({
          where,
          include: {
            tenant: { select: { id: true, fullName: true, phone: true } },
            house: { select: { id: true, name: true } },
            room: { select: { id: true, roomNumber: true } },
            _count: { select: { payments: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.rentalContract.count({ where })),
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
    const contract = await prisma.rentalContract.findUnique({
      where: { id },
      include: {
        tenant: true,
        house: true,
        room: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) throw new NotFoundError('Contract not found');
    return contract;
  }

  async terminate(id: string) {
    const contract = await prisma.rentalContract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundError('Contract not found');
    if (contract.status !== 'ACTIVE')
      throw new BadRequestError('Only active contracts can be terminated');

    return prisma.$transaction(async (tx: TransactionClient) => {
      const updated = await tx.rentalContract.update({
        where: { id },
        data: { status: 'TERMINATED' },
      });

      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: 'AVAILABLE' },
      });

      await tx.tenant.update({
        where: { id: contract.tenantId },
        data: { roomId: null },
      });

      return updated;
    });
  }

  async getActiveContracts(userId: string) {
    return prisma.rentalContract.findMany({
      where: {
        house: { ownerId: userId },
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
        room: true,
        house: true,
      },
    });
  }
}
