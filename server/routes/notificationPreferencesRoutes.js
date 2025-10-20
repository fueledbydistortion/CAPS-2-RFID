const express = require('express');
const router = express.Router();
const {
  getUserPreferences,
  updateUserPreferences,
  setDefaultPreferences,
  resetToDefault
} = require('../controllers/notificationPreferencesController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get user's notification preferences
router.get('/user/:userId', getUserPreferences);

// Update user's notification preferences
router.put('/user/:userId', updateUserPreferences);

// Set default preferences for a new user (admin only or self)
router.post('/default', setDefaultPreferences);

// Reset user preferences to default
router.post('/user/:userId/reset', resetToDefault);

module.exports = router;

