import { database } from './firebase-config';
import { ref, onValue, off, query, orderByChild, limitToLast, push, set, update, remove } from 'firebase/database';

/**
 * Listen to user's conversations in real-time
 */
export const listenToConversations = (userId, callback) => {
  console.log('listenToConversations called for user:', userId);
  const conversationsRef = ref(database, `userConversations/${userId}`);
  
  const unsubscribe = onValue(conversationsRef, async (snapshot) => {
    console.log('User conversations updated:', snapshot.exists() ? Object.keys(snapshot.val()) : 'none');
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const conversationIds = Object.keys(snapshot.val());
    console.log('Processing conversations:', conversationIds);
    const conversations = [];

    // Get details for each conversation
    for (const conversationId of conversationIds) {
      try {
        // Get conversation data
        const convRef = ref(database, `conversations/${conversationId}`);
        const convSnapshot = await new Promise((resolve) => {
          onValue(convRef, resolve, { onlyOnce: true });
        });

        if (convSnapshot.exists()) {
          const convData = convSnapshot.val();

          // Get last message
          const messagesRef = ref(database, `messages/${conversationId}`);
          const lastMessageQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(1));
          const lastMessageSnapshot = await new Promise((resolve) => {
            onValue(lastMessageQuery, resolve, { onlyOnce: true });
          });

          let lastMessage = null;
          let unreadCount = 0;

          if (lastMessageSnapshot.exists()) {
            const messages = lastMessageSnapshot.val();
            const messageKey = Object.keys(messages)[0];
            lastMessage = messages[messageKey];
          }

          // Get unread count
          const allMessagesSnapshot = await new Promise((resolve) => {
            onValue(messagesRef, resolve, { onlyOnce: true });
          });

          if (allMessagesSnapshot.exists()) {
            const allMessages = allMessagesSnapshot.val();
            unreadCount = Object.values(allMessages).filter(
              msg => msg.senderId !== userId && !msg.read
            ).length;
          }

          conversations.push({
            conversationId,
            ...convData,
            lastMessage,
            unreadCount
          });
        }
      } catch (error) {
        console.error('Error fetching conversation details:', error);
      }
    }

    // Sort by last message timestamp
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return timeB - timeA;
    });

    console.log('Processed conversations:', conversations.length, conversations);
    callback(conversations);
  });

  return () => off(conversationsRef);
};

/**
 * Listen to messages in a conversation in real-time
 */
export const listenToMessages = (conversationId, callback) => {
  console.log('listenToMessages called with conversationId:', conversationId);
  if (!conversationId) {
    console.log('No conversationId provided, returning empty array');
    callback([]);
    return () => {};
  }

  const messagesRef = ref(database, `messages/${conversationId}`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'));
  console.log('Setting up Firebase listener for messages at:', `messages/${conversationId}`);

  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    console.log('Firebase snapshot received for conversation:', conversationId, 'exists:', snapshot.exists());
    if (!snapshot.exists()) {
      console.log('No messages found in snapshot');
      callback([]);
      return;
    }

    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        messageId: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    console.log('Processed messages:', messages.length, messages);
    callback(messages);
  });

  return () => off(messagesRef);
};

/**
 * Send a message (directly to Firebase Realtime Database)
 */
