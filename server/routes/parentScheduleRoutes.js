const express = require("express");
const router = express.Router();
const {
  getParentSchedules,
  getParentSchedulesByDay,
  getParentChildrenAttendanceHistory,
  markAttendanceViaQR,
  getTodayAttendanceStatus,
} = require("../controllers/parentScheduleController");

// Mark attendance for parent's child via RFID (must be before parameterized routes)
console.log("🔍 DEBUG: Registering RFID route: /attendance/rfid-mark");
router.post("/attendance/rfid-mark", (req, res, next) => {
  console.log("🔍 DEBUG: RFID route hit! Method:", req.method, "URL:", req.url);
  console.log("🔍 DEBUG: Request body:", req.body);
  console.log("🔍 DEBUG: Request headers:", req.headers);
  markAttendanceViaQR(req, res, next);
});

// Get schedules assigned to a specific parent (through their children)
router.get("/:parentId", getParentSchedules);

// Get parent's children schedules for a specific day
router.get("/:parentId/day/:day", getParentSchedulesByDay);

// Get attendance history for parent's children
router.get("/:parentId/attendance/history", getParentChildrenAttendanceHistory);

// Get today's attendance status for parent's children
router.get("/:parentId/attendance/today", getTodayAttendanceStatus);

module.exports = router;
