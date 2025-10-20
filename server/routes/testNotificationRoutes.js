const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createNotification, broadcastNotification } = require('../controllers/notificationController');

/**
 * Test route to create sample notifications
 * This is useful for testing the notification system
 */
router.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    const { userId, type = 'system' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Create a test notification
    const testNotifications = {
      attendance: {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'attendance',
        title: '✓ Test: Attendance Marked',
        message: 'This is a test attendance notification. Your child was marked present at 9:00 AM',
        priority: 'normal',
        actionUrl: '/dashboard/parent-schedules'
      },
      assignment: {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'assignment',
        title: '📝 Test: New Assignment',
        message: 'This is a test assignment notification. New assignment posted: Math Homework - Due: Tomorrow',
        priority: 'normal',
        actionUrl: '/dashboard/parent-content'
      },
      announcement: {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'announcement',
        title: '📢 Test: School Announcement',
        message: 'This is a test announcement. Important: School will be closed next Friday for maintenance.',
        priority: 'high',
        actionUrl: '/dashboard/calendar'
      },
      badge: {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'badge',
        title: '🏆 Test: Badge Earned!',
        message: 'This is a test badge notification. Congratulations! You earned "Perfect Week" badge (+50 points)',
        priority: 'normal',
        actionUrl: '/dashboard/badges'
      },
      system: {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'system',
        title: '🔔 Test: System Notification',
        message: 'This is a test system notification. The notification bell is working correctly!',
        priority: 'normal',
        actionUrl: '/dashboard'
      }
    };

    const notificationData = testNotifications[type] || testNotifications.system;

    await createNotification({
      body: notificationData,
      user: req.user
    }, res);

  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test notification: ' + error.message
    });
  }
});

/**
 * Test route to create multiple sample notifications at once
 */
router.post('/test-all-notifications', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const notifications = [
      {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'attendance',
        title: '✓ Attendance Marked',
        message: 'Test child was marked present for Math Class at 9:00 AM',
        priority: 'normal',
        actionUrl: '/dashboard/parent-schedules',
        metadata: { test: true }
      },
      {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'assignment',
        title: '📝 New Assignment Posted',
        message: 'Math Homework Assignment - Due: Dec 31, 2024',
        priority: 'normal',
        actionUrl: '/dashboard/parent-content',
        metadata: { test: true }
      },
      {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'badge',
        title: '🏆 Badge Earned!',
        message: 'Congratulations! You earned "Perfect Week" badge (+50 points)',
        priority: 'normal',
        actionUrl: '/dashboard/badges',
        metadata: { test: true }
      },
      {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'announcement',
        title: '📢 School Announcement',
        message: 'Important: Parent-Teacher Conference scheduled for next week',
        priority: 'high',
        actionUrl: '/dashboard/calendar',
        metadata: { test: true }
      },
      {
        recipientId: userId,
        recipientRole: 'parent',
        type: 'system',
        title: '🔔 Welcome to Notifications',
        message: 'Your notification system is working! You will receive updates here.',
        priority: 'normal',
        actionUrl: '/dashboard',
        metadata: { test: true }
      }
    ];

    // Create all notifications
    const results = [];
    for (const notif of notifications) {
      await createNotification({
        body: notif,
        user: req.user
      }, {
        json: (data) => results.push(data),
        status: () => ({ json: (data) => results.push(data) })
      });
    }

    res.json({
      success: true,
      message: `Created ${notifications.length} test notifications`,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test notifications: ' + error.message
    });
  }
});

module.exports = router;

