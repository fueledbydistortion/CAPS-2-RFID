const express = require('express');
const router = express.Router();
const {
  getAllAttendance,
  getAttendanceBySchedule,
  markAttendance,
  getStudentAttendanceHistory
} = require('../controllers/attendanceController');

// Attendance routes
router.get('/', getAllAttendance);                            // Get all attendance records
router.get('/schedule/:scheduleId', getAttendanceBySchedule);  // Get attendance for a schedule
router.post('/mark', markAttendance);                         // Mark attendance for a student
router.get('/student/:studentId/history', getStudentAttendanceHistory); // Get student attendance history

module.exports = router;
