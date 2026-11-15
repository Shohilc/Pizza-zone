import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB1QPHh-3H4vUm8k-Wgdum-Pc9dz1j1sB8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pizza-zone-22d28.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pizza-zone-22d28",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pizza-zone-22d28.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "586731098189",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:586731098189:web:0d62decda5528893b54c04",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId
);

let app = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.error('[Firebase Init Error]:', error);
  }
} else {
  console.warn(
    '[Firebase Notice] Firebase web config is not set in client/.env. Demo/dev mode enabled.'
  );
}

export { app, auth, googleProvider };

