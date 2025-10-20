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

// Create a new skill
export const createSkill = async (skillData) => {
  try {
    const response = await apiRequest('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData)
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

// Get all skills
export const getAllSkills = async () => {
  try {
    const response = await apiRequest('/skills');
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

// Get a specific skill by ID
export const getSkillById = async (skillId) => {
  try {
    const response = await apiRequest(`/skills/${skillId}`);
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

// Update skill data
export const updateSkill = async (skillId, updates) => {
  try {
    const response = await apiRequest(`/skills/${skillId}`, {
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

// Delete skill
export const deleteSkill = async (skillId) => {
  try {
    await apiRequest(`/skills/${skillId}`, {
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


// Search topics by name, code, or description (client-side filtering)
export const searchTopics = async (searchTerm) => {
  try {
    const response = await apiRequest('/skills');
    if (response.success) {
      const filteredTopics = response.data.filter(topic => 
        topic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return { success: true, data: filteredTopics };
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

// Search skills by name or description (client-side filtering)
export const searchSkills = async (searchTerm) => {
  try {
    const response = await getAllSkills();
    if (response.success) {
      const filteredSkills = response.data.filter(skill => 
        skill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (skill.code && skill.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      return { success: true, data: filteredSkills };
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

// Assign section to skill
export const assignSectionToSkill = async (skillId, sectionId) => {
  try {
    const response = await apiRequest(`/skills/${skillId}/sections`, {
      method: 'POST',
      body: JSON.stringify({ sectionId })
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

// Remove section from skill
export const removeSectionFromSkill = async (skillId, sectionId) => {
  try {
    const response = await apiRequest(`/skills/${skillId}/sections/${sectionId}`, {
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

// Get sections assigned to a skill
export const getSkillSections = async (skillId) => {
  try {
    const response = await apiRequest(`/skills/${skillId}/sections`);
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

export const subscribeToAllSkills = (callback) => {
  // Add callback to subscribers
  subscribers.push(callback);

  // Start polling if not already started
  if (!pollingInterval) {
    pollingInterval = setInterval(async () => {
      try {
        const response = await getAllSkills();
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
