import { getApiUrl } from "../config/api";
import { auth } from "./firebase-config";

/**
 * Get Firebase ID token
 * @param {boolean} forceRefresh - Whether to force token refresh
 */
const getAuthToken = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user found");
    throw new Error("User not authenticated");
  }
  try {
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw new Error("Failed to get authentication token");
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...options,
  };

  try {
    const response = await fetch(getApiUrl(endpoint), config);
    const data = await response.json();

    if (!response.ok) {
      // Handle 404 specifically for kiosk endpoints
      if (response.status === 404 && endpoint.includes("kiosk")) {
        console.warn(
          "Kiosk endpoints not available on server. This feature may not be deployed yet."
        );
        return {
          success: false,
          error:
            "Kiosk mode is not available on this server. Please contact your administrator.",
          notDeployed: true,
        };
      }
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Kiosk API request failed:", error);
    throw error;
  }
};

export const createKioskSession = async (scheduleId) => {
  try {
    const result = await apiRequest("kiosk/create", {
      method: "POST",
      body: JSON.stringify({ scheduleId }),
    });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getKioskSession = async () => {
  try {
    const result = await apiRequest("kiosk/current");
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const endKioskSession = async () => {
  try {
    const result = await apiRequest("kiosk/end", {
      method: "POST",
    });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const validateKioskSession = async (sessionId) => {
  try {
    const result = await apiRequest(`kiosk/validate/${sessionId}`);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getKioskSessionByToken = async (sessionId) => {
  try {
    const result = await apiRequest(`kiosk/session/${sessionId}`);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
