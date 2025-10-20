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

// Get all attendance records with optional filters
export const getAllAttendance = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.sectionId) queryParams.append('sectionId', filters.sectionId);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/attendance?${queryString}` : '/attendance';
    
    const response = await apiRequest(endpoint);
    return {
      success: true,
      data: response.data,
      count: response.count
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get attendance for a specific schedule
export const getAttendanceBySchedule = async (scheduleId) => {
  try {
    const response = await apiRequest(`/attendance/schedule/${scheduleId}`);
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

// Mark attendance for a student
export const markAttendance = async (attendanceData) => {
  try {
    const response = await apiRequest('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
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

// Get student attendance history
export const getStudentAttendanceHistory = async (studentId, days = 30) => {
  try {
    const response = await apiRequest(`/attendance/student/${studentId}/history?days=${days}`);
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