export const sendMessageDirect = async (conversationId, senderId, senderName, message, messageType = 'text') => {
  try {
    const messageData = {
      senderId,
      senderName,
      message,
      messageType,
      timestamp: Date.now(),
      read: false
    };

    // Add message to conversation
    const messagesRef = ref(database, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, messageData);

    // Update conversation's last updated time
    const conversationRef = ref(database, `conversations/${conversationId}/updatedAt`);
    await set(conversationRef, Date.now());

    // Create notification for the recipient
    try {
      console.log('[ChatUtils] Creating notification for message in conversation:', conversationId);
      
      // Get conversation to find recipient
      const conversationSnapshot = await new Promise((resolve) => {
        const convRef = ref(database, `conversations/${conversationId}`);
        onValue(convRef, resolve, { onlyOnce: true });
      });

      if (conversationSnapshot.exists()) {
        const conversation = conversationSnapshot.val();
        const participants = conversation.participants || {};
        
        console.log('[ChatUtils] Conversation participants:', Object.keys(participants));
        
        // Find the recipient (the participant who is not the sender)
        const recipientId = Object.keys(participants).find(id => id !== senderId);
        
        if (recipientId) {
          console.log('[ChatUtils] Recipient found:', recipientId);
          const recipient = participants[recipientId];
          const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
          
          // Import and use the notification service
          const { createNotification } = await import('./notificationService');
          
          const notificationResult = await createNotification({
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
              messageId: newMessageRef.key
            }
          });
          
          console.log('[ChatUtils] Notification created:', notificationResult);
        } else {
          console.warn('[ChatUtils] No recipient found for notification');
        }
      } else {
        console.warn('[ChatUtils] Conversation not found:', conversationId);
      }
    } catch (notifError) {
      console.error('[ChatUtils] Error creating message notification:', notifError);
      // Don't fail the message send if notification fails
    }

    return { success: true, messageId: newMessageRef.key };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark messages as read (directly in Firebase Realtime Database)
 */
export const markMessagesAsReadDirect = async (conversationId, userId) => {
  try {
    const messagesRef = ref(database, `messages/${conversationId}`);
    
    // Get all messages
    const snapshot = await new Promise((resolve) => {
      onValue(messagesRef, resolve, { onlyOnce: true });
    });

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
        await update(messagesRef, updates);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create or get a conversation (directly in Firebase Realtime Database)
 */
export const createOrGetConversationDirect = async (user1Id, user2Id, user1Name, user2Name, user1Role, user2Role) => {
  try {
    console.log('createOrGetConversationDirect called with:', {
      user1Id, user2Id, user1Name, user2Name, user1Role, user2Role
    });

    // Create a consistent conversation ID (sorted to ensure same ID for both directions)
    const conversationId = [user1Id, user2Id].sort().join('_');
    console.log('Generated conversationId:', conversationId);

    // Check if conversation already exists
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await new Promise((resolve) => {
      onValue(conversationRef, resolve, { onlyOnce: true });
    });

    if (!snapshot.exists()) {
      console.log('Creating new conversation...');
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

      await set(conversationRef, conversationData);

      // Add conversation reference to both users
      const user1ConvRef = ref(database, `userConversations/${user1Id}/${conversationId}`);
      const user2ConvRef = ref(database, `userConversations/${user2Id}/${conversationId}`);
      await set(user1ConvRef, true);
      await set(user2ConvRef, true);

      console.log('New conversation created:', conversationData);
      console.log('Added conversation to userConversations for users:', user1Id, user2Id);
      return { success: true, data: { conversationId, ...conversationData }, isNew: true };
    }

    const conversationData = snapshot.val();
    console.log('Existing conversation found:', conversationData);
    return { success: true, data: { conversationId, ...conversationData }, isNew: false };
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a conversation (directly from Firebase Realtime Database)
 */
export const deleteConversationDirect = async (conversationId, userId) => {
  try {
    // Remove conversation reference from user
    const userConvRef = ref(database, `userConversations/${userId}/${conversationId}`);
    await remove(userConvRef);

    // Check if any other user still has this conversation
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const snapshot = await new Promise((resolve) => {
      onValue(conversationRef, resolve, { onlyOnce: true });
    });

    if (snapshot.exists()) {
      const participants = snapshot.val().participants;
      const participantIds = Object.keys(participants);

      // Check if all participants have removed this conversation
      let stillActive = false;
      for (const participantId of participantIds) {
        const userConvRef = ref(database, `userConversations/${participantId}/${conversationId}`);
        const userConvSnapshot = await new Promise((resolve) => {
          onValue(userConvRef, resolve, { onlyOnce: true });
        });
        if (userConvSnapshot.exists()) {
          stillActive = true;
          break;
        }
      }

      // If no participants have this conversation, delete it completely
      if (!stillActive) {
        await remove(conversationRef);
        const messagesRef = ref(database, `messages/${conversationId}`);
        await remove(messagesRef);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get total unread count for a user
 */
export const getUnreadCount = async (userId) => {
  try {
    const conversationsRef = ref(database, `userConversations/${userId}`);
    const snapshot = await new Promise((resolve) => {
      onValue(conversationsRef, resolve, { onlyOnce: true });
    });

    if (!snapshot.exists()) {
      return { success: true, count: 0 };
    }

    const conversationIds = Object.keys(snapshot.val());
    let totalUnread = 0;

    // Count unread messages in each conversation
    for (const conversationId of conversationIds) {
      const messagesRef = ref(database, `messages/${conversationId}`);
      const messagesSnapshot = await new Promise((resolve) => {
        onValue(messagesRef, resolve, { onlyOnce: true });
      });

      if (messagesSnapshot.exists()) {
        const messages = messagesSnapshot.val();
        totalUnread += Object.values(messages).filter(
          msg => msg.senderId !== userId && !msg.read
        ).length;
      }
    }

    return { success: true, count: totalUnread };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, count: 0, error: error.message };
  }
};

