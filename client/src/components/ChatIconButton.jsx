import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { createOrGetConversationDirect } from '../utils/chatUtils';

/**
 * ChatIconButton - A simple icon button to start a chat with a specific user
 * 
 * Props:
 * - targetUser: Object with { id, name, role } of the user to chat with
 * - size: IconButton size ('small', 'medium', 'large')
 * - tooltip: Custom tooltip text (default: "Send Message")
 */
const ChatIconButton = ({ targetUser, size = 'small', tooltip = 'Send Message' }) => {
  const { currentUser, userProfile } = useAuth();
  const { openConversation } = useChat();
  const [loading, setLoading] = useState(false);

  const handleChat = async (e) => {
    e.stopPropagation();
    
    if (!targetUser || !currentUser) return;

    setLoading(true);
    try {
      const result = await createOrGetConversationDirect(
        currentUser.uid,
        targetUser.id || targetUser.uid,
        userProfile?.name || userProfile?.firstName + ' ' + userProfile?.lastName || currentUser.email,
        targetUser.name || targetUser.firstName + ' ' + targetUser.lastName,
        userProfile?.role || 'user',
        targetUser.role
      );

      if (result.success) {
        openConversation(result.data);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
    setLoading(false);
  };

  if (!currentUser) return null;

  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton
          size={size}
          color="primary"
          onClick={handleChat}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : <ChatIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default ChatIconButton;

