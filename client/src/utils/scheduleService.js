import { API_BASE_URL } from "../config/api";

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log("🌐 [apiRequest] Making request to:", url);
    console.log("🌐 [apiRequest] API_BASE_URL:", API_BASE_URL);
    console.log("🌐 [apiRequest] Endpoint:", endpoint);

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    console.log("🌐 [apiRequest] Request config:", config);

    const response = await fetch(url, config);
    console.log("🌐 [apiRequest] Response status:", response.status);
    console.log(
      "🌐 [apiRequest] Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    const data = await response.json();
    console.log("🌐 [apiRequest] Response data:", data);

    if (!response.ok) {
      console.error("❌ [apiRequest] Request failed:", {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    console.log("✅ [apiRequest] Request successful");
    return data;
  } catch (error) {
    console.error("❌ [apiRequest] API request error:", error);
    console.error("❌ [apiRequest] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw error;
  }
};

// Create a new schedule
export const createSchedule = async (scheduleData) => {
  try {
    const response = await apiRequest("/schedules", {
      method: "POST",
      body: JSON.stringify(scheduleData),
    });

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

// Get all schedules
export const getAllSchedules = async () => {
  try {
    console.log("🔍 [getAllSchedules] Starting to fetch schedules from API...");
    const response = await apiRequest("/schedules");
    console.log("🔍 [getAllSchedules] API response:", response);

    if (response && response.data) {
      console.log("🔍 [getAllSchedules] Schedules data:", response.data);
      console.log(
        "🔍 [getAllSchedules] Schedules count:",
        response.data.length
      );
      console.log(
        "🔍 [getAllSchedules] Schedule days:",
        response.data.map((s) => s.day)
      );
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ [getAllSchedules] Error:", error);
    console.error("❌ [getAllSchedules] Error details:", {
      message: error.message,
      status: error.status,
      response: error.response,
    });
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get a specific schedule by ID
export const getScheduleById = async (scheduleId) => {
  try {
    const response = await apiRequest(`/schedules/${scheduleId}`);
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

// Update schedule data
export const updateSchedule = async (scheduleId, updates) => {
  try {
    const response = await apiRequest(`/schedules/${scheduleId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

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

// Delete schedule
export const deleteSchedule = async (scheduleId) => {
  try {
    await apiRequest(`/schedules/${scheduleId}`, {
      method: "DELETE",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get schedules by day
export const getSchedulesByDay = async (day) => {
  try {
    const response = await apiRequest(
      `/schedules/day/${encodeURIComponent(day)}`
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

// Get schedules by section
export const getSchedulesBySection = async (sectionId) => {
  try {
    const response = await apiRequest(`/schedules/section/${sectionId}`);
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

// Search schedules (client-side filtering)
export const searchSchedules = async (searchTerm) => {
  try {
    const response = await apiRequest("/schedules");
    if (response.success) {
      const filteredSchedules = response.data.filter(
        (schedule) =>
          schedule.day?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.timeIn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.timeOut?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return { success: true, data: filteredSchedules };
    } else {
      return response;
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Real-time subscription simulation (polling-based)
let pollingInterval = null;
let subscribers = [];

export const subscribeToAllSchedules = (callback) => {
  // Add callback to subscribers
  subscribers.push(callback);

  // Start polling if not already started
  if (!pollingInterval) {
    pollingInterval = setInterval(async () => {
      try {
        const response = await getAllSchedules();
        // Notify all subscribers
        subscribers.forEach((sub) => sub(response));
      } catch (error) {
        subscribers.forEach((sub) =>
          sub({ success: false, error: error.message })
        );
      }
    }, 2000); // Poll every 2 seconds
  }

  // Return unsubscribe function
  return () => {
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }

    // Stop polling if no more subscribers
    if (subscribers.length === 0 && pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
};
