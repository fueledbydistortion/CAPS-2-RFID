const express = require('express');
const router = express.Router();
const {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  addStudentToSection,
  removeStudentFromSection,
  getSectionsByGrade
} = require('../controllers/sectionController');

// Section CRUD routes
router.post('/', createSection);                    // Create new section
router.get('/', getAllSections);                    // Get all sections
router.get('/grade/:grade', getSectionsByGrade);    // Get sections by grade
router.get('/:id', getSectionById);                // Get section by ID
router.put('/:id', updateSection);                // Update section
router.delete('/:id', deleteSection);               // Delete section

// Student assignment routes
router.post('/:id/students', addStudentToSection);           // Add student to section
router.delete('/:id/students/:studentId', removeStudentFromSection); // Remove student from section

module.exports = router;
