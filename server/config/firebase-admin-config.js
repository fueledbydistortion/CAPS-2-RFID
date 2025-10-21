var admin = require("firebase-admin");
const path = require("path");

// Prefer env vars on Vercel; optionally allow a bundled credentials.json for local dev
let serviceAccount = null;
const credentialsPath = path.join(__dirname, "../credentials.json");
try {
  serviceAccount = require(credentialsPath);
  console.log("✅ Loaded Firebase credentials from JSON file");
} catch (error) {
  console.log("ℹ️ credentials.json not found, using environment variables...");
}

const hasEnvCreds =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

// Configurable URLs (must be set on Vercel)
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://smartchild-2e350-default-rtdb.firebaseio.com"; // sensible default for this project
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET || "smartchild-2e350.appspot.com"; // typical Firebase bucket domain

if (!admin.apps.length) {
  try {
    const appConfig = {
      databaseURL,
      storageBucket,
      // Optimize for serverless environments
      databaseAuthVariableOverride: null,
      // Set connection timeout
      httpAgent: {
        timeout: 10000, // 10 seconds timeout
        keepAlive: true,
        keepAliveMsecs: 30000,
      },
    };

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...appConfig,
      });
      console.log("✅ Firebase Admin initialized with JSON credentials");
    } else if (hasEnvCreds) {
      // Normalize escaped \n in private key when coming from env
      const normalizedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      );
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: normalizedPrivateKey,
        }),
        ...appConfig,
      });
      console.log("✅ Firebase Admin initialized with environment variables");
    } else {
      // On Vercel there is no ADC; fail fast with a clear error to avoid 500 mystery
      console.error(
        "❌ Firebase credentials not provided. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (and optional FIREBASE_DATABASE_URL, FIREBASE_STORAGE_BUCKET) in your environment."
      );
      console.error(
        "Available env vars:",
        Object.keys(process.env).filter((key) => key.startsWith("FIREBASE"))
      );
      throw new Error("Firebase Admin credentials missing");
    }
  } catch (e) {
    console.error("❌ Failed to initialize Firebase Admin:", e);
    console.error("Error details:", e.message);
    throw e;
  }
}

// Safe accessors
const db = admin.database();
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };
