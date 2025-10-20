const express = require('express');
const router = express.Router();
const {
  getLessonProgress,
  updateLessonProgress,
  getUserProgress,
  getSectionProgress,
  getSkillProgress,
  getProgressStats,
  getAttachmentProgress,
  updateAttachmentProgress,
  getLessonProgressWithAttachments,
  getAllParentProgress,
  getProgressWithAssignments,
  updateProgressOnAssignmentSubmission,
  getAssignmentProgress
} = require('../controllers/progressController');

// Progress tracking routes
router.get('/lesson/:userId/:lessonId', getLessonProgress);           // Get progress for specific lesson
router.put('/lesson/:userId/:lessonId', updateLessonProgress);        // Update progress for specific lesson
router.get('/user/:userId', getUserProgress);                         // Get all progress for user
router.get('/section/:sectionId', getSectionProgress);               // Get progress for section
router.get('/skill/:skillId', getSkillProgress);                     // Get progress for skill
router.get('/stats/:userId', getProgressStats);                       // Get progress statistics
router.get('/attachment/:userId/:lessonId', getAttachmentProgress);   // Get attachment progress for lesson
router.post('/attachment/:userId/:lessonId/:attachmentId', updateAttachmentProgress); // Update attachment progress
router.get('/lesson-with-attachments/:userId/:lessonId', getLessonProgressWithAttachments); // Get lesson progress with attachment progress
router.get('/teacher/:teacherId/parents', getAllParentProgress);      // Get all parent progress for teacher
router.post('/teacher/:teacherId/parents', getAllParentProgress);     // Get all parent progress for teacher/parent (POST with role)
router.post('/admin/parents', getAllParentProgress);                  // Get all parent progress for admin
router.get('/user/:userId/with-assignments', getProgressWithAssignments); // Get progress with assignment submissions
router.post('/assignment-submission', updateProgressOnAssignmentSubmission); // Update progress on assignment submission
router.get('/assignment/:userId/:assignmentId', getAssignmentProgress); // Get assignment progress for user

module.exports = router;
