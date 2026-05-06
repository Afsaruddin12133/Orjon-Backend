import admin from 'firebase-admin';
import { env } from './environment.js';

let firebaseApp = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    console.warn('Firebase credentials are not fully set. Skipping Firebase Admin initialization.');
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, '\n')
    })
  });

  console.log('Firebase Admin initialized');
  return firebaseApp;
};

export { admin };

