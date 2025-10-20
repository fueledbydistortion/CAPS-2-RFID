const express = require('express');
const router = express.Router();
const {
  getParentSectionContent,
  getParentSectionById
} = require('../controllers/parentSectionController');

// Parent section content routes
router.get('/:parentId/content', getParentSectionContent);           // Get all content for parent's sections
router.get('/:parentId/sections/:sectionId', getParentSectionById);  // Get content for specific section

module.exports = router;
