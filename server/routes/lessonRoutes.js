const express = require('express');
const router = express.Router();
const {
  getLessonsBySkill,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  searchLessons,
  submitQuiz,
  getQuizResults,
  getLessonQuizSubmissions
} = require('../controllers/lessonController');

// GET /api/lessons/skill/:skillId - Get all lessons for a skill
router.get('/skill/:skillId', getLessonsBySkill);

// GET /api/lessons/:lessonId - Get a specific lesson by ID
router.get('/:lessonId', getLessonById);

// POST /api/lessons - Create a new lesson
router.post('/', createLesson);

// PUT /api/lessons/:lessonId - Update a lesson
router.put('/:lessonId', updateLesson);

// DELETE /api/lessons/:lessonId - Delete a lesson
router.delete('/:lessonId', deleteLesson);

// GET /api/lessons/skill/:skillId/search - Search lessons in a skill
router.get('/skill/:skillId/search', searchLessons);

// POST /api/lessons/:lessonId/quiz/submit - Submit quiz for a lesson
router.post('/:lessonId/quiz/submit', submitQuiz);

// GET /api/lessons/:lessonId/quiz/results - Get quiz results for a user
router.get('/:lessonId/quiz/results', getQuizResults);

// GET /api/lessons/:lessonId/quiz/submissions - Get all quiz submissions for a lesson
router.get('/:lessonId/quiz/submissions', getLessonQuizSubmissions);

module.exports = router;
