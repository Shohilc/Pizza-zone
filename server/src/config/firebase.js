import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let firebaseInitialized = false;

try {
  if (!admin.apps.length) {
    const localKeyPath = fs.existsSync(path.resolve('serviceAccountKey.json'))
      ? path.resolve('serviceAccountKey.json')
      : fs.existsSync(path.resolve('serviceAccountKey.json.json'))
      ? path.resolve('serviceAccountKey.json.json')
      : null;

    if (localKeyPath) {
      const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('[Firebase] Admin SDK initialized from serviceAccountKey.json');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('[Firebase] Admin SDK initialized with JSON credentials');
    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_PRIVATE_KEY.includes('PRIVATE KEY')
    ) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      firebaseInitialized = true;
      console.log('[Firebase] Admin SDK initialized with environment credentials');
    } else {
      console.warn(
        '[Firebase Warning] Missing or placeholder Firebase credentials in server/.env.\n' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (or FIREBASE_SERVICE_ACCOUNT_JSON).\n' +
        'In development mode, token verification will accept test auth tokens or return fallback.'
      );
    }
  } else {
    firebaseInitialized = true;
  }
} catch (error) {
  console.error('[Firebase Error] Failed to initialize Firebase Admin SDK:', error.message);
}

export { admin, firebaseInitialized };

