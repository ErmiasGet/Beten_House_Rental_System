import admin from 'firebase-admin';
import { config } from './index';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0]!;
      return firebaseApp;
    }

    const rawKey = config.firebase.privateKey.replace(/\\n/g, '\n');
    const privateKey = rawKey.includes('-----BEGIN')
      ? rawKey
      : `-----BEGIN RSA PRIVATE KEY-----\n${rawKey}\n-----END RSA PRIVATE KEY-----`;

    const serviceAccount: admin.ServiceAccount = {
      projectId: config.firebase.projectId,
      privateKey,
      clientEmail: config.firebase.clientEmail,
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

export function getFirebaseAuth(): admin.auth.Auth {
  return initializeFirebase().auth();
}

export function getFirebaseMessaging(): admin.messaging.Messaging {
  return initializeFirebase().messaging();
}
