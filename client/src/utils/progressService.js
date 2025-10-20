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

// Get user progress for a specific lesson
export const getLessonProgress = async (userId, lessonId) => {
  try {
    const response = await apiRequest(`/progress/lesson/${userId}/${lessonId}`);
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

// Update user progress for a specific lesson
export const updateLessonProgress = async (userId, lessonId, percentage, status = null) => {
  try {
    const response = await apiRequest(`/progress/lesson/${userId}/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify({ percentage, status })
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

// Get all progress for a user
export const getUserProgress = async (userId) => {
  try {
    const response = await apiRequest(`/progress/user/${userId}`);
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

// Get progress for all users in a section
export const getSectionProgress = async (sectionId) => {
  try {
    const response = await apiRequest(`/progress/section/${sectionId}`);
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

// Get progress for all users in a skill
export const getSkillProgress = async (skillId) => {
  try {
    const response = await apiRequest(`/progress/skill/${skillId}`);
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

// Get progress statistics for a user
export const getProgressStats = async (userId) => {
  try {
    const response = await apiRequest(`/progress/stats/${userId}`);
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

// Get progress for multiple lessons at once
export const getMultipleLessonProgress = async (userId, lessonIds) => {
  try {
    const promises = lessonIds.map(lessonId => getLessonProgress(userId, lessonId));
    const results = await Promise.all(promises);
    
    const progressMap = {};
    results.forEach((result, index) => {
      if (result.success) {
        progressMap[lessonIds[index]] = result.data;
      }
    });
    
    return {
      success: true,
      data: progressMap
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Calculate overall progress percentage
export const calculateOverallProgress = (progressRecords) => {
  if (!progressRecords || progressRecords.length === 0) {
    return 0;
  }
  
  const totalPercentage = progressRecords.reduce((sum, record) => sum + (record.percentage || 0), 0);
  return Math.round(totalPercentage / progressRecords.length);
};

// Get progress status based on percentage
export const getProgressStatus = (percentage) => {
  if (percentage >= 100) return { status: 'completed', color: 'success', text: 'Completed' };
  if (percentage >= 75) return { status: 'almost_done', color: 'info', text: 'Almost Done' };
  if (percentage >= 50) return { status: 'in_progress', color: 'warning', text: 'In Progress' };
  if (percentage > 0) return { status: 'started', color: 'info', text: 'Started' };
  return { status: 'not_started', color: 'default', text: 'Not Started' };
};

// Get progress color for UI components
export const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'success';
  if (percentage >= 75) return 'info';
  if (percentage >= 50) return 'warning';
  return 'error';
};

// Format progress for display
export const formatProgress = (percentage) => {
  return `${Math.round(percentage)}%`;
};

// Get progress summary for dashboard
export const getProgressSummary = (progressRecords) => {
  const total = progressRecords.length;
  const completed = progressRecords.filter(p => p.percentage === 100).length;
  const inProgress = progressRecords.filter(p => p.percentage > 0 && p.percentage < 100).length;
  const notStarted = progressRecords.filter(p => p.percentage === 0).length;
  const average = total > 0 ? calculateOverallProgress(progressRecords) : 0;
  
  return {
    total,
    completed,
    inProgress,
    notStarted,
    average,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

// Get attachment progress for a lesson
export const getAttachmentProgress = async (userId, lessonId) => {
  try {
    const response = await apiRequest(`/progress/attachment/${userId}/${lessonId}`);
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

// Update attachment progress
export const updateAttachmentProgress = async (userId, lessonId, attachmentId) => {
  try {
    console.log('updateAttachmentProgress called with:', { userId, lessonId, attachmentId });
    
    const response = await apiRequest(`/progress/attachment/${userId}/${lessonId}/${attachmentId}`, {
      method: 'POST'
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('updateAttachmentProgress error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update attachment progress and get updated lesson progress
export const updateAttachmentProgressWithLessonUpdate = async (userId, lessonId, attachmentId) => {
  try {
    // Update attachment progress (this will also update lesson progress on backend)
    const attachmentResult = await updateAttachmentProgress(userId, lessonId, attachmentId);
    
    if (!attachmentResult.success) {
      return attachmentResult;
    }

    // Get updated lesson progress
    const lessonProgressResult = await getLessonProgress(userId, lessonId);
    
    return {
      success: true,
      data: {
        attachmentProgress: attachmentResult.data,
        lessonProgress: lessonProgressResult.success ? lessonProgressResult.data : null
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get lesson progress with attachment progress
export const getLessonProgressWithAttachments = async (userId, lessonId) => {
  try {
    const response = await apiRequest(`/progress/lesson-with-attachments/${userId}/${lessonId}`);
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

// Get all parent progress for teacher dashboard, admin dashboard, or parent dashboard
export const getAllParentProgress = async (userId, userRole = null) => {
  try {
    if (userRole === 'admin') {
      // Admin access - use admin endpoint
      const response = await apiRequest(`/progress/admin/parents`, {
        method: 'POST',
        body: JSON.stringify({ userRole: 'admin' })
      });
      return {
        success: true,
        data: response.data
      };
    } else if (userRole === 'parent') {
      // Parent access - use teacher endpoint with parent role
      console.log('Making parent API request to:', `/progress/teacher/${userId}/parents`);
      const response = await apiRequest(`/progress/teacher/${userId}/parents`, {
        method: 'POST',
        body: JSON.stringify({ userRole: 'parent' })
      });
      return {
        success: true,
        data: response.data
      };
    } else if (userId) {
      // Teacher access - use existing endpoint
      const response = await apiRequest(`/progress/teacher/${userId}/parents`);
      return {
        success: true,
        data: response.data
      };
    } else {
      throw new Error('Invalid parameters for getAllParentProgress');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get progress with assignment submissions
export const getProgressWithAssignments = async (userId) => {
  try {
    const response = await apiRequest(`/progress/user/${userId}/with-assignments`);
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

// Update progress when assignment is submitted
export const updateProgressOnAssignmentSubmission = async (userId, assignmentId, submissionData) => {
  try {
    const response = await apiRequest(`/progress/assignment-submission`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        assignmentId,
        submissionData
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

// Get assignment progress for a specific user
export const getAssignmentProgress = async (userId, assignmentId) => {
  try {
    const response = await apiRequest(`/progress/assignment/${userId}/${assignmentId}`);
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
