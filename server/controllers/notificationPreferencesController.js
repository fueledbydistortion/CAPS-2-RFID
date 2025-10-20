const { db } = require('../config/firebase-admin-config');

/**
 * Default notification preferences for different user roles
 */
const getDefaultPreferences = (userRole) => {
  const basePreferences = {
    // In-app notifications (notification bell)
    inApp: {
      enabled: true,
      announcement: true,
      attendance: true,
      assignment: true,
      badge: true,
      message: true,
      system: true
    },
    // Quiet hours (when not to send notifications)
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00'
    }
  };

  // Role-specific customizations
  if (userRole === 'parent') {
    // Parents typically want to know about everything related to their child
    basePreferences.inApp.attendance = true;
    basePreferences.inApp.assignment = true;
    basePreferences.inApp.announcement = true;
    basePreferences.inApp.badge = true;
  } else if (userRole === 'teacher') {
    // Teachers want notifications about student activities and assignments
    basePreferences.inApp.assignment = true;
    basePreferences.inApp.attendance = true;
    basePreferences.inApp.message = true;
  }

  return basePreferences;
};

/**
 * Get user's notification preferences
 */
const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get preferences from Firebase
    const preferencesSnapshot = await db.ref(`notificationPreferences/${userId}`).once('value');
    
    let preferences;
    if (preferencesSnapshot.exists()) {
      preferences = preferencesSnapshot.val();
    } else {
      // Get user info to determine role for default preferences
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const userRole = userSnapshot.exists() ? userSnapshot.val().role : 'user';
      
      // Set default preferences
      preferences = getDefaultPreferences(userRole);
      preferences.userId = userId;
      preferences.createdAt = new Date().toISOString();
      preferences.updatedAt = new Date().toISOString();
      
      // Save default preferences to database
      await db.ref(`notificationPreferences/${userId}`).set(preferences);
    }

    res.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences: ' + error.message
    });
  }
};

/**
 * Update user's notification preferences
 */
const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate that the requesting user can update these preferences
    if (req.user?.uid !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own notification preferences'
      });
    }

    // Get existing preferences
    const preferencesSnapshot = await db.ref(`notificationPreferences/${userId}`).once('value');
    
    let currentPreferences;
    if (preferencesSnapshot.exists()) {
      currentPreferences = preferencesSnapshot.val();
    } else {
      // Get user info for default preferences
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const userRole = userSnapshot.exists() ? userSnapshot.val().role : 'user';
      currentPreferences = getDefaultPreferences(userRole);
    }

    // Merge updates with current preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...updates,
      userId: userId,
      updatedAt: new Date().toISOString()
    };

    // Ensure createdAt is preserved
    if (!updatedPreferences.createdAt) {
      updatedPreferences.createdAt = new Date().toISOString();
    }

    // Save updated preferences
    await db.ref(`notificationPreferences/${userId}`).set(updatedPreferences);

    console.log('✅ Notification preferences updated for user:', userId);

    res.json({
      success: true,
      data: updatedPreferences,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences: ' + error.message
    });
  }
};

/**
 * Set default preferences for a new user
 */
const setDefaultPreferences = async (req, res) => {
  try {
    const { userId, userRole } = req.body;

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        error: 'User ID and role are required'
      });
    }

    // Check if preferences already exist
    const preferencesSnapshot = await db.ref(`notificationPreferences/${userId}`).once('value');
    
    if (preferencesSnapshot.exists()) {
      return res.json({
        success: true,
        data: preferencesSnapshot.val(),
        message: 'Preferences already exist for this user'
      });
    }

    // Create default preferences
    const preferences = getDefaultPreferences(userRole);
    preferences.userId = userId;
    preferences.createdAt = new Date().toISOString();
    preferences.updatedAt = new Date().toISOString();

    // Save to database
    await db.ref(`notificationPreferences/${userId}`).set(preferences);

    console.log('✅ Default notification preferences set for user:', userId, 'role:', userRole);

    res.status(201).json({
      success: true,
      data: preferences,
      message: 'Default notification preferences created successfully'
    });

  } catch (error) {
    console.error('Error setting default notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set default notification preferences: ' + error.message
    });
  }
};

/**
 * Reset user preferences to default
 */
const resetToDefault = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate that the requesting user can reset these preferences
    if (req.user?.uid !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only reset your own notification preferences'
      });
    }

    // Get user info to determine role
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    const userRole = userSnapshot.exists() ? userSnapshot.val().role : 'user';

    // Create default preferences
    const preferences = getDefaultPreferences(userRole);
    preferences.userId = userId;
    preferences.createdAt = new Date().toISOString();
    preferences.updatedAt = new Date().toISOString();

    // Save to database
    await db.ref(`notificationPreferences/${userId}`).set(preferences);

    console.log('✅ Notification preferences reset to default for user:', userId);

    res.json({
      success: true,
      data: preferences,
      message: 'Notification preferences reset to default successfully'
    });

  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset notification preferences: ' + error.message
    });
  }
};

/**
 * Check if user should receive a specific notification type
 * This is used by other controllers when creating notifications
 */
const shouldReceiveNotification = async (userId, notificationType, channelType = 'inApp') => {
  try {
    const preferencesSnapshot = await db.ref(`notificationPreferences/${userId}`).once('value');
    
    if (!preferencesSnapshot.exists()) {
      // If no preferences exist, assume user wants all notifications
      return true;
    }

    const preferences = preferencesSnapshot.val();
    
    // Check if the channel is enabled
    if (!preferences[channelType] || !preferences[channelType].enabled) {
      return false;
    }

    // Check if the specific notification type is enabled
    return preferences[channelType][notificationType] !== false;

  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // Default to sending notification if there's an error
    return true;
  }
};

/**
 * Internal helper to set default preferences for new users
 * Called from userController when creating users
 */
const setDefaultPreferencesInternal = async (userId, userRole) => {
  try {
    // Check if preferences already exist
    const preferencesSnapshot = await db.ref(`notificationPreferences/${userId}`).once('value');
    
    if (!preferencesSnapshot.exists()) {
      const preferences = getDefaultPreferences(userRole);
      preferences.userId = userId;
      preferences.createdAt = new Date().toISOString();
      preferences.updatedAt = new Date().toISOString();

      await db.ref(`notificationPreferences/${userId}`).set(preferences);
      console.log('✅ Default notification preferences auto-created for user:', userId);
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Error auto-creating notification preferences:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  setDefaultPreferences,
  resetToDefault,
  shouldReceiveNotification,
  setDefaultPreferencesInternal,
  getDefaultPreferences
};
