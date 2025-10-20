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

// Create a new section
export const createSection = async (sectionData) => {
  try {
    const response = await apiRequest('/sections', {
      method: 'POST',
      body: JSON.stringify(sectionData)
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

// Get all sections
export const getAllSections = async () => {
  try {
    const response = await apiRequest('/sections');
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

// Get a specific section by ID
export const getSectionById = async (sectionId) => {
  try {
    const response = await apiRequest(`/sections/${sectionId}`);
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

// Update section data
export const updateSection = async (sectionId, updates) => {
  try {
    const response = await apiRequest(`/sections/${sectionId}`, {
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

// Delete section
export const deleteSection = async (sectionId) => {
  try {
    await apiRequest(`/sections/${sectionId}`, {
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

// Add student to section
export const addStudentToSection = async (sectionId, studentId) => {
  try {
    const response = await apiRequest(`/sections/${sectionId}/students`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
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

// Remove student from section
export const removeStudentFromSection = async (sectionId, studentId) => {
  try {
    const response = await apiRequest(`/sections/${sectionId}/students/${studentId}`, {
      method: 'DELETE'
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

// Get sections by grade
export const getSectionsByGrade = async (grade) => {
  try {
    const response = await apiRequest(`/sections/grade/${encodeURIComponent(grade)}`);
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

// Search sections by name or grade (client-side filtering)
export const searchSections = async (searchTerm) => {
  try {
    const response = await apiRequest('/sections');
    if (response.success) {
      const filteredSections = response.data.filter(section => 
        section.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.grade?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return { success: true, data: filteredSections };
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

export const subscribeToAllSections = (callback) => {
  // Add callback to subscribers
  subscribers.push(callback);

  // Start polling if not already started
  if (!pollingInterval) {
    pollingInterval = setInterval(async () => {
      try {
        const response = await getAllSections();
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

// Legacy function for backward compatibility (removed status field)
export const updateSectionStatus = async (sectionId, status) => {
  console.warn('updateSectionStatus is deprecated - status field has been removed');
  return { success: true };
};