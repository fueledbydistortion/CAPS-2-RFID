import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore,
  Notifications,
  Restore,
  Save,
  Info,
  Schedule,
  VolumeOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  resetNotificationPreferencesToDefault,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
  getDefaultPreferencesStructure
} from '../utils/notificationPreferencesService';

const NotificationSettings = () => {
  const { userProfile } = useAuth();
  const [preferences, setPreferences] = useState(getDefaultPreferencesStructure());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load user preferences on component mount
  useEffect(() => {
    if (userProfile?.uid) {
      loadPreferences();
    }
  }, [userProfile]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const result = await getUserNotificationPreferences(userProfile.uid);
      if (result.success) {
        setPreferences(result.data);
      } else {
        showSnackbar('Error loading notification preferences: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Failed to load notification preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const result = await updateUserNotificationPreferences(userProfile.uid, preferences);
      if (result.success) {
        showSnackbar('Notification preferences saved successfully!', 'success');
      } else {
        showSnackbar('Error saving preferences: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Failed to save notification preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setSaving(true);
    try {
      const result = await resetNotificationPreferencesToDefault(userProfile.uid);
      if (result.success) {
        setPreferences(result.data);
        showSnackbar('Notification preferences reset to default!', 'success');
      } else {
        showSnackbar('Error resetting preferences: ' + result.error, 'error');
      }
    } catch (error) {
      showSnackbar('Failed to reset notification preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChannelToggle = (channel, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        enabled
      }
    }));
  };

  const handleNotificationTypeToggle = (channel, type, enabled) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: enabled
      }
    }));
  };

  const handleQuietHoursToggle = (enabled) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'inApp':
        return <Notifications />;
      default:
        return <Notifications />;
    }
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case 'inApp':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const getRelevantNotificationTypes = () => {
    // Show different notification types based on user role
    const allTypes = Object.keys(NOTIFICATION_TYPE_LABELS);
    
    if (userProfile?.role === 'parent') {
      // Parents are most interested in attendance, announcements, assignments, and badges
      return allTypes.filter(type => ['attendance', 'announcement', 'assignment', 'badge', 'message'].includes(type));
    } else if (userProfile?.role === 'teacher') {
      // Teachers are interested in assignments, messages, and system notifications
      return allTypes.filter(type => ['assignment', 'message', 'announcement', 'system'].includes(type));
    }
    
    return allTypes;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const relevantTypes = getRelevantNotificationTypes();

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, hsl(152, 65%, 28%) 0%, hsl(152, 65%, 35%) 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Notifications sx={{ color: 'white', mr: 2, fontSize: 32 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Notification Settings
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Customize how and when you receive notifications about your {userProfile?.role === 'parent' ? "child's activities" : "teaching activities"}.
        </Typography>
      </Paper>

      {/* Role-specific information */}
      <Alert 
        severity="info" 
        sx={{ mb: 3 }}
        icon={<Info />}
      >
        <Typography variant="body2">
          {userProfile?.role === 'parent' 
            ? "As a parent, you can choose to receive notifications about your child's attendance, assignments, achievements, and important school announcements."
            : "As a teacher, you can customize notifications for student activities, assignments, messages, and system updates."
          }
        </Typography>
      </Alert>

      {/* Notification Channels */}
      <Grid container spacing={3}>
        {Object.entries(NOTIFICATION_CHANNEL_LABELS).map(([channel, channelInfo]) => (
          <Grid item xs={12} key={channel}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getChannelIcon(channel)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {channelInfo.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {channelInfo.description}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences[channel]?.enabled || false}
                        onChange={(e) => handleChannelToggle(channel, e.target.checked)}
                        color={getChannelColor(channel)}
                      />
                    }
                    label={preferences[channel]?.enabled ? 'Enabled' : 'Disabled'}
                  />
                </Box>

                {/* Show notification types if channel is enabled */}
                {preferences[channel]?.enabled && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                      Notification Types:
                    </Typography>
                    <Grid container spacing={2}>
                      {relevantTypes.map(type => (
                        <Grid item xs={12} sm={6} md={4} key={type}>
                          <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="body2" sx={{ mr: 1, fontSize: '1.2em' }}>
                                {NOTIFICATION_TYPE_LABELS[type].icon}
                              </Typography>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {NOTIFICATION_TYPE_LABELS[type].label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  {NOTIFICATION_TYPE_LABELS[type].description}
                                </Typography>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      size="small"
                                      checked={preferences[channel]?.[type] !== false}
                                      onChange={(e) => handleNotificationTypeToggle(channel, type, e.target.checked)}
                                      color={getChannelColor(channel)}
                                    />
                                  }
                                  label=""
                                />
                              </Box>
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}

              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quiet Hours Settings */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <VolumeOff sx={{ mr: 2, color: 'text.secondary' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Quiet Hours
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set specific hours when you don't want to receive notifications
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.quietHours?.enabled || false}
                  onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                  color="warning"
                />
              }
              label={preferences.quietHours?.enabled ? 'Enabled' : 'Disabled'}
            />
          </Box>

          {preferences.quietHours?.enabled && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Start Time"
                    type="time"
                    value={preferences.quietHours?.startTime || '22:00'}
                    onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="End Time"
                    type="time"
                    value={preferences.quietHours?.endTime || '07:00'}
                    onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    <Typography variant="caption">
                      No notifications will be sent during these hours
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          onClick={savePreferences}
          disabled={saving}
          size="large"
          sx={{
            background: 'linear-gradient(135deg, hsl(152, 65%, 28%) 0%, hsl(152, 65%, 35%) 100%)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 600,
            px: 4
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Restore />}
          onClick={resetToDefault}
          disabled={saving}
          size="large"
          sx={{
            borderColor: 'hsl(152, 65%, 28%)',
            color: 'hsl(152, 65%, 28%)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 600,
            px: 4,
            '&:hover': {
              borderColor: 'hsl(152, 65%, 35%)',
              backgroundColor: 'rgba(59, 130, 246, 0.04)'
            }
          }}
        >
          Reset to Default
        </Button>
      </Box>

      {/* Information footer */}
      <Paper sx={{ mt: 4, p: 3, backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Your notification preferences are saved automatically and will take effect immediately.
          You can change these settings at any time.
        </Typography>
      </Paper>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettings;
