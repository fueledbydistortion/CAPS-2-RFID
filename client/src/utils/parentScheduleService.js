import { API_BASE_URL } from "../config/api";

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log("🔍 DEBUG: API Request - Full URL:", url);
    console.log("🔍 DEBUG: API Request - Options:", options);

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    console.log("🔍 DEBUG: API Request - Config:", config);

    const response = await fetch(url, config);
    console.log("🔍 DEBUG: API Response - Status:", response.status);
    console.log("🔍 DEBUG: API Response - Status Text:", response.statusText);
    console.log("🔍 DEBUG: API Response - Headers:", response.headers);

    const data = await response.json();
    console.log("🔍 DEBUG: API Response - Data:", data);

    if (!response.ok) {
      console.error(
        "🔍 DEBUG: API Error - Response not OK:",
        response.status,
        data
      );
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("🔍 DEBUG: API Request Error:", error);
    throw error;
  }
};

// Get schedules assigned to a specific parent (through their children)
export const getParentSchedules = async (parentId) => {
  try {
    const response = await apiRequest(`/schedules/parent/${parentId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get parent's children schedules for a specific day
export const getParentSchedulesByDay = async (parentId, day) => {
  try {
    const response = await apiRequest(
      `/schedules/parent/${parentId}/day/${encodeURIComponent(day)}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get attendance history for parent's children
export const getParentChildrenAttendanceHistory = async (
  parentId,
  days = 30
) => {
  try {
    const response = await apiRequest(
      `/attendance/parent/${parentId}/history?days=${days}`
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Mark attendance for parent's child via QR code
export const markAttendanceViaQR = async (
  qrData,
  parentId,
  attendanceType,
  notes = ""
) => {
  try {
    // Get current time from client (browser timezone)
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log("Client time generation:", {
      currentTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateObject: new Date(),
      localTimeString: new Date().toLocaleTimeString(),
      utcTime: new Date().toISOString(),
      utcTimeString: new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }),
    });

    console.log(
      "🔍 DEBUG: Client - Making RFID request to:",
      "/schedules/parent/attendance/rfid-mark"
    );
    console.log("🔍 DEBUG: Client - Request data:", {
      qrData,
      parentId,
      attendanceType,
      notes,
      currentTime,
    });

    const response = await apiRequest(
      "/schedules/parent/attendance/rfid-mark",
      {
        method: "POST",
        body: JSON.stringify({
          qrData,
          parentId,
          attendanceType, // 'timeIn' or 'timeOut'
          notes,
          currentTime, // Send client's current time
        }),
      }
    );

    console.log("🔍 DEBUG: Client - Response received:", response);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get today's attendance status for parent's children
export const getTodayAttendanceStatus = async (parentId) => {
  try {
    const response = await apiRequest(`/attendance/parent/${parentId}/today`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
