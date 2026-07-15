import prisma, { withQueryRetry } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class TenantService {
  async create(data: {
    fullName: string;
    phone: string;
    email?: string;
    gender?: string;
    nationalId: string;
    occupation?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyAddress?: string;
    address?: string;
    roomId?: string;
    profileImage?: string;
    startDate?: string;
    paymentDay?: number;
    deposit?: number;
    contractImage?: string;
  }) {
    if (data.roomId) {
      const room = await prisma.room.findUnique({ where: { id: data.roomId } });
      if (!room) throw new NotFoundError('Room not found');
      if (room.status !== 'AVAILABLE') throw new BadRequestError('Room is not available');

      return prisma.$transaction(
        async (
          tx: Omit<
            typeof prisma,
            '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
          >
        ) => {
          const tenant = await tx.tenant.create({
            data: {
              fullName: data.fullName,
              phone: data.phone,
              email: data.email,
              gender: data.gender,
              nationalId: data.nationalId,
              occupation: data.occupation,
              emergencyName: data.emergencyName,
              emergencyPhone: data.emergencyPhone,
              emergencyAddress: data.emergencyAddress,
              address: data.address,
              profileImage: data.profileImage,
              roomId: data.roomId,
            },
          });

          const startDate = data.startDate ? new Date(data.startDate) : new Date();
          const paymentDay = Number(data.paymentDay) || 1;

          await tx.rentalContract.create({
            data: {
              tenantId: tenant.id,
              houseId: room.houseId,
              roomId: data.roomId!,
              startDate,
              monthlyRent: room.monthlyRent,
              deposit: Number(data.deposit ?? room.depositAmount),
              paymentDay,
              contractImage: data.contractImage,
            },
          });

          await tx.room.update({
            where: { id: data.roomId },
            data: { status: 'OCCUPIED' },
          });

          return tx.tenant.findUnique({
            where: { id: tenant.id },
            include: {
              room: {
                include: { house: { select: { id: true, name: true } } },
              },
              rentalContracts: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          });
        }
      );
    }

    const { contractImage, startDate, paymentDay, deposit, ...tenantData } = data;
    return prisma.tenant.create({ data: tenantData });
  }

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total]: [any[], number] = await Promise.all([
      withQueryRetry(() =>
        prisma.tenant.findMany({
          where,
          include: {
            room: {
              include: { house: { select: { id: true, name: true } } },
            },
            _count: {
              select: {
                rentalContracts: true,
                payments: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.tenant.count({ where })),
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
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        room: {
          include: { house: true },
        },
        rentalContracts: {
          include: {
            room: true,
            house: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: { room: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!tenant) throw new NotFoundError('Tenant not found');
    return tenant;
  }

  async update(
    id: string,
    data: Partial<{
      fullName: string;
      phone: string;
      email: string;
      nationalId: string;
      occupation: string;
      emergencyName: string;
      emergencyPhone: string;
      emergencyAddress: string;
      address: string;
      roomId: string;
      profileImage: string;
    }>
  ) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError('Tenant not found');

    return prisma.tenant.update({ where: { id }, data });
  }

  async delete(id: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundError('Tenant not found');

    await prisma.tenant.delete({ where: { id } });
  }
}
