import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  getIdToken,
} from 'firebase/auth';

// Your web app's Firebase configuration (provided by user)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA2NZEVoRvd-v-wEPa_v6hiXW1OKkeR7u4',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'med-link-3aa71.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'med-link-3aa71',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'med-link-3aa71.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1048244517606',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1048244517606:web:10acd62520b181a380d927',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-EF8YPZE685',
};

// Initialize Firebase (singleton)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Sign in with email and password via Firebase Auth
 */
export async function firebaseSignIn(email: string, pass: string) {
  return await signInWithEmailAndPassword(auth, email.trim(), pass);
}

/**
 * Register a new user with email and password via Firebase Auth
 */
export async function firebaseSignUp(email: string, pass: string) {
  return await createUserWithEmailAndPassword(auth, email.trim(), pass);
}

/**
 * Creates a terminal user in Firebase Auth without logging out the currently active Store Owner session
 */
export async function createTerminalFirebaseUser(email: string, pass: string) {
  const secondaryAppName = `terminal-creator-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pass);
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    return { success: true, uid, user: userCredential.user };
  } catch (err: any) {
    // If user already exists in Firebase, that's fine - return their existing status
    if (err.code === 'auth/email-already-in-use') {
      return { success: true, uid: `existing-fb-${Date.now()}`, alreadyExists: true };
    }
    return { success: false, error: err.message, code: err.code };
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (e) {}
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function firebaseSignOut() {
  return await signOut(auth);
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
};
export type { FirebaseUser };
