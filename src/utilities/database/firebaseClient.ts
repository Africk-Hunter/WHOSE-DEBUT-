import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { type Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Analytics only initializes when a measurement ID is configured and the browser supports it
// (e.g. not blocked by an ad blocker), so `analytics` may resolve to null.
export const analyticsReady: Promise<Analytics | null> = firebaseConfig.measurementId
    ? isSupported().then((supported) =>
          supported ? import('firebase/analytics').then(({ getAnalytics }) => getAnalytics(app)) : null,
      )
    : Promise.resolve(null);
