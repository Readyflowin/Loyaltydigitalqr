/**
 * Firebase bootstrap.
 *
 * All configuration comes from Vite env variables (see .env.example).
 * The web config is not a secret: access control is enforced by
 * Firestore Security Rules (firestore.rules), not by hiding these values.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  throw new Error(
    `Firebase is not configured. Missing env values: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and paste your Firebase web app config.'
  );
}

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);

function createFirestore(): Firestore {
  try {
    // Offline-capable cache shared across tabs (counter tablets lose Wi-Fi).
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Private browsing / unsupported IndexedDB: fall back to memory cache.
    return initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true,
    });
  }
}

export const db: Firestore = createFirestore();

// Local testing only: `VITE_USE_EMULATORS=true npm run dev` with `firebase emulators:start`.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

/**
 * Public HTTPS origin that is printed into QR codes and shareable links.
 * Falls back to the current origin when not configured.
 */
export function getPublicAppOrigin(): string {
  const configured = (import.meta.env.VITE_PUBLIC_APP_ORIGIN || '').trim().replace(/\/+$/, '');
  if (configured.startsWith('https://')) return configured;
  return typeof window !== 'undefined' ? window.location.origin : '';
}
