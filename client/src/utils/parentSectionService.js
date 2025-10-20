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

// Get all content for parent's sections (modules, assignments, skills)
export const getParentSectionContent = async (parentId) => {
  try {
    const response = await apiRequest(`/parent-sections/${parentId}/content`);
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

// Get content for a specific section
export const getParentSectionById = async (parentId, sectionId) => {
  try {
    const response = await apiRequest(`/parent-sections/${parentId}/sections/${sectionId}`);
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

// Search modules by title or description (client-side filtering)
export const searchParentModules = async (parentId, searchTerm) => {
  try {
    const response = await getParentSectionContent(parentId);
    if (response.success) {
      const filteredModules = response.data.modules.filter(module => 
        module.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.skillName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return { 
        success: true, 
        data: {
          ...response.data,
          modules: filteredModules
        }
      };
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

// Search assignments by title or description (client-side filtering)
export const searchParentAssignments = async (parentId, searchTerm) => {
  try {
    const response = await getParentSectionContent(parentId);
    if (response.success) {
      const filteredAssignments = response.data.assignments.filter(assignment => 
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.skillName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return { 
        success: true, 
        data: {
          ...response.data,
          assignments: filteredAssignments
        }
      };
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

// Filter modules by skill
export const filterModulesBySkill = async (parentId, skillId) => {
  try {
    const response = await getParentSectionContent(parentId);
    if (response.success) {
      const filteredModules = response.data.modules.filter(module => 
        module.skillId === skillId
      );
      
      return { 
        success: true, 
        data: {
          ...response.data,
          modules: filteredModules
        }
      };
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

// Filter assignments by skill
export const filterAssignmentsBySkill = async (parentId, skillId) => {
  try {
    const response = await getParentSectionContent(parentId);
    if (response.success) {
      const filteredAssignments = response.data.assignments.filter(assignment => 
        assignment.skillId === skillId
      );
      
      return { 
        success: true, 
        data: {
          ...response.data,
          assignments: filteredAssignments
        }
      };
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

// Get upcoming assignments (due within next 7 days)
export const getUpcomingAssignments = async (parentId) => {
  try {
    const response = await getParentSectionContent(parentId);
    if (response.success) {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingAssignments = response.data.assignments.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate >= now && dueDate <= nextWeek;
      }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      
      return { 
        success: true, 
        data: {
          ...response.data,
          assignments: upcomingAssignments
        }
      };
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

// Get overdue assignments
export const getOverdueAssignments = async (parentId) => {
  try {
    const response = await getParentSectionContent(parentId);
    if (response.success) {
      const now = new Date();
      
      const overdueAssignments = response.data.assignments.filter(assignment => {
        const dueDate = new Date(assignment.dueDate);
        return dueDate < now;
      }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      
      return { 
        success: true, 
        data: {
          ...response.data,
          assignments: overdueAssignments
        }
      };
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
