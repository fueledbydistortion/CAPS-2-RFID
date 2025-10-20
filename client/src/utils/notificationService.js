import { API_BASE_URL } from '../config/api';
import { auth } from './firebase-config';

/**
 * Get Firebase ID token
 * @param {boolean} forceRefresh - Whether to force token refresh
 */
const getAuthToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting auth token:', error);
    throw new Error('Failed to get authentication token');
  }
};

/**
 * Create a new notification
 */
export const createNotification = async (notificationData) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(notificationData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create notification');
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (userId, params = {}, retryCount = 0) => {
  try {
    const token = await getAuthToken(retryCount > 0);
    const queryParams = new URLSearchParams();
    
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/notifications/user/${userId}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Retry once with fresh token if we get 401
      if (response.status === 401 && retryCount === 0) {
        return getUserNotifications(userId, params, 1);
      }
      const data = await response.json().catch(() => ({ error: 'Failed to fetch notifications' }));
      throw new Error(data.error || `Failed to fetch notifications (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId, retryCount = 0) => {
  try {
    const token = await getAuthToken(retryCount > 0);
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Retry once with fresh token if we get 401
      if (response.status === 401 && retryCount === 0) {
        return getUnreadCount(userId, 1);
      }
      const data = await response.json().catch(() => ({ error: 'Failed to fetch unread count' }));
      throw new Error(data.error || `Failed to fetch unread count (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return {
      success: false,
      error: error.message,
      count: 0
    };
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark notification as read');
    }

    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark all notifications as read');
    }

    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete notification');
    }

    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}/all`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete all notifications');
    }

    return data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Broadcast notification to multiple users
 */
export const broadcastNotification = async (notificationData) => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(notificationData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to broadcast notification');
    }

    return data;
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

