import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Tooltip,
  MenuItem,
  Menu
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle,
  CheckCircle,
  DoneAll,
  DeleteSweep,
  MoreVert,
  Delete,
  Announcement,
  Event,
  Assignment,
  EmojiEvents,
  Message,
  Info,
  CheckCircleOutline
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount
} from '../utils/notificationService';

const NotificationDropdown = ({ onUnreadCountChange }) => {
  const { userProfile } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    if (userProfile?.uid) {
      loadNotifications();
      loadUnreadCount();

      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userProfile]);

  const loadNotifications = async () => {
    if (!userProfile?.uid) return;

    setLoading(true);
    try {
      const result = await getUserNotifications(userProfile.uid, { limit: 10 });
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!userProfile?.uid) return;

    try {
      const result = await getUnreadCount(userProfile.uid);
      if (result.success) {
        setUnreadCount(result.count);
        if (onUnreadCountChange) {
          onUnreadCountChange(result.count);
        }
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      loadNotifications();
      loadUnreadCount();
    }
    
    // If there's an action URL, navigate to it
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleContextMenu = (event, notification) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setSelectedNotification(notification);
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = async () => {
    if (selectedNotification) {
      await markAsRead(selectedNotification.id);
      loadNotifications();
      loadUnreadCount();
    }
    handleContextMenuClose();
  };

  const handleDeleteNotification = async () => {
    if (selectedNotification) {
      await deleteNotification(selectedNotification.id);
      loadNotifications();
      loadUnreadCount();
    }
    handleContextMenuClose();
  };

  const handleMarkAllAsRead = async () => {
    if (userProfile?.uid) {
      await markAllAsRead(userProfile.uid);
      loadNotifications();
      loadUnreadCount();
    }
  };

  const handleDeleteAll = async () => {
    if (userProfile?.uid) {
      await deleteAllNotifications(userProfile.uid);
      loadNotifications();
      loadUnreadCount();
    }
  };

  const getNotificationIcon = (type) => {
    const iconProps = { sx: { fontSize: 20 } };
    switch (type) {
      case 'announcement':
        return <Announcement {...iconProps} sx={{ ...iconProps.sx, color: '#2196f3' }} />;
      case 'attendance':
        return <CheckCircleOutline {...iconProps} sx={{ ...iconProps.sx, color: '#4caf50' }} />;
      case 'assignment':
        return <Assignment {...iconProps} sx={{ ...iconProps.sx, color: '#ff9800' }} />;
      case 'badge':
        return <EmojiEvents {...iconProps} sx={{ ...iconProps.sx, color: '#ffd700' }} />;
      case 'message':
        return <Message {...iconProps} sx={{ ...iconProps.sx, color: '#9c27b0' }} />;
      case 'system':
        return <Info {...iconProps} sx={{ ...iconProps.sx, color: '#607d8b' }} />;
      default:
        return <NotificationsIcon {...iconProps} sx={{ ...iconProps.sx, color: 'hsl(152, 65%, 28%)' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'normal':
        return '#1976d2';
      case 'low':
        return '#757575';
      default:
        return '#1976d2';
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          sx={{
            color: 'hsl(152, 65%, 28%)',
            '&:hover': {
              backgroundColor: 'rgba(31, 120, 80, 0.1)'
            }
          }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(31, 120, 80, 0.2)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(31, 120, 80, 0.3)'
          }
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          background: 'linear-gradient(to right, rgba(31, 120, 80, 0.05), rgba(31, 120, 80, 0.02))'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: 'hsl(152, 65%, 28%)',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              Notifications
            </Typography>
            <Box display="flex" gap={0.5}>
              <Tooltip title="Mark all as read">
                <IconButton 
                  size="small" 
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  sx={{ 
                    color: 'hsl(152, 65%, 28%)',
                    '&:hover': { backgroundColor: 'rgba(31, 120, 80, 0.1)' }
                  }}
                >
                  <DoneAll fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete all">
                <IconButton 
                  size="small" 
                  onClick={handleDeleteAll}
                  disabled={notifications.length === 0}
                  sx={{ 
                    color: '#d32f2f',
                    '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' }
                  }}
                >
                  <DeleteSweep fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Notifications List */}
        <Box sx={{ maxHeight: 450, overflowY: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress size={40} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'rgba(31, 120, 80, 0.2)', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                We'll notify you when something arrives
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    onContextMenu={(e) => handleContextMenu(e, notification)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: notification.read 
                        ? 'transparent' 
                        : 'rgba(31, 120, 80, 0.05)',
                      borderLeft: `3px solid ${getPriorityColor(notification.priority)}`,
                      '&:hover': {
                        backgroundColor: notification.read 
                          ? 'rgba(31, 120, 80, 0.03)' 
                          : 'rgba(31, 120, 80, 0.08)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          backgroundColor: notification.read 
                            ? 'rgba(31, 120, 80, 0.05)' 
                            : 'rgba(31, 120, 80, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Box>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.read ? 500 : 700,
                              color: 'hsl(152, 65%, 28%)',
                              fontSize: '0.875rem',
                              flex: 1
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Circle sx={{ fontSize: 8, color: '#2196f3' }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.75rem',
                              mb: 0.5
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
                            <Chip
                              label={notification.type}
                              size="small"
                              sx={{
                                textTransform: 'capitalize',
                                fontSize: '0.65rem',
                                height: 18,
                                backgroundColor: 'rgba(31, 120, 80, 0.1)',
                                color: 'hsl(152, 65%, 28%)'
                              }}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, notification);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ 
            p: 1.5, 
            borderTop: '1px solid rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.75rem' }}
            >
              Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Popover>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {selectedNotification && !selectedNotification.read && (
          <MenuItem onClick={handleMarkAsRead}>
            <ListItemIcon>
              <CheckCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText>Mark as read</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteNotification}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationDropdown;

