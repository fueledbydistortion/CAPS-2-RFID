// Vercel API entry point
try {
  console.log("🚀 Starting Vercel serverless function...");

  // Load environment variables
  require("dotenv").config();

  // Import and export the Express app
  const app = require("../server");

  console.log("✅ Express app loaded successfully");
  module.exports = app;
} catch (error) {
  console.error("❌ Failed to load Express app:", error);

  // Create a minimal error handler for Vercel
  const express = require("express");
  const errorApp = express();

  errorApp.use((req, res) => {
    res.status(500).json({
      success: false,
      error: "Server initialization failed",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  });

  module.exports = errorApp;
}
