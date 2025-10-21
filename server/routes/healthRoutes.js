const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase-admin-config");
const { getCacheStats } = require("../utils/cache");

/**
 * Health check endpoint
 */
router.get("/", async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbTest = await db.ref("health").once("value");
    const dbResponseTime = Date.now() - startTime;

    // Get cache statistics
    const cacheStats = getCacheStats();

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connected: true,
        responseTime: `${dbResponseTime}ms`,
      },
      cache: cacheStats,
      environment: process.env.NODE_ENV || "development",
    };

    res.json(health);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false,
      },
    });
  }
});

/**
 * Detailed health check with more metrics
 */
router.get("/detailed", async (req, res) => {
  try {
    const startTime = Date.now();

    // Test multiple database operations
    const dbTests = await Promise.allSettled([
      db.ref("health").once("value"),
      db.ref("schedules").limitToFirst(1).once("value"),
      db.ref("notifications").limitToFirst(1).once("value"),
    ]);

    const totalTime = Date.now() - startTime;
    const cacheStats = getCacheStats();

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connected: dbTests.every((test) => test.status === "fulfilled"),
        responseTime: `${totalTime}ms`,
        tests: dbTests.map((test, index) => ({
          test: ["health", "schedules", "notifications"][index],
          status: test.status,
          error: test.status === "rejected" ? test.reason.message : null,
        })),
      },
      cache: cacheStats,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
    };

    res.json(health);
  } catch (error) {
    console.error("Detailed health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
