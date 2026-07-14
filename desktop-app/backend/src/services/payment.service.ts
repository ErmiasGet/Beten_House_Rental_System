import prisma, { withQueryRetry } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateReceiptNumber, NotificationType, getMonthName } from '@beten-homes-rent/shared';
import { NotificationService } from './notification.service';
import { sendPushNotification } from './push.service';

const notificationService = new NotificationService();

function deriveStatus(
  amount: number,
  amountPaid: number
): 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL' {
  if (amountPaid >= amount) return 'PAID';
  if (amountPaid > 0) return 'PARTIAL';
  return 'UNPAID';
}

export class PaymentService {
  async create(data: {
    tenantId: string;
    roomId: string;
    contractId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHECK';
    month: number;
    year: number;
    notes?: string;
    amountPaid?: number;
  }) {
    const receiptNumber = generateReceiptNumber();
    const paidAmount = data.amountPaid ?? data.amount;
    const status = deriveStatus(data.amount, paidAmount);

    const payment = await prisma.payment.create({
      data: {
        tenantId: data.tenantId,
        roomId: data.roomId,
        contractId: data.contractId,
        amount: data.amount,
        amountPaid: paidAmount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        month: data.month,
        year: data.year,
        receiptNumber,
        status,
        notes: data.notes,
      },
      include: {
        tenant: true,
        room: { include: { house: { include: { owner: true } } } },
        contract: true,
      },
    });

    await this.notifyPaymentReceived(payment);

    return payment;
  }

  private async notifyPaymentReceived(payment: any): Promise<void> {
    const owner = payment.room?.house?.owner;
    if (!owner) return;

    const paidLabel =
      payment.amountPaid < payment.amount
        ? `Partial payment of ${payment.amountPaid} (remaining: ${payment.amount - payment.amountPaid})`
        : `Payment of ${payment.amount}`;

    const title = 'Payment Received';
    const message = `${paidLabel} received from ${payment.tenant?.fullName} for Room ${payment.room?.roomNumber} (${getMonthName(payment.month)} ${payment.year}). Receipt: ${payment.receiptNumber}`;

    await notificationService.create({
      userId: owner.id,
      type: NotificationType.PAYMENT_RECEIVED,
      title,
      message,
      relatedId: payment.id,
    });

    if (owner.pushToken) {
      await sendPushNotification(owner.pushToken, title, message, {
        type: NotificationType.PAYMENT_RECEIVED,
        relatedId: payment.id,
        receiptNumber: payment.receiptNumber,
      });
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      month?: number;
      year?: number;
      houseId?: string;
      tenantId?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.month) where.month = filters.month;
    if (filters?.year) where.year = filters.year;
    if (filters?.houseId) {
      where.room = { houseId: filters.houseId };
    }
    if (filters?.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const [data, total] = await Promise.all([
      withQueryRetry(() =>
        prisma.payment.findMany({
          where,
          include: {
            tenant: { select: { id: true, fullName: true, phone: true } },
            room: { select: { id: true, roomNumber: true } },
            contract: { select: { id: true, monthlyRent: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.payment.count({ where })),
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
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        tenant: true,
        room: { include: { house: true } },
        contract: true,
      },
    });

    if (!payment) throw new NotFoundError('Payment not found');
    return payment;
  }

  async update(
    id: string,
    data: Partial<{
      amount: number;
      amountPaid: number;
      paymentDate: Date;
      paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHECK';
      status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'PARTIAL';
      notes: string;
    }>
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        room: { include: { house: { include: { owner: true } } } },
        tenant: true,
        contract: true,
      },
    });
    if (!payment) throw new NotFoundError('Payment not found');

    const updateData: any = { ...data };

    if (data.amountPaid !== undefined || data.amount !== undefined) {
      const finalAmount = data.amount ?? payment.amount;
      const finalPaid = data.amountPaid ?? payment.amountPaid;
      updateData.status = deriveStatus(finalAmount, finalPaid);
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        tenant: true,
        room: { include: { house: { include: { owner: true } } } },
        contract: true,
      },
    });

    if (data.status === 'PAID' && payment.status !== 'PAID') {
      await this.notifyPaymentReceived(updated);
      await prisma.notification.deleteMany({
        where: {
          relatedId: payment.tenantId,
          type: { in: ['PAYMENT_DUE', 'PAYMENT_OVERDUE'] },
        },
      });
    }

    return updated;
  }

