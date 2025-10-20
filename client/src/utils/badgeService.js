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
    console.error('Badge API request error:', error);
    throw error;
  }
};

// Get all badge definitions
export const getAllBadgeDefinitions = async () => {
  try {
    const response = await apiRequest('/badges/definitions');
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

// Get user's earned badges
export const getUserBadges = async (userId) => {
  try {
    const response = await apiRequest(`/badges/user/${userId}`);
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

// Get user's badge statistics
export const getUserBadgeStats = async (userId) => {
  try {
    const response = await apiRequest(`/badges/user/${userId}/stats`);
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

// Award a badge to a user
export const awardBadge = async (userId, badgeId) => {
  try {
    const response = await apiRequest('/badges/award', {
      method: 'POST',
      body: JSON.stringify({ userId, badgeId })
    });
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Check and award badges based on user activity
export const checkAndAwardBadges = async (userId) => {
  try {
    const response = await apiRequest(`/badges/check/${userId}`, {
      method: 'POST'
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

// Get leaderboard
export const getLeaderboard = async (limit = 10) => {
  try {
    const response = await apiRequest(`/badges/leaderboard?limit=${limit}`);
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

// Get user's rank on leaderboard
export const getUserRank = async (userId) => {
  try {
    const response = await apiRequest(`/badges/user/${userId}/rank`);
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

// Get badge category color
export const getBadgeCategoryColor = (category) => {
  const colors = {
    attendance: '#4CAF50',
    lessons: '#2196F3',
    assignments: '#FF9800',
    skills: '#9C27B0',
    speed: '#F44336',
    engagement: '#00BCD4',
    special: '#FFC107'
  };
  return colors[category] || '#757575';
};

// Get badge rarity
export const getBadgeRarity = (points) => {
  if (points >= 500) return { rarity: 'Legendary', color: '#FFD700' };
  if (points >= 250) return { rarity: 'Epic', color: '#9C27B0' };
  if (points >= 100) return { rarity: 'Rare', color: '#2196F3' };
  if (points >= 50) return { rarity: 'Uncommon', color: '#4CAF50' };
  return { rarity: 'Common', color: '#757575' };
};

// Format badge points
export const formatBadgePoints = (points) => {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
};

// Group badges by category
export const groupBadgesByCategory = (badges) => {
  const grouped = {};
  badges.forEach(badge => {
    const category = badge.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(badge);
  });
  return grouped;
};

// Calculate progress toward next badge
export const calculateBadgeProgress = (currentCount, badgeDefinition) => {
  if (!badgeDefinition || !badgeDefinition.criteria) {
    return 0;
  }
  
  const requiredCount = badgeDefinition.criteria.count || 0;
  if (requiredCount === 0) return 0;
  
  const progress = Math.min((currentCount / requiredCount) * 100, 100);
  return Math.round(progress);
};

// Get next badge to earn in a category
export const getNextBadgeToEarn = (allBadges, earnedBadges, category = null) => {
  const earnedIds = earnedBadges.map(b => b.badgeId);
  
  let availableBadges = allBadges.filter(b => !earnedIds.includes(b.id));
  
  if (category) {
    availableBadges = availableBadges.filter(b => b.category === category);
  }
  
  // Sort by points (easiest first)
  availableBadges.sort((a, b) => (a.points || 0) - (b.points || 0));
  
  return availableBadges[0] || null;
};

// Check if user earned new badges (for notification display)
export const checkForNewBadges = (previousBadges, currentBadges) => {
  const previousIds = new Set(previousBadges.map(b => b.badgeId || b.id));
  return currentBadges.filter(b => !previousIds.has(b.badgeId || b.id));
};

// Get badge achievement summary
export const getBadgeAchievementSummary = (stats) => {
  if (!stats) return '';
  
  const { totalBadges, totalPoints, completionPercentage } = stats;
  
  if (totalBadges === 0) {
    return 'Start your journey by completing lessons and assignments!';
  }
  
  if (completionPercentage >= 75) {
    return `Amazing! You've earned ${totalBadges} badges and ${totalPoints} points!`;
  }
  
  if (completionPercentage >= 50) {
    return `Great progress! ${totalBadges} badges earned with ${totalPoints} points!`;
  }
  
  if (completionPercentage >= 25) {
    return `Good start! Keep going to earn more badges!`;
  }
  
  return `You've earned your first ${totalBadges} badge${totalBadges > 1 ? 's' : ''}!`;
};

