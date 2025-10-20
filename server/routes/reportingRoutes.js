const express = require('express');
const router = express.Router();
const {
  generateAttendanceReport,
  generateProgressReport,
  generateDashboardReport,
  exportStudentReport
} = require('../controllers/reportingController');

// Reporting routes
router.get('/attendance', generateAttendanceReport);        // Generate attendance report
router.get('/progress', generateProgressReport);            // Generate progress report
router.get('/dashboard', generateDashboardReport);          // Generate dashboard report
router.get('/student/export', exportStudentReport);         // Export individual student report

module.exports = router;
