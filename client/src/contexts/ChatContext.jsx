import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { listenToConversations, getUnreadCount } from '../utils/chatUtils';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    console.error('useChat must be used within a ChatProvider');
    // Return a default context to prevent crashes
    return {
      conversations: [],
      unreadCount: 0,
      isWidgetOpen: false,
      activeConversation: null,
      loading: false,
      openWidget: () => {},
      closeWidget: () => {},
      toggleWidget: () => {},
      openConversation: () => {},
      closeConversation: () => {},
    };
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Listen to conversations in real-time
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToConversations(currentUser.uid, (convs) => {
      console.log('ChatContext - Conversations updated:', convs.length, convs);
      setConversations(convs);
      
      // Calculate total unread count
      const total = convs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setUnreadCount(total);
      
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Refresh unread count periodically
  useEffect(() => {
    if (!currentUser) return;

    const refreshUnreadCount = async () => {
      const result = await getUnreadCount(currentUser.uid);
      if (result.success) {
        setUnreadCount(result.count);
      }
    };

    // Refresh every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const openWidget = () => setIsWidgetOpen(true);
  const closeWidget = () => setIsWidgetOpen(false);
  const toggleWidget = () => setIsWidgetOpen(!isWidgetOpen);

  const openConversation = (conversation) => {
    setActiveConversation(conversation);
    setIsWidgetOpen(true);
  };

  const closeConversation = () => {
    setActiveConversation(null);
  };

  const value = {
    conversations,
    unreadCount,
    isWidgetOpen,
    activeConversation,
    loading,
    openWidget,
    closeWidget,
    toggleWidget,
    openConversation,
    closeConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

