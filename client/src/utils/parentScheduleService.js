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

// Get schedules assigned to a specific parent (through their children)
export const getParentSchedules = async (parentId) => {
  try {
    const response = await apiRequest(`/schedules/parent/${parentId}`);
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

// Get parent's children schedules for a specific day
export const getParentSchedulesByDay = async (parentId, day) => {
  try {
    const response = await apiRequest(`/schedules/parent/${parentId}/day/${encodeURIComponent(day)}`);
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

// Get attendance history for parent's children
export const getParentChildrenAttendanceHistory = async (parentId, days = 30) => {
  try {
    const response = await apiRequest(`/attendance/parent/${parentId}/history?days=${days}`);
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

// Mark attendance for parent's child via QR code
export const markAttendanceViaQR = async (qrData, parentId, attendanceType, notes = '') => {
  try {
    // Get current time from client (browser timezone)
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    console.log('Sending client time to server:', currentTime);

    const response = await apiRequest('/schedules/parent/attendance/qr-mark', {
      method: 'POST',
      body: JSON.stringify({
        qrData,
        parentId,
        attendanceType, // 'timeIn' or 'timeOut'
        notes,
        currentTime // Send client's current time
      })
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

// Get today's attendance status for parent's children
export const getTodayAttendanceStatus = async (parentId) => {
  try {
    const response = await apiRequest(`/attendance/parent/${parentId}/today`);
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
