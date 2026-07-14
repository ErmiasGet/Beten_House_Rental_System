import prisma, { withQueryRetry } from '../config/database';
import { NotFoundError } from '../utils/errors';

export class ExpenseService {
  async create(data: {
    houseId: string;
    category:
      'MAINTENANCE' | 'REPAIR' | 'ELECTRICITY' | 'WATER' | 'CLEANING' | 'SECURITY' | 'OTHER';
    amount: number;
    description: string;
    expenseDate: Date;
    receiptImage?: string;
    recordedById: string;
  }) {
    return prisma.expense.create({
      data,
      include: {
        house: { select: { id: true, name: true } },
        recordedBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      houseId?: string;
      category?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.houseId) where.houseId = filters.houseId;
    if (filters?.category) where.category = filters.category;
    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {};
      if (filters.startDate) where.expenseDate.gte = filters.startDate;
      if (filters.endDate) where.expenseDate.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      withQueryRetry(() =>
        prisma.expense.findMany({
          where,
          include: {
            house: { select: { id: true, name: true } },
            recordedBy: { select: { id: true, fullName: true } },
          },
          skip,
          take: limit,
          orderBy: { expenseDate: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.expense.count({ where })),
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
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        house: true,
        recordedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!expense) throw new NotFoundError('Expense not found');
    return expense;
  }

  async update(
    id: string,
    data: Partial<{
      category:
        'MAINTENANCE' | 'REPAIR' | 'ELECTRICITY' | 'WATER' | 'CLEANING' | 'SECURITY' | 'OTHER';
      amount: number;
      description: string;
      expenseDate: Date;
      receiptImage: string;
    }>
  ) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundError('Expense not found');

    return prisma.expense.update({ where: { id }, data });
  }

  async delete(id: string) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundError('Expense not found');

    await prisma.expense.delete({ where: { id } });
  }
}
