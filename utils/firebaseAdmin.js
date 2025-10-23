// utils/firebaseAdmin.js
import admin from 'firebase-admin';

/**
 * Initializes Firebase Admin if credentials are present.
 * Supports either:
 *  - FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string)
 *  - FIREBASE_SERVICE_ACCOUNT_BASE64 (base64-encoded JSON)
 * And requires FIREBASE_DATABASE_URL (e.g., https://<project-id>-default-rtdb.firebaseio.com)
 */
function initFirebase() {
  if (admin.apps.length) return;

  let creds = null;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (raw) {
    try { creds = JSON.parse(raw); } catch {}
  } else if (b64) {
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      creds = JSON.parse(decoded);
    } catch {}
  }

  const dbURL = process.env.FIREBASE_DATABASE_URL;
  if (creds && dbURL) {
    admin.initializeApp({
      credential: admin.credential.cert(creds),
      databaseURL: dbURL,
    });
    console.log('[firebase] Admin initialized');
  } else {
    console.log('[firebase] Skipping Admin init (missing creds or database URL)');
  }
}

initFirebase();

/** Return admin.database() if initialized, otherwise null */
export function getDb() {
  try {
    if (!admin.apps.length) return null;
    return admin.database();
  } catch {
    return null;
  }
}

/** A tiny in-memory mock with .ref(path).get().set() for local/demo use */
export function getDbOrMock() {
  const real = getDb();
  if (real) return real;

  const mem = new Map();
  console.log('[firebase] Using in-memory DB mock');
  return {
    ref(path) {
      const p = String(path);
      return {
        async set(val) { mem.set(p, val); },
        async get() { return { val: () => mem.get(p) }; }
      };
    }
  };
}
