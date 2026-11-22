import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

let isFirebaseInitialized = false;

// Attempt Firebase Admin initialization if credentials or project ID is configured
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    isFirebaseInitialized = true;
    console.log(`✅ Firebase Admin initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);
  } else {
    console.log('ℹ️  Firebase Admin: FIREBASE_PROJECT_ID not set. Using dev fallback for token validation.');
  }
} catch (error) {
  console.warn('⚠️  Firebase Admin initialization note:', error);
}

export async function verifyFirebaseToken(idToken: string) {
  if (!isFirebaseInitialized) {
    return null;
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return null;
  }
}

export { admin };
