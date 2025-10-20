import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  InputAdornment,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { createOrGetConversationDirect } from '../utils/chatUtils';
import { getApiUrl } from '../config/api';

const StartChatButton = ({ 
  buttonText = 'Start Chat', 
  variant = 'contained', 
  size = 'medium',
  onConversationCreated = null,
  openWidget = true
}) => {
  const { currentUser, userProfile } = useAuth();
  const { openConversation } = useChat();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    await fetchUsers();
  };

  const handleClose = () => {
    setOpen(false);
    setSearchQuery('');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(getApiUrl('users'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Handle both array response and object with data property
        let usersData = Array.isArray(result) ? result : (result.data || result.users || []);
        
        // Make sure we have an array
        if (!Array.isArray(usersData)) {
          console.error('Invalid users data format:', result);
          usersData = [];
        }
        
        // Filter out current user and filter by role
        const filteredUsers = usersData.filter(user => {
          const userId = user.id || user.uid;
          if (userId === currentUser.uid) return false;
          
          // Admin can chat with everyone (teachers and parents)
          if (userProfile?.role === 'admin') {
            return user.role === 'teacher' || user.role === 'parent';
          }
          // Teachers can chat with parents and admins
          else if (userProfile?.role === 'teacher') {
            return user.role === 'parent' || user.role === 'admin';
          } 
          // Parents can chat with teachers and admins
          else if (userProfile?.role === 'parent') {
            return user.role === 'teacher' || user.role === 'admin';
          }
          return false;
        });
        
        // Normalize user data to ensure consistent format
        const normalizedUsers = filteredUsers.map(user => ({
          id: user.id || user.uid,
          uid: user.uid || user.id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          role: user.role
        }));
        
        setUsers(normalizedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleStartChat = async (user) => {
    setCreating(true);
    try {
      const currentUserName = userProfile?.name || 
                             `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 
                             currentUser.email;
      
      console.log('Starting chat with:', {
        targetUser: user,
        currentUserId: currentUser.uid,
        currentUserName
      });
      
      const result = await createOrGetConversationDirect(
        currentUser.uid,
        user.id || user.uid,
        currentUserName,
        user.name,
        userProfile?.role || 'user',
        user.role
      );

      console.log('Conversation creation result:', result);

      if (result.success && result.data) {
        handleClose();
        
        // If onConversationCreated callback is provided, use it instead
        if (onConversationCreated) {
          onConversationCreated(result.data);
        } 
        // Otherwise, open the chat widget (default behavior)
        else if (openWidget) {
          setTimeout(() => {
            console.log('Opening conversation:', result.data);
            openConversation(result.data);
          }, 100);
        }
      } else {
        console.error('Failed to create conversation:', result);
        alert('Failed to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Error starting chat. Please check console for details.');
    }
    setCreating(false);
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    return user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <Button
        variant={variant}
        size={size}
        startIcon={<ChatIcon />}
        onClick={handleOpen}
      >
        {buttonText}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Start a New Conversation</DialogTitle>
        <DialogContent>
          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Users List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3,
              }}
            >
              <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" align="center">
                {searchQuery
                  ? 'No users found'
                  : userProfile?.role === 'admin'
                  ? 'No teachers or parents available'
                  : userProfile?.role === 'teacher'
                  ? 'No parents available'
                  : 'No teachers available'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredUsers.map((user) => (
                <ListItemButton
                  key={user.id}
                  onClick={() => handleStartChat(user)}
                  disabled={creating}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{user.name}</Typography>
                        <Chip
                          label={user.role}
                          size="small"
                          color={
                            user.role === 'admin' ? 'error' : 
                            user.role === 'teacher' ? 'primary' : 
                            'secondary'
                          }
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={user.email}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StartChatButton;