  async delete(id: string) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment not found');

    await prisma.payment.delete({ where: { id } });
  }

  async getOverduePayments() {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return prisma.payment.findMany({
      where: {
        month: currentMonth,
        year: currentYear,
        status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] },
      },
      include: {
        tenant: true,
        room: { include: { house: true } },
        contract: true,
      },
    });
  }

  async getPaymentSummary(userId: string, startDate: Date, endDate: Date) {
    return prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate, lte: endDate },
        room: { house: { ownerId: userId } },
        status: 'PAID',
      },
      include: {
        tenant: { select: { fullName: true } },
        room: { select: { roomNumber: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async payOverdue(data: {
    tenantId: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHECK';
    paymentDate: string;
    notes?: string;
  }) {
    const { tenantId, amount, paymentMethod, paymentDate, notes } = data;

    if (amount <= 0) {
      throw new BadRequestError('Payment amount must be greater than 0');
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundError('Tenant not found');

    const overduePayments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] },
      },
      include: {
        room: { include: { house: { include: { owner: true } } } },
        contract: true,
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    if (overduePayments.length === 0) {
      throw new BadRequestError('No overdue payments found for this tenant');
    }

    const totalOutstanding = overduePayments.reduce((sum, p) => sum + (p.amount - p.amountPaid), 0);

    const paymentAmount = Math.min(amount, totalOutstanding);
    let remaining = paymentAmount;
    const updatedPayments: any[] = [];

    for (const payment of overduePayments) {
      if (remaining <= 0) break;

      const balance = payment.amount - payment.amountPaid;
      const applied = Math.min(remaining, balance);
      const newAmountPaid = payment.amountPaid + applied;
      const newStatus = deriveStatus(payment.amount, newAmountPaid);

      const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
          ...(applied > 0
            ? {
                paymentMethod,
                paymentDate: new Date(paymentDate),
                notes: notes || payment.notes,
              }
            : {}),
        },
        include: {
          tenant: true,
          room: { include: { house: { include: { owner: true } } } },
          contract: true,
        },
      });

      updatedPayments.push(updated);
      remaining -= applied;
    }

    const totalPaid = paymentAmount - remaining;
    const receiptNumber = generateReceiptNumber();

    const owner = updatedPayments[0]?.room?.house?.owner;
    if (owner) {
      const title = 'Partial Payment Received';
      const message = `Payment of ${totalPaid} received from ${tenant.fullName}. Applied to ${updatedPayments.length} overdue month(s). Remaining balance: ${totalOutstanding - totalPaid}. Receipt: ${receiptNumber}`;

      await notificationService.create({
        userId: owner.id,
        type: NotificationType.PAYMENT_RECEIVED,
        title,
        message,
        relatedId: tenantId,
      });

      if (owner.pushToken) {
        await sendPushNotification(owner.pushToken, title, message, {
          type: NotificationType.PAYMENT_RECEIVED,
          relatedId: tenantId,
          receiptNumber,
        });
      }
    }

    return {
      tenantId,
      tenantName: tenant.fullName,
      totalPaid,
      totalOutstanding,
      remainingBalance: totalOutstanding - totalPaid,
      receiptNumber,
      payments: updatedPayments,
    };
  }

  async getTenantBalance(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundError('Tenant not found');

    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] },
      },
      include: {
        room: { select: { roomNumber: true } },
        contract: { select: { monthlyRent: true } },
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    const records = payments.map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      amount: p.amount,
      amountPaid: p.amountPaid,
      remaining: p.amount - p.amountPaid,
      status: p.status as any,
      roomNumber: p.room?.roomNumber,
    }));

    const totalOwed = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      tenantId,
      tenantName: tenant.fullName,
      totalOwed,
      totalPaid,
      outstandingBalance: totalOwed - totalPaid,
      records,
    };
  }
}
