import cron from 'node-cron';
import prisma from '../config/database';
import { NotificationService } from '../services/notification.service';
import { sendPushNotification } from '../services/push.service';
import { logger } from '../utils/logger';
import { NotificationType, getMonthName } from '@beten-homes-rent/shared';

const notificationService = new NotificationService();

export function startPaymentChecker(): void {
  logger.info('Running payment checker on startup...');
  runPaymentChecks();

  cron.schedule('0 0 * * *', () => {
    runPaymentChecks();
  });
}

async function runPaymentChecks() {
  logger.info('Running payment checker job...');
  try {
    await checkOverduePayments();
    await checkUpcomingPayments();
    logger.info('Payment checker job completed');
  } catch (error) {
    logger.error('Payment checker job failed:', error);
  }
}

async function notifyOwner(
  ownerId: string,
  ownerPushToken: string | null,
  type: NotificationType,
  title: string,
  message: string,
  relatedId: string
): Promise<void> {
  await notificationService.create({
    userId: ownerId,
    type,
    title,
    message,
    relatedId,
  });
  if (ownerPushToken) {
    await sendPushNotification(ownerPushToken, title, message, { type, relatedId });
  }
}

export async function checkOverduePayments(): Promise<void> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const overduePayments = await prisma.payment.findMany({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } },
        {
          year: currentYear,
          month: currentMonth,
          contract: { paymentDay: { lt: currentDate.getDate() } },
        },
      ],
    },
    include: {
      tenant: true,
      room: { include: { house: { include: { owner: true } } } },
      contract: true,
    },
  });

  for (const payment of overduePayments) {
    const newStatus = payment.status === 'PARTIAL' ? 'PARTIAL' : 'OVERDUE';

    if (payment.status !== newStatus && payment.status !== 'OVERDUE') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: payment.status === 'PARTIAL' ? 'PARTIAL' : 'OVERDUE' },
      });
    }

    const remaining = payment.amount - payment.amountPaid;
    const partialNote =
      payment.amountPaid > 0
        ? ` (partially paid: ${payment.amountPaid}, remaining: ${remaining})`
        : '';

    await notifyOwner(
      payment.room.house.owner.id,
      payment.room.house.owner.pushToken,
      NotificationType.PAYMENT_OVERDUE,
      'Payment Overdue',
      `Tenant ${payment.tenant.fullName} has overdue payment of ${remaining} for Room ${payment.room.roomNumber} (${getMonthName(payment.month)} ${payment.year})${partialNote}`,
      payment.tenant.id
    );
  }
}

export async function checkUpcomingPayments(): Promise<void> {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const activeContracts = await prisma.rentalContract.findMany({
    where: {
      status: 'ACTIVE',
      paymentDay: currentDate.getDate(),
    },
    include: {
      tenant: true,
      room: { include: { house: { include: { owner: true } } } },
    },
  });

  for (const contract of activeContracts) {
    const existingPayment = await prisma.payment.findFirst({
      where: {
        contractId: contract.id,
        month: currentMonth,
        year: currentYear,
      },
    });

    if (!existingPayment) {
      const dueDate = new Date(currentYear, currentMonth - 1, contract.paymentDay);

      await prisma.payment.create({
        data: {
          tenantId: contract.tenantId,
          roomId: contract.roomId,
          contractId: contract.id,
          amount: contract.monthlyRent,
          amountPaid: 0,
          paymentDate: dueDate,
          paymentMethod: 'CASH',
          month: currentMonth,
          year: currentYear,
          status: 'UNPAID',
          receiptNumber: `AUTO-${currentYear}${String(currentMonth).padStart(2, '0')}${String(contract.tenantId).slice(0, 4)}`,
        },
      });

      await notifyOwner(
        contract.room.house.owner.id,
        contract.room.house.owner.pushToken,
        NotificationType.PAYMENT_DUE,
        'Payment Due Today',
        `Rent payment for Room ${contract.room.roomNumber} is due today (${getMonthName(currentMonth)} ${currentYear}). Tenant: ${contract.tenant.fullName}. Amount: ${contract.monthlyRent}`,
        contract.tenant.id
      );
    }
  }
}
