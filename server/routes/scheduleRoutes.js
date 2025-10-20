const express = require('express');
const router = express.Router();
const {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getSchedulesByDay,
  getSchedulesBySection
} = require('../controllers/scheduleController');

// Schedule CRUD routes
router.post('/', createSchedule);                           // Create new schedule
router.get('/', getAllSchedules);                           // Get all schedules
router.get('/day/:day', getSchedulesByDay);                 // Get schedules by day
router.get('/section/:sectionId', getSchedulesBySection);   // Get schedules by section
router.get('/:id', getScheduleById);                        // Get schedule by ID
router.put('/:id', updateSchedule);                         // Update schedule
router.delete('/:id', deleteSchedule);                      // Delete schedule

module.exports = router;
