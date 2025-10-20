const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  broadcastNotification
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create a new notification
router.post('/', createNotification);

// Broadcast notification to multiple users
router.post('/broadcast', broadcastNotification);

// Get all notifications for a user
router.get('/user/:userId', getUserNotifications);

// Get unread notification count
router.get('/user/:userId/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read for a user
router.patch('/user/:userId/read-all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Delete all notifications for a user
router.delete('/user/:userId/all', deleteAllNotifications);

module.exports = router;

