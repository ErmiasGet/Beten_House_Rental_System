import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'placeholder',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
};

let app: FirebaseApp;
let auth: Auth;

const isConfigured = firebaseConfig.apiKey !== 'placeholder';

if (isConfigured) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
} else {
  app = null as any;
  auth = null as any;
}

export { app, auth, isConfigured };

export async function getFirebaseIdToken(): Promise<string | null> {
  try {
    if (!isConfigured || !auth?.currentUser) return null;
    return await auth.currentUser.getIdToken();
  } catch (error) {
    console.error('Failed to get Firebase ID token:', error);
    return null;
  }
}
