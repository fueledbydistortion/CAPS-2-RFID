// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// Import Firebase Admin config
require("./config/firebase-admin-config");

// Import routes
const sectionRoutes = require("./routes/sectionRoutes");
const skillRoutes = require("./routes/skillRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const userRoutes = require("./routes/userRoutes");
const parentScheduleRoutes = require("./routes/parentScheduleRoutes");
const parentSectionRoutes = require("./routes/parentSectionRoutes");
const progressRoutes = require("./routes/progressRoutes");
const reportingRoutes = require("./routes/reportingRoutes");
const fileRoutes = require("./routes/fileRoutes");
const chatRoutes = require("./routes/chatRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const notificationPreferencesRoutes = require("./routes/notificationPreferencesRoutes");
const testNotificationRoutes = require("./routes/testNotificationRoutes");

const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
console.log("🔍 DEBUG: Mounting API routes...");
app.use("/api/sections", sectionRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/schedules", scheduleRoutes);
console.log(
  "🔍 DEBUG: Mounting parent schedule routes at /api/schedules/parent"
);
app.use("/api/schedules/parent", parentScheduleRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/parent-sections", parentSectionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/reports", reportingRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notification-preferences", notificationPreferencesRoutes);
app.use("/api/test-notifications", testNotificationRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({
    message: "smartchildcare Server is running!",
    endpoints: {
      sections: "/api/sections",
      skills: "/api/skills",
      schedules: "/api/schedules",
      parentSchedules: "/api/schedules/parent",
      attendance: "/api/attendance",
      lessons: "/api/lessons",
      assignments: "/api/assignments",
      users: "/api/users",
      parentSections: "/api/parent-sections",
      progress: "/api/progress",
      reports: "/api/reports",
      files: "/api/files",
      chat: "/api/chat",
      announcements: "/api/announcements",
      badges: "/api/badges",
      notifications: "/api/notifications",
      health: "/health",
      attachmentProgress: "/api/progress/attachment",
    },
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler - MUST be after all routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`,
    availableEndpoints: {
      files: "/api/files",
      lessonUpload: "/api/files/lesson/:lessonId/upload",
      genericUpload: "/api/files/upload",
    },
  });
});

// Error handling middleware - MUST be last
app.use((err, req, res, next) => {
  console.error("Error caught by middleware:", err);

  // Handle multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      error: `File upload error: ${err.message}`,
      code: err.code,
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`  - Local: http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.1.27:${PORT}`);
});
