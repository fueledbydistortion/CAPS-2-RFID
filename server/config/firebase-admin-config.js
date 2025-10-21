var admin = require("firebase-admin");
const path = require("path");

// Try to load credentials from JSON file first, then fall back to environment variables
let serviceAccount = null;

// Check if credentials.json exists
const credentialsPath = path.join(__dirname, "../credentials.json");
try {
  serviceAccount = require(credentialsPath);
  console.log("✅ Loaded Firebase credentials from JSON file");
} catch (error) {
  console.log("⚠️ No credentials.json found, trying environment variables...");
}

// Check for environment variables
var hasEnvCreds =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (serviceAccount) {
    // Use JSON file credentials
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
      storageBucket: "gs://smartchild-2e350.firebasestorage.app",
    });
    console.log("✅ Firebase Admin initialized with JSON credentials");
  } else if (hasEnvCreds) {
    // Use environment variables
    var normalizedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(
      /\\n/g,
      "\n"
    );
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizedPrivateKey,
      }),
      databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
      storageBucket: "gs://smartchild-2e350.firebasestorage.app",
    });
    console.log("✅ Firebase Admin initialized with environment variables");
  } else {
    // Fall back to Application Default Credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
      storageBucket: "gs://smartchild-2e350.firebasestorage.app",
    });
    console.log(
      "✅ Firebase Admin initialized with Application Default Credentials"
    );
  }
}

// Get the Realtime Database instance
const db = admin.database();

// Get the Storage instance
const bucket = admin.storage().bucket();

module.exports = {
  admin,
  db,
  bucket,
};
