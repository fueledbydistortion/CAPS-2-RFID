var admin = require("firebase-admin");

// Prefer environment variables over local credentials files to avoid committing secrets
// Expected env vars:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY  (with literal \n characters or real newlines)
// Alternatively, if GOOGLE_APPLICATION_CREDENTIALS is set to a local path, admin SDK will pick it up.

var hasEnvCreds =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (hasEnvCreds) {
    // Normalize private key to ensure newlines are correct whether provided as \n or real newlines
    var normalizedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizedPrivateKey
      }),
      databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
      storageBucket: "gs://smartchild-2e350.firebasestorage.app"
    });
  } else {
    // Fall back to ADC if configured (e.g., GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
      storageBucket: "gs://smartchild-2e350.firebasestorage.app"
    });
  }
}

// Get the Realtime Database instance
const db = admin.database();

// Get the Storage instance
const bucket = admin.storage().bucket();

module.exports = {
  admin,
  db,
  bucket
};
