import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemButton,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import {
  listenToMessages,
  sendMessageDirect,
  markMessagesAsReadDirect,
  createOrGetConversationDirect,
  deleteConversationDirect
} from '../utils/chatUtils';
import { formatDistanceToNow } from 'date-fns';
import StartChatButton from '../components/StartChatButton';

const MessagingPage = () => {
  const { currentUser, userProfile } = useAuth();
  const {
    conversations,
    unreadCount,
    activeConversation,
    loading: conversationsLoading
  } = useChat();

  // Debug conversations
  useEffect(() => {
    console.log('MessagingPage - Current conversations:', conversations);
    console.log('MessagingPage - Conversations loading:', conversationsLoading);
    console.log('MessagingPage - Current user:', currentUser?.uid);
    console.log('MessagingPage - Active conversation:', activeConversation);
  }, [conversations, conversationsLoading, currentUser, activeConversation]);

  // Handle active conversation from context (same as ChatWidget)
  useEffect(() => {
    if (activeConversation) {
      console.log('MessagingPage - Active conversation set:', activeConversation);
      setSelectedConversation(activeConversation);
      
      // Mark messages as read when conversation is opened from context
      if (currentUser && activeConversation.conversationId) {
        markMessagesAsReadDirect(activeConversation.conversationId, currentUser.uid);
      }
    }
  }, [activeConversation, currentUser]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to messages when a conversation is selected (exact same as ChatWidget)
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    console.log('MessagingPage - Listening to messages for conversation:', selectedConversation.conversationId);
    console.log('MessagingPage - Selected conversation object:', selectedConversation);
    console.log('MessagingPage - Conversation ID type:', typeof selectedConversation.conversationId);
    const unsubscribe = listenToMessages(selectedConversation.conversationId, (msgs) => {
      console.log('MessagingPage - Messages updated:', msgs.length);
      console.log('MessagingPage - Messages array:', msgs);
      setMessages(msgs);
      
      // Mark messages as read when new messages arrive
      if (currentUser && msgs.length > 0) {
        const unreadMessages = msgs.filter(msg => msg.senderId !== currentUser.uid && !msg.read);
        if (unreadMessages.length > 0) {
          console.log('MessagingPage - Marking', unreadMessages.length, 'messages as read');
          markMessagesAsReadDirect(selectedConversation.conversationId, currentUser.uid);
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedConversation, currentUser]);

  // Handle sending message (exact same as ChatWidget)
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUser || sending) return;

    setSending(true);
    console.log('MessagingPage - Sending message to:', selectedConversation.conversationId);
    const result = await sendMessageDirect(
      selectedConversation.conversationId,
      currentUser.uid,
      userProfile?.name || currentUser.email,
      messageText.trim(),
      'text'
    );

    console.log('MessagingPage - Send result:', result);
    if (result.success) {
      setMessageText('');
    }
    setSending(false);
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversation) => {
    console.log('MessagingPage - Selecting conversation:', conversation);
    console.log('MessagingPage - Conversation lastMessage:', conversation.lastMessage);
    console.log('MessagingPage - Conversation unreadCount:', conversation.unreadCount);
    console.log('MessagingPage - Conversation participants:', conversation.participants);
    setSelectedConversation(conversation);
    // Don't call openConversation to avoid opening the chat widget
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    console.log('MessagingPage - Refreshing conversations...');
    console.log('MessagingPage - Current conversations before refresh:', conversations);
    // Force a re-render by updating the conversations state
    setTimeout(() => {
      setRefreshing(false);
      console.log('MessagingPage - Conversations after refresh:', conversations);
    }, 1000);
  };

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (selectedConversation && currentUser) {
      const result = await deleteConversationDirect(
        selectedConversation.conversationId,
        currentUser.uid
      );
      
      if (result.success) {
        setSelectedConversation(null);
        // Don't close conversation widget since we're on the messaging page
      }
    }
    handleCloseMenu();
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Filter conversations based on search (exact same as ChatWidget)
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    
    const otherParticipant = Object.entries(conv.participants).find(
      ([id]) => id !== currentUser?.uid
    );
    
    return otherParticipant?.[1]?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // Get other participant (exact same as ChatWidget)
  const getOtherParticipant = (conversation) => {
    if (!conversation?.participants) return null;
    const otherParticipant = Object.entries(conversation.participants).find(
      ([id]) => id !== currentUser?.uid
    );
    return otherParticipant?.[1];
  };

  // Format message time (exact same as ChatWidget)
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(15px)', 
        border: '2px solid rgba(31, 120, 80, 0.2)', 
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'hsl(152, 65%, 28%)', width: 48, height: 48 }}>
              <ChatIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif', 
                fontWeight: 700, 
                background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                Messaging
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Chat with teachers, parents, and staff
              </Typography>
            </Box>
          </Box>
          <StartChatButton 
            buttonText="New Message" 
            variant="contained"
            openWidget={false}
            onConversationCreated={(conversation) => {
              console.log('MessagingPage - New conversation created:', conversation);
              setSelectedConversation(conversation);
              // Force a small delay to ensure the conversation appears in the list
              setTimeout(() => {
                console.log('MessagingPage - Checking if conversation appears in list...');
                console.log('MessagingPage - Current conversations:', conversations);
              }, 1000);
            }}
          />
        </Box>
      </Paper>

      {/* Main Messaging Area */}
      <Paper sx={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(15px)', 
        border: '2px solid rgba(31, 120, 80, 0.2)', 
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' 
      }}>
        {/* Conversations List - Left Side */}
        <Box sx={{ 
          width: { xs: '100%', md: '350px' }, 
          borderRight: { md: '1px solid rgba(0, 0, 0, 0.12)' },
          display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column'
        }}>
          {/* Search Bar */}
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon sx={{ 
                        color: 'hsl(152, 65%, 28%)',
                        animation: refreshing ? 'spin 1s linear' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                }
              }}
            />
          </Box>

          {/* Conversations List */}
          <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
            {conversationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: 'hsl(152, 65%, 28%)' }} />
              </Box>
            ) : filteredConversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ChatIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Start a new conversation to begin messaging
                </Typography>
              </Box>
            ) : (
              filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const isSelected = selectedConversation?.conversationId === conversation.conversationId;
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <React.Fragment key={conversation.conversationId}>
                    <ListItemButton
                      onClick={() => handleSelectConversation(conversation)}
                      selected={isSelected}
                      sx={{
                        py: 2,
                        px: 2,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(31, 120, 80, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(31, 120, 80, 0.15)'
                          }
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'hsl(152, 65%, 28%)' }}>
                          {otherParticipant?.name?.charAt(0).toUpperCase() || <PersonIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: hasUnread ? 700 : 400,
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                              }}
                            >
                              {otherParticipant?.name || 'Unknown User'}
                            </Typography>
                            {hasUnread && (
                              <Chip 
                                label={conversation.unreadCount} 
                                size="small" 
                                sx={{ 
                                  bgcolor: 'hsl(152, 65%, 28%)', 
                                  color: 'white',
                                  height: 20,
                                  fontSize: '0.7rem'
                                }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: hasUnread ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {conversation.lastMessage?.message || 'No messages yet'}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                );
              })
            )}
          </List>
        </Box>

        {/* Chat Area - Right Side */}
        <Box sx={{ 
          flex: 1, 
          display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column' 
        }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                bgcolor: 'rgba(31, 120, 80, 0.05)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'hsl(152, 65%, 28%)' }}>
                      {getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                        {getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {getOtherParticipant(selectedConversation)?.role || ''}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton onClick={handleOpenMenu}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                  >
                    <MenuItem onClick={handleDeleteConversation}>
                      Delete Conversation
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>

              {/* Messages Area */}
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1
              }}>
                {messages.length === 0 ? (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <ChatIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No messages yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser.uid;
                    return (
                      <Box
                        key={msg.messageId}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            backgroundColor: isOwn ? 'primary.main' : 'grey.200',
                            color: isOwn ? 'white' : 'text.primary',
                            borderRadius: '12px',
                          }}
                        >
                          {!isOwn && (
                            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5, color: 'inherit' }}>
                              {msg.senderName}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ wordBreak: 'break-word', color: 'inherit' }}>
                            {msg.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              opacity: 0.7,
                              fontSize: '0.65rem',
                              color: 'inherit'
                            }}
                          >
                            {formatMessageTime(msg.timestamp)}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color="primary"
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sending}
                          sx={{ 
                            bgcolor: 'hsl(152, 65%, 28%)',
                            color: 'white',
                            '&:hover': { bgcolor: 'hsl(152, 65%, 20%)' },
                            '&:disabled': { bgcolor: 'rgba(0, 0, 0, 0.12)' }
                          }}
                        >
                          {sending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                />
              </Box>
            </>
          ) : (
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              p: 4
            }}>
              <ChatIcon sx={{ fontSize: 120, color: 'text.disabled', mb: 3 }} />
              <Typography variant="h5" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, mb: 1 }}>
                Select a conversation
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose a conversation from the list to start messaging
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MessagingPage;

