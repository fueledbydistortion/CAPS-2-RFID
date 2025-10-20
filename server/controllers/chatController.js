const { db } = require('../config/firebase-admin-config');
const { createNotification } = require('./notificationController');

/**
 * Get all chat conversations for a user
 */
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's conversations
    const conversationsRef = db.ref(`userConversations/${userId}`);
    const snapshot = await conversationsRef.once('value');
    
    if (!snapshot.exists()) {
      return res.json({ success: true, data: [] });
    }

    const conversations = [];
    const conversationIds = Object.keys(snapshot.val());

    // Get details for each conversation
    for (const conversationId of conversationIds) {
      const convRef = db.ref(`conversations/${conversationId}`);
      const convSnapshot = await convRef.once('value');
      
      if (convSnapshot.exists()) {
        const convData = convSnapshot.val();
        
        // Get last message
        const messagesRef = db.ref(`messages/${conversationId}`);
        const lastMessageSnapshot = await messagesRef.orderByChild('timestamp').limitToLast(1).once('value');
        
        let lastMessage = null;
        if (lastMessageSnapshot.exists()) {
          const messages = lastMessageSnapshot.val();
          const messageKey = Object.keys(messages)[0];
          lastMessage = messages[messageKey];
        }

        conversations.push({
          conversationId,
          ...convData,
          lastMessage
        });
      }
    }

    // Sort by last message timestamp
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Create or get a conversation between two users
 */
exports.createOrGetConversation = async (req, res) => {
  try {
    const { user1Id, user2Id, user1Name, user2Name, user1Role, user2Role } = req.body;

    if (!user1Id || !user2Id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both user IDs are required' 
      });
    }

    // Create a consistent conversation ID (sorted to ensure same ID for both directions)
    const conversationId = [user1Id, user2Id].sort().join('_');

    // Check if conversation already exists
    const conversationRef = db.ref(`conversations/${conversationId}`);
    const snapshot = await conversationRef.once('value');

    if (!snapshot.exists()) {
      // Create new conversation
      const conversationData = {
        conversationId,
        participants: {
          [user1Id]: {
            name: user1Name,
            role: user1Role
          },
          [user2Id]: {
            name: user2Name,
            role: user2Role
          }
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await conversationRef.set(conversationData);

      // Add conversation reference to both users
      await db.ref(`userConversations/${user1Id}/${conversationId}`).set(true);
      await db.ref(`userConversations/${user2Id}/${conversationId}`).set(true);

      return res.json({ 
        success: true, 
        data: { conversationId, ...conversationData },
        isNew: true
      });
    }

    const conversationData = snapshot.val();
    res.json({ 
      success: true, 
      data: { conversationId, ...conversationData },
      isNew: false
    });
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Send a message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderName, message, messageType = 'text' } = req.body;

    if (!conversationId || !senderId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'conversationId, senderId, and message are required' 
      });
    }

    // Create message data
    const messageData = {
      senderId,
      senderName,
      message,
      messageType,
      timestamp: Date.now(),
      read: false
    };

    // Add message to conversation
    const messageRef = db.ref(`messages/${conversationId}`).push();
    await messageRef.set(messageData);

    // Update conversation's last updated time
    await db.ref(`conversations/${conversationId}/updatedAt`).set(Date.now());

    // Notify the recipient about the new message
    try {
      // Get conversation participants
      const conversationRef = db.ref(`conversations/${conversationId}`);
      const conversationSnapshot = await conversationRef.once('value');
      
      if (conversationSnapshot.exists()) {
        const conversation = conversationSnapshot.val();
        const participants = conversation.participants || {};
        
        // Find the recipient (the participant who is not the sender)
        const recipientId = Object.keys(participants).find(id => id !== senderId);
        
        if (recipientId) {
          const recipient = participants[recipientId];
          const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
          
          await createNotification({
            body: {
              recipientId: recipientId,
              recipientRole: recipient.role || 'parent',
              type: 'message',
              title: `💬 New message from ${senderName}`,
              message: messagePreview,
              priority: 'normal',
              actionUrl: '/dashboard/messaging',
              metadata: {
                conversationId,
                senderId,
                senderName,
                messageId: messageRef.key
              }
            },
            user: { uid: senderId }
          }, { 
            json: () => {}, 
            status: () => ({ json: () => {} }) 
          });
        }
      }
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
      // Don't fail the message send if notification fails
    }

    res.json({ 
      success: true, 
      data: {
        messageId: messageRef.key,
        ...messageData
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Mark messages as read
 */
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'conversationId and userId are required' 
      });
    }

    // Get all unread messages for this user
    const messagesRef = db.ref(`messages/${conversationId}`);
    const snapshot = await messagesRef.once('value');

    if (snapshot.exists()) {
      const messages = snapshot.val();
      const updates = {};

      Object.keys(messages).forEach(messageId => {
        const message = messages[messageId];
        // Mark as read if message is from other user and not already read
        if (message.senderId !== userId && !message.read) {
          updates[`${messageId}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        await messagesRef.update(updates);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Get unread message count for a user
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's conversations
    const conversationsRef = db.ref(`userConversations/${userId}`);
    const snapshot = await conversationsRef.once('value');
    
    if (!snapshot.exists()) {
      return res.json({ success: true, data: { count: 0 } });
    }

    const conversationIds = Object.keys(snapshot.val());
    let totalUnread = 0;

    // Count unread messages in each conversation
    for (const conversationId of conversationIds) {
      const messagesRef = db.ref(`messages/${conversationId}`);
      const messagesSnapshot = await messagesRef.orderByChild('read').equalTo(false).once('value');
      
      if (messagesSnapshot.exists()) {
        const unreadMessages = messagesSnapshot.val();
        // Only count messages not sent by this user
        Object.values(unreadMessages).forEach(msg => {
          if (msg.senderId !== userId) {
            totalUnread++;
          }
        });
      }
    }

    res.json({ success: true, data: { count: totalUnread } });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Delete a conversation
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    if (!conversationId || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'conversationId and userId are required' 
      });
    }

    // Remove conversation reference from user
    await db.ref(`userConversations/${userId}/${conversationId}`).remove();

    // Check if any other user still has this conversation
    const conversationRef = db.ref(`conversations/${conversationId}`);
    const snapshot = await conversationRef.once('value');
    
    if (snapshot.exists()) {
      const participants = snapshot.val().participants;
      const participantIds = Object.keys(participants);
      
      // Check if all participants have removed this conversation
      let stillActive = false;
      for (const participantId of participantIds) {
        const userConvRef = db.ref(`userConversations/${participantId}/${conversationId}`);
        const userConvSnapshot = await userConvRef.once('value');
        if (userConvSnapshot.exists()) {
          stillActive = true;
          break;
        }
      }

      // If no participants have this conversation, delete it completely
      if (!stillActive) {
        await conversationRef.remove();
        await db.ref(`messages/${conversationId}`).remove();
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

