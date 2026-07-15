import prisma, { withQueryRetry } from '../config/database';
import { NotificationType } from '@beten-homes-rent/shared';

export class NotificationService {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
  }) {
    return prisma.notification.create({ data });
  }

  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [data, total, unreadCount]: [any[], number, number] = await Promise.all([
      withQueryRetry(() =>
        prisma.notification.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
      ),
      withQueryRetry(() => prisma.notification.count({ where: { userId } })),
      withQueryRetry(() => prisma.notification.count({ where: { userId, isRead: false } })),
    ]);

    return {
      data,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async registerPushToken(userId: string, token: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { pushToken: token },
    });
  }
}
