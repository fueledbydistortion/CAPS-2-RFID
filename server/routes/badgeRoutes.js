const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

// Get all badge definitions
router.get('/definitions', badgeController.getAllBadgeDefinitions);

// Get user's earned badges
router.get('/user/:userId', badgeController.getUserBadges);

// Get user's badge statistics
router.get('/user/:userId/stats', badgeController.getUserBadgeStats);

// Award a badge to a user
router.post('/award', badgeController.awardBadge);

// Check and award badges based on user activity
router.post('/check/:userId', badgeController.checkAndAwardBadges);

// Get leaderboard
router.get('/leaderboard', badgeController.getLeaderboard);

// Get user's rank on leaderboard
router.get('/user/:userId/rank', badgeController.getUserRank);

module.exports = router;

