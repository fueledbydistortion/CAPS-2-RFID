import { API_BASE_URL } from '../config/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Create a new announcement
export const createAnnouncement = async (announcementData) => {
  try {
    const response = await apiRequest('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData)
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all announcements
export const getAllAnnouncements = async () => {
  try {
    const response = await apiRequest('/announcements');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get a specific announcement by ID
export const getAnnouncementById = async (announcementId) => {
  try {
    const response = await apiRequest(`/announcements/${announcementId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Update announcement data
export const updateAnnouncement = async (announcementId, updates) => {
  try {
    const response = await apiRequest(`/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete announcement
export const deleteAnnouncement = async (announcementId) => {
  try {
    await apiRequest(`/announcements/${announcementId}`, {
      method: 'DELETE'
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get announcements by date
export const getAnnouncementsByDate = async (date) => {
  try {
    const response = await apiRequest(`/announcements/date/${encodeURIComponent(date)}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get announcements by date range
export const getAnnouncementsByDateRange = async (startDate, endDate) => {
  try {
    const response = await apiRequest(`/announcements/range?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

