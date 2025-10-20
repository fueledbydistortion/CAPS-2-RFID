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

// Create a new lesson
export const createLesson = async (lessonData) => {
  try {
    const response = await apiRequest('/lessons', {
      method: 'POST',
      body: JSON.stringify(lessonData)
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

// Get all lessons for a skill
export const getAllLessons = async (skillId) => {
  try {
    const response = await apiRequest(`/lessons/skill/${skillId}`);
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

// Get a specific lesson by ID
export const getLessonById = async (lessonId) => {
  try {
    const response = await apiRequest(`/lessons/${lessonId}`);
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

// Update lesson data
export const updateLesson = async (lessonId, updates) => {
  try {
    const response = await apiRequest(`/lessons/${lessonId}`, {
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

// Delete lesson
export const deleteLesson = async (lessonId) => {
  try {
    await apiRequest(`/lessons/${lessonId}`, {
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

// Search lessons by title or description (client-side filtering)
export const searchLessons = async (skillId, searchTerm) => {
  try {
    const response = await apiRequest(`/lessons/skill/${skillId}`);
    if (response.success) {
      const filteredLessons = response.data.filter(lesson => 
        lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return { success: true, data: filteredLessons };
    } else {
      return response;
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Real-time subscription simulation (polling-based)
let pollingInterval = null;
let subscribers = [];

export const subscribeToAllLessons = (skillId, callback) => {
  // Add callback to subscribers
  subscribers.push(callback);

  // Start polling if not already started
  if (!pollingInterval) {
    pollingInterval = setInterval(async () => {
      try {
        const response = await getAllLessons(skillId);
        // Notify all subscribers
        subscribers.forEach(sub => sub(response));
      } catch (error) {
        subscribers.forEach(sub => sub({ success: false, error: error.message }));
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
