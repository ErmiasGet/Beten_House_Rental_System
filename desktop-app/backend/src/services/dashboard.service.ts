import prisma, { withQueryRetry } from '../config/database';
import { IDashboardStats, IRecentActivity } from '@beten-homes-rent/shared';

export class DashboardService {
  async getStats(userId: string): Promise<IDashboardStats> {
    const houses = await withQueryRetry(() =>
      prisma.house.findMany({
        where: { ownerId: userId },
        include: {
          rooms: true,
        },
      })
    );

    const totalHouses = houses.length;
    const totalRooms = houses.reduce((sum: number, h: any) => sum + h.rooms.length, 0);
    const occupiedRooms = houses.reduce(
      (sum: number, h: any) => sum + h.rooms.filter((r: any) => r.status === 'OCCUPIED').length,
      0
    );
    const vacantRooms = houses.reduce(
      (sum: number, h: any) => sum + h.rooms.filter((r: any) => r.status === 'AVAILABLE').length,
      0
    );

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthlyIncome = await withQueryRetry(() =>
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          month: currentMonth,
          year: currentYear,
          room: {
            house: {
              ownerId: userId,
            },
          },
        },
        _sum: { amount: true },
      })
    );

    const pendingPayments = await withQueryRetry(() =>
      prisma.payment.count({
        where: {
          status: 'UNPAID',
          month: currentMonth,
          year: currentYear,
          room: {
            house: {
              ownerId: userId,
            },
          },
        },
      })
    );

    const overduePayments = await withQueryRetry(() =>
      prisma.payment.count({
        where: {
          room: {
            house: {
              ownerId: userId,
            },
          },
          OR: [
            { status: 'OVERDUE' },
            { status: 'PARTIAL' },
            {
              status: 'UNPAID',
              OR: [
                { year: { lt: currentYear } },
                { year: currentYear, month: { lt: currentMonth } },
              ],
            },
          ],
        },
      })
    );

    const outstandingBalance = await withQueryRetry(() =>
      prisma.payment.aggregate({
        where: {
          room: {
            house: {
              ownerId: userId,
            },
          },
          status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] },
        },
        _sum: {
          amount: true,
          amountPaid: true,
        },
      })
    );

    const totalOutstanding =
      (outstandingBalance._sum.amount || 0) - (outstandingBalance._sum.amountPaid || 0);

    const recentActivities = await this.getRecentActivities(userId);

    return {
      totalHouses,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      monthlyIncome: monthlyIncome._sum.amount || 0,
      pendingPayments,
      overduePayments,
      recentActivities,
    } as any;
  }

  async getOutstandingBalance(userId: string) {
    const result = await withQueryRetry(() =>
      prisma.payment.aggregate({
        where: {
          room: {
            house: {
              ownerId: userId,
            },
          },
          status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] },
        },
        _sum: {
          amount: true,
          amountPaid: true,
        },
        _count: true,
      })
    );

    return {
      totalOwed: result._sum.amount || 0,
      totalPaid: result._sum.amountPaid || 0,
      outstandingBalance: (result._sum.amount || 0) - (result._sum.amountPaid || 0),
      recordCount: result._count,
    };
  }

  private async getRecentActivities(userId: string): Promise<IRecentActivity[]> {
    const activities: IRecentActivity[] = [];

    const recentPayments = await withQueryRetry(() =>
      prisma.payment.findMany({
        where: {
          room: { house: { ownerId: userId } },
        },
        include: {
          tenant: true,
          room: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    );

    recentPayments.forEach((p: any) => {
      const paidLabel =
        p.amountPaid < p.amount
          ? `partially paid ${p.amountPaid} of ${p.amount}`
          : `paid ${p.amount}`;
      activities.push({
        id: p.id,
        action: 'Payment Received',
        description: `${p.tenant.fullName} ${paidLabel} for room ${p.room.roomNumber}`,
        timestamp: p.createdAt,
        type: 'payment',
      });
    });

    const recentContracts = await withQueryRetry(() =>
      prisma.rentalContract.findMany({
        where: {
          house: { ownerId: userId },
        },
        include: {
          tenant: true,
          room: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    );

    recentContracts.forEach((c: any) => {
      activities.push({
        id: c.id,
        action: 'Contract Created',
        description: `New contract with ${c.tenant.fullName} for room ${c.room.roomNumber}`,
        timestamp: c.createdAt,
        type: 'contract',
      });
    });

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return activities.slice(0, 10);
  }
}
