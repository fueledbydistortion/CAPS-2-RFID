import { API_BASE_URL } from '../config/api';
import { auth } from './firebase-config';

/**
 * Get user's notification preferences
 */
export const getUserNotificationPreferences = async (userId, retryCount = 0) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only force refresh on retry
    const token = await user.getIdToken(retryCount > 0);

    const response = await fetch(`${API_BASE_URL}/notification-preferences/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Retry once with fresh token if we get 401
      if (response.status === 401 && retryCount === 0) {
        return getUserNotificationPreferences(userId, 1);
      }
      const result = await response.json().catch(() => ({ error: 'Failed to fetch notification preferences' }));
      throw new Error(result.error || `Failed to fetch notification preferences (${response.status})`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch notification preferences'
    };
  }
};

/**
 * Update user's notification preferences
 */
export const updateUserNotificationPreferences = async (userId, preferences, retryCount = 0) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only force refresh on retry
    const token = await user.getIdToken(retryCount > 0);

    const response = await fetch(`${API_BASE_URL}/notification-preferences/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      // Retry once with fresh token if we get 401
      if (response.status === 401 && retryCount === 0) {
        return updateUserNotificationPreferences(userId, preferences, 1);
      }
      const result = await response.json().catch(() => ({ error: 'Failed to update notification preferences' }));
      throw new Error(result.error || `Failed to update notification preferences (${response.status})`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message
    };

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: error.message || 'Failed to update notification preferences'
    };
  }
};

/**
 * Reset user's notification preferences to default
 */
export const resetNotificationPreferencesToDefault = async (userId, retryCount = 0) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only force refresh on retry
    const token = await user.getIdToken(retryCount > 0);

    const response = await fetch(`${API_BASE_URL}/notification-preferences/user/${userId}/reset`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Retry once with fresh token if we get 401
      if (response.status === 401 && retryCount === 0) {
        return resetNotificationPreferencesToDefault(userId, 1);
      }
      const result = await response.json().catch(() => ({ error: 'Failed to reset notification preferences' }));
      throw new Error(result.error || `Failed to reset notification preferences (${response.status})`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message
    };

  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset notification preferences'
    };
  }
};

/**
 * Set default notification preferences for a new user
 */
export const setDefaultNotificationPreferences = async (userId, userRole, retryCount = 0) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only force refresh on retry
    const token = await user.getIdToken(retryCount > 0);

    const response = await fetch(`${API_BASE_URL}/notification-preferences/default`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, userRole })
    });

    if (!response.ok) {
      // Retry once with fresh token if we get 401
      if (response.status === 401 && retryCount === 0) {
        return setDefaultNotificationPreferences(userId, userRole, 1);
      }
      const result = await response.json().catch(() => ({ error: 'Failed to set default notification preferences' }));
      throw new Error(result.error || `Failed to set default notification preferences (${response.status})`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result.data,
      message: result.message
    };

  } catch (error) {
    console.error('Error setting default notification preferences:', error);
    return {
      success: false,
      error: error.message || 'Failed to set default notification preferences'
    };
  }
};

/**
 * Notification type labels for UI display
 */
export const NOTIFICATION_TYPE_LABELS = {
  announcement: {
    label: 'Announcements',
    description: 'School announcements, events, and important notices',
    icon: '📢'
  },
  attendance: {
    label: 'Attendance',
    description: 'Student attendance tracking and updates',
    icon: '✓'
  },
  assignment: {
    label: 'Assignments',
    description: 'New assignments, submissions, and grades',
    icon: '📝'
  },
  badge: {
    label: 'Badges & Achievements',
    description: 'Badge awards and student achievements',
    icon: '🏆'
  },
  message: {
    label: 'Messages',
    description: 'Direct messages and chat notifications',
    icon: '💬'
  },
  system: {
    label: 'System Notifications',
    description: 'System updates and important information',
    icon: 'ℹ️'
  }
};

/**
 * Notification channel labels for UI display
 */
export const NOTIFICATION_CHANNEL_LABELS = {
  inApp: {
    label: 'In-App Notifications',
    description: 'Notifications shown in the application bell icon',
    icon: '🔔'
  }
};

/**
 * Default preferences structure for frontend initialization
 */
export const getDefaultPreferencesStructure = () => ({
  inApp: {
    enabled: true,
    announcement: true,
    attendance: true,
    assignment: true,
    badge: true,
    message: true,
    system: true
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  }
});
