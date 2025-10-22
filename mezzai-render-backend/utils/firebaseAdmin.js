// utils/firebaseAdmin.js
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };
  admin.initializeApp({
    credential: admin.credential.cert(svc),
    databaseURL: `https://${svc.project_id}-default-rtdb.firebaseio.com`
  });
}

export const db = admin.database();
