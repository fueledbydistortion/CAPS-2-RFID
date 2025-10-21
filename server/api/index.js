// Vercel API entry point
try {
  console.log("🚀 Starting Vercel serverless function...");

  // Load environment variables
  require("dotenv").config();

  // Check for required environment variables
  const requiredEnvVars = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:", missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
  }

  console.log("✅ Environment variables loaded");

  // Import and export the Express app
  const app = require("../server");

  console.log("✅ Express app loaded successfully");
  module.exports = app;
} catch (error) {
  console.error("❌ Failed to load Express app:", error);
  console.error("Error stack:", error.stack);

  // Create a minimal error handler for Vercel
  const express = require("express");
  const errorApp = express();

  errorApp.use((req, res) => {
    res.status(500).json({
      success: false,
      error: "Server initialization failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  });

  module.exports = errorApp;
}
