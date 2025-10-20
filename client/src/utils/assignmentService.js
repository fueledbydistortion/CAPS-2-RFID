import { API_BASE_URL } from '../config/api';

// Helper function to get Firebase ID token
const getIdToken = async () => {
  try {
    const { getCurrentUser } = await import('./firebase-auth');
    const user = getCurrentUser();
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// Helper function to make API requests with authentication
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const idToken = await getIdToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && { 'Authorization': `Bearer ${idToken}` }),
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

// Create a new assignment
export const createAssignment = async (assignmentData) => {
  try {
    const response = await apiRequest('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
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

// Get all assignments for a skill
export const getAllAssignments = async (skillId) => {
  try {
    const response = await apiRequest(`/assignments/skill/${skillId}`);
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

// Get a specific assignment by ID
export const getAssignmentById = async (assignmentId) => {
  try {
    const response = await apiRequest(`/assignments/${assignmentId}`);
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

// Update assignment data
export const updateAssignment = async (assignmentId, updates) => {
  try {
    const response = await apiRequest(`/assignments/${assignmentId}`, {
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

// Delete assignment
export const deleteAssignment = async (assignmentId) => {
  try {
    await apiRequest(`/assignments/${assignmentId}`, {
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

// Search assignments by title or description (client-side filtering)
export const searchAssignments = async (skillId, searchTerm) => {
  try {
    const response = await apiRequest(`/assignments/skill/${skillId}`);
    if (response.success) {
      const filteredAssignments = response.data.filter(assignment => 
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.instructions?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return { success: true, data: filteredAssignments };
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

// Get assignments by type
export const getAssignmentsByType = async (skillId, type) => {
  try {
    const response = await apiRequest(`/assignments/skill/${skillId}/type/${type}`);
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

// Get assignments due soon (within specified days)
export const getAssignmentsDueSoon = async (skillId, days = 7) => {
  try {
    const response = await apiRequest(`/assignments/skill/${skillId}/due-soon?days=${days}`);
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

// Submit assignment (for parents)
export const submitAssignment = async (submissionData) => {
  try {
    const response = await apiRequest('/assignments/submit', {
      method: 'POST',
      body: JSON.stringify(submissionData)
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

// Get assignment submissions (for teachers)
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    const response = await apiRequest(`/assignments/${assignmentId}/submissions`);
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

// Grade assignment submission (for teachers)
export const gradeAssignmentSubmission = async (submissionId, gradeData) => {
  try {
    const response = await apiRequest(`/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(gradeData)
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

// Get student's assignment submissions
export const getStudentSubmissions = async (studentId) => {
  try {
    const response = await apiRequest(`/assignments/student/${studentId}/submissions`);
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

// Real-time subscription simulation (polling-based)
let pollingInterval = null;
let subscribers = [];

export const subscribeToAllAssignments = (skillId, callback) => {
  // Add callback to subscribers
  subscribers.push(callback);

  // Start polling if not already started
  if (!pollingInterval) {
    pollingInterval = setInterval(async () => {
      try {
        const response = await getAllAssignments(skillId);
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
