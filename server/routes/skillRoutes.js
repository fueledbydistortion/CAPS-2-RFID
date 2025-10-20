const express = require('express');
const router = express.Router();
const {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  assignSectionToSkill,
  removeSectionFromSkill,
  getSkillSections
} = require('../controllers/skillController');

// Skill CRUD routes
router.post('/', createSkill);                    // Create new skill
router.get('/', getAllSkills);                     // Get all skills
router.get('/:id', getSkillById);                 // Get skill by ID
router.put('/:id', updateSkill);                  // Update skill
router.delete('/:id', deleteSkill);               // Delete skill

// Section assignment routes
router.post('/:skillId/sections', assignSectionToSkill);           // Assign section to skill
router.delete('/:skillId/sections/:sectionId', removeSectionFromSkill); // Remove section from skill
router.get('/:skillId/sections', getSkillSections);                // Get sections assigned to skill

module.exports = router;
