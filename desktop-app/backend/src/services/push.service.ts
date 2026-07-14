import { logger } from '../utils/logger';

interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const BATCH_SIZE = 100;

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  if (!pushToken) return false;

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
    priority: 'high',
  };

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify([message]),
    });

    const result: any = await response.json();
    const ticket: ExpoPushTicket = result.data?.[0];

    if (ticket?.status === 'ok') {
      logger.info(`Push notification sent successfully, id: ${ticket.id}`);
      return true;
    }

    if (ticket?.status === 'error') {
      logger.error(`Push notification failed: ${ticket.message}`, ticket.details);
      if (ticket.message?.includes('DeviceNotRegistered')) {
        logger.warn(`Push token ${pushToken} is no longer valid`);
      }
    }

    return false;
  } catch (error) {
    logger.error('Failed to send push notification:', error);
    return false;
  }
}

export async function sendBatchPushNotifications(
  messages: { pushToken: string; title: string; body: string; data?: Record<string, unknown> }[],
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    const expoMessages: ExpoPushMessage[] = batch
      .filter((m) => m.pushToken)
      .map((m) => ({
        to: m.pushToken,
        sound: 'default' as const,
        title: m.title,
        body: m.body,
        data: m.data || {},
        priority: 'high' as const,
      }));

    if (expoMessages.length === 0) continue;

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(expoMessages),
      });

      const result: any = await response.json();
      const tickets: ExpoPushTicket[] = result.data || [];

      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          success++;
        } else {
          failed++;
          if (ticket.message?.includes('DeviceNotRegistered')) {
            logger.warn(`Device not registered for a push token in batch`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to send batch push notifications:', error);
      failed += batch.length;
    }
  }

  return { success, failed };
}
