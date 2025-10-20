const express = require('express');
const router = express.Router();
const {
  getParentSchedules,
  getParentSchedulesByDay,
  getParentChildrenAttendanceHistory,
  markAttendanceViaQR,
  getTodayAttendanceStatus
} = require('../controllers/parentScheduleController');

// Get schedules assigned to a specific parent (through their children)
router.get('/:parentId', getParentSchedules);

// Get parent's children schedules for a specific day
router.get('/:parentId/day/:day', getParentSchedulesByDay);

// Get attendance history for parent's children
router.get('/:parentId/attendance/history', getParentChildrenAttendanceHistory);

// Get today's attendance status for parent's children
router.get('/:parentId/attendance/today', getTodayAttendanceStatus);

// Mark attendance for parent's child via QR code
router.post('/attendance/qr-mark', markAttendanceViaQR);

module.exports = router;
