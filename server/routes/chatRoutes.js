const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// Get all conversations for a user
router.get('/conversations/:userId', authenticateToken, chatController.getUserConversations);

// Create or get a conversation
router.post('/conversations', authenticateToken, chatController.createOrGetConversation);

// Send a message
router.post('/messages', authenticateToken, chatController.sendMessage);

// Mark messages as read
router.put('/messages/read', authenticateToken, chatController.markMessagesAsRead);

// Get unread count
router.get('/unread/:userId', authenticateToken, chatController.getUnreadCount);

// Delete a conversation
router.delete('/conversations', authenticateToken, chatController.deleteConversation);

module.exports = router;

