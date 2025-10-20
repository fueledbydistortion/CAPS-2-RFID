const express = require('express');
const router = express.Router();
const {
  getAssignmentsBySkill,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  searchAssignments,
  getAssignmentsByType,
  getAssignmentsDueSoon,
  submitAssignment,
  getAssignmentSubmissions,
  gradeAssignmentSubmission,
  getStudentSubmissions
} = require('../controllers/assignmentController');
const { authenticateToken, authorizeParent, authorizeTeacher } = require('../middleware/auth');

// GET /api/assignments/skill/:skillId - Get all assignments for a skill
router.get('/skill/:skillId', getAssignmentsBySkill);

// GET /api/assignments/:assignmentId - Get a specific assignment by ID
router.get('/:assignmentId', getAssignmentById);

// POST /api/assignments - Create a new assignment
router.post('/', createAssignment);

// PUT /api/assignments/:assignmentId - Update an assignment
router.put('/:assignmentId', updateAssignment);

// DELETE /api/assignments/:assignmentId - Delete an assignment
router.delete('/:assignmentId', deleteAssignment);

// GET /api/assignments/skill/:skillId/search - Search assignments in a skill
router.get('/skill/:skillId/search', searchAssignments);

// GET /api/assignments/skill/:skillId/type/:type - Get assignments by type
router.get('/skill/:skillId/type/:type', getAssignmentsByType);

// GET /api/assignments/skill/:skillId/due-soon - Get assignments due soon
router.get('/skill/:skillId/due-soon', getAssignmentsDueSoon);

// Assignment submission routes
// POST /api/assignments/submit - Submit assignment (for parents)
router.post('/submit', authenticateToken, authorizeParent, submitAssignment);

// GET /api/assignments/:assignmentId/submissions - Get assignment submissions (for teachers)
router.get('/:assignmentId/submissions', authenticateToken, authorizeTeacher, getAssignmentSubmissions);

// PUT /api/assignments/submissions/:submissionId/grade - Grade assignment submission
router.put('/submissions/:submissionId/grade', authenticateToken, authorizeTeacher, gradeAssignmentSubmission);

// GET /api/assignments/student/:studentId/submissions - Get student's submissions
router.get('/student/:studentId/submissions', authenticateToken, authorizeTeacher, getStudentSubmissions);

module.exports = router;
