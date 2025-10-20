const { db, admin } = require('../config/firebase-admin-config');
const { createNotificationInternal } = require('./notificationController');

// Badge definitions with criteria
const BADGE_DEFINITIONS = {
  // Attendance Badges
  perfect_attendance_week: {
    id: 'perfect_attendance_week',
    name: 'Perfect Week',
    description: 'Attended all sessions for a week',
    icon: '🌟',
    category: 'attendance',
    points: 50,
    criteria: { type: 'attendance', count: 5, period: 'week' }
  },
  perfect_attendance_month: {
    id: 'perfect_attendance_month',
    name: 'Monthly Star',
    description: 'Perfect attendance for a month',
    icon: '⭐',
    category: 'attendance',
    points: 200,
    criteria: { type: 'attendance', count: 20, period: 'month' }
  },
  attendance_streak_10: {
    id: 'attendance_streak_10',
    name: 'Consistency Champion',
    description: '10-day attendance streak',
    icon: '🔥',
    category: 'attendance',
    points: 100,
    criteria: { type: 'streak', count: 10 }
  },
  
  // Lesson Completion Badges
  first_lesson: {
    id: 'first_lesson',
    name: 'Getting Started',
    description: 'Completed your first lesson',
    icon: '🎯',
    category: 'lessons',
    points: 10,
    criteria: { type: 'lessons_completed', count: 1 }
  },
  lesson_master_5: {
    id: 'lesson_master_5',
    name: 'Quick Learner',
    description: 'Completed 5 lessons',
    icon: '📚',
    category: 'lessons',
    points: 50,
    criteria: { type: 'lessons_completed', count: 5 }
  },
  lesson_master_10: {
    id: 'lesson_master_10',
    name: 'Knowledge Seeker',
    description: 'Completed 10 lessons',
    icon: '📖',
    category: 'lessons',
    points: 100,
    criteria: { type: 'lessons_completed', count: 10 }
  },
  lesson_master_25: {
    id: 'lesson_master_25',
    name: 'Lesson Expert',
    description: 'Completed 25 lessons',
    icon: '🎓',
    category: 'lessons',
    points: 250,
    criteria: { type: 'lessons_completed', count: 25 }
  },
  lesson_master_50: {
    id: 'lesson_master_50',
    name: 'Master Scholar',
    description: 'Completed 50 lessons',
    icon: '👑',
    category: 'lessons',
    points: 500,
    criteria: { type: 'lessons_completed', count: 50 }
  },
  
  // Assignment Badges
  first_assignment: {
    id: 'first_assignment',
    name: 'First Submission',
    description: 'Submitted your first assignment',
    icon: '📝',
    category: 'assignments',
    points: 10,
    criteria: { type: 'assignments_submitted', count: 1 }
  },
  assignment_pro_5: {
    id: 'assignment_pro_5',
    name: 'Assignment Pro',
    description: 'Submitted 5 assignments',
    icon: '✍️',
    category: 'assignments',
    points: 50,
    criteria: { type: 'assignments_submitted', count: 5 }
  },
  perfect_score: {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Got 100% on an assignment',
    icon: '💯',
    category: 'assignments',
    points: 100,
    criteria: { type: 'perfect_assignment', count: 1 }
  },
  all_a_student: {
    id: 'all_a_student',
    name: 'All A Student',
    description: '5 assignments with 90% or higher',
    icon: '🏆',
    category: 'assignments',
    points: 150,
    criteria: { type: 'high_grades', count: 5, threshold: 90 }
  },
  
  // Skill Mastery Badges
  skill_complete_1: {
    id: 'skill_complete_1',
    name: 'Skill Starter',
    description: 'Completed all lessons in 1 skill',
    icon: '🎯',
    category: 'skills',
    points: 100,
    criteria: { type: 'skills_mastered', count: 1 }
  },
  skill_complete_3: {
    id: 'skill_complete_3',
    name: 'Multi-Skilled',
    description: 'Mastered 3 different skills',
    icon: '🌈',
    category: 'skills',
    points: 300,
    criteria: { type: 'skills_mastered', count: 3 }
  },
  
  // Speed Badges
  speed_learner: {
    id: 'speed_learner',
    name: 'Speed Learner',
    description: 'Completed 3 lessons in one day',
    icon: '⚡',
    category: 'speed',
    points: 75,
    criteria: { type: 'lessons_per_day', count: 3 }
  },
  
  // Engagement Badges
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Completed lessons before 9 AM',
    icon: '🌅',
    category: 'engagement',
    points: 25,
    criteria: { type: 'early_completion', count: 5 }
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Completed lessons after 8 PM',
    icon: '🦉',
    category: 'engagement',
    points: 25,
    criteria: { type: 'late_completion', count: 5 }
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Completed lessons on weekends',
    icon: '🛡️',
    category: 'engagement',
    points: 50,
    criteria: { type: 'weekend_completion', count: 5 }
  },
  
  // Special Badges
  helping_hand: {
    id: 'helping_hand',
    name: 'Helping Hand',
    description: 'Participated in class discussions',
    icon: '🤝',
    category: 'special',
    points: 50,
    criteria: { type: 'chat_participation', count: 10 }
  },
  quiz_master: {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Completed 10 quizzes with 80% or higher',
    icon: '🧠',
    category: 'special',
    points: 150,
    criteria: { type: 'quiz_performance', count: 10, threshold: 80 }
  }
};

// Get all badge definitions
const getAllBadgeDefinitions = async (req, res) => {
  try {
    const badges = Object.values(BADGE_DEFINITIONS);
    res.json({
      success: true,
      data: badges,
      count: badges.length
    });
  } catch (error) {
    console.error('Error getting badge definitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get badge definitions: ' + error.message
    });
  }
};

// Get user's earned badges
const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const badgesSnapshot = await db.ref(`badges/${userId}`).once('value');
    const earnedBadges = [];
    
    if (badgesSnapshot.exists()) {
      badgesSnapshot.forEach((childSnapshot) => {
        const badge = childSnapshot.val();
        // Merge with badge definition to get full details
        const badgeDefinition = BADGE_DEFINITIONS[badge.badgeId];
        earnedBadges.push({
          ...badge,
          ...badgeDefinition,
          id: childSnapshot.key
        });
      });
    }
    
    // Sort by earned date (newest first)
    earnedBadges.sort((a, b) => (b.earnedAt || 0) - (a.earnedAt || 0));
    
    res.json({
      success: true,
      data: earnedBadges,
      count: earnedBadges.length
    });
  } catch (error) {
    console.error('Error getting user badges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user badges: ' + error.message
    });
  }
};

// Get user's badge statistics
const getUserBadgeStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const badgesSnapshot = await db.ref(`badges/${userId}`).once('value');
    const earnedBadges = [];
    let totalPoints = 0;
    
    if (badgesSnapshot.exists()) {
      badgesSnapshot.forEach((childSnapshot) => {
        const badge = childSnapshot.val();
        earnedBadges.push(badge);
        
        // Get points from badge definition
        const badgeDefinition = BADGE_DEFINITIONS[badge.badgeId];
        if (badgeDefinition) {
          totalPoints += badgeDefinition.points || 0;
        }
      });
    }
    
    // Count badges by category
    const categoryCount = {};
    earnedBadges.forEach(badge => {
      const badgeDefinition = BADGE_DEFINITIONS[badge.badgeId];
      if (badgeDefinition) {
        const category = badgeDefinition.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    });
    
    // Calculate completion percentage
    const totalBadges = Object.keys(BADGE_DEFINITIONS).length;
    const earnedCount = earnedBadges.length;
    const completionPercentage = Math.round((earnedCount / totalBadges) * 100);
    
    res.json({
      success: true,
      data: {
        totalBadges: earnedCount,
        totalPoints,
        completionPercentage,
        categoryCount,
        availableBadges: totalBadges,
        remainingBadges: totalBadges - earnedCount
      }
    });
  } catch (error) {
    console.error('Error getting user badge stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user badge stats: ' + error.message
    });
  }
};

// Award a badge to a user
const awardBadge = async (req, res) => {
  try {
    const { userId, badgeId } = req.body;
    
    if (!userId || !badgeId) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Badge ID are required'
      });
    }
    
    // Verify badge definition exists
    const badgeDefinition = BADGE_DEFINITIONS[badgeId];
    if (!badgeDefinition) {
      return res.status(404).json({
        success: false,
        error: 'Badge not found'
      });
    }
    
    // Check if user already has this badge
    const existingBadgeSnapshot = await db.ref(`badges/${userId}`)
      .orderByChild('badgeId')
      .equalTo(badgeId)
      .once('value');
      
    if (existingBadgeSnapshot.exists()) {
      return res.status(400).json({
        success: false,
        error: 'User already has this badge'
      });
    }
    
    // Award the badge
    const badgeData = {
      badgeId,
      userId,
      earnedAt: admin.database.ServerValue.TIMESTAMP,
      createdAt: admin.database.ServerValue.TIMESTAMP
    };
    
    const newBadgeRef = await db.ref(`badges/${userId}`).push(badgeData);
    
    // Update user's total points
    const userBadgesSnapshot = await db.ref(`badges/${userId}`).once('value');
    let totalPoints = 0;
    
    if (userBadgesSnapshot.exists()) {
      userBadgesSnapshot.forEach((childSnapshot) => {
        const badge = childSnapshot.val();
        const def = BADGE_DEFINITIONS[badge.badgeId];
        if (def) {
          totalPoints += def.points || 0;
        }
      });
    }
    
    await db.ref(`users/${userId}/badgePoints`).set(totalPoints);
    
    res.json({
      success: true,
      data: {
        ...badgeData,
        ...badgeDefinition,
        id: newBadgeRef.key
      },
      message: `Badge "${badgeDefinition.name}" awarded successfully!`
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award badge: ' + error.message
    });
  }
};

// Check and award badges based on user activity
const checkAndAwardBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const newlyEarnedBadges = [];
    
    // Get user's current badges
    const userBadgesSnapshot = await db.ref(`badges/${userId}`).once('value');
    const earnedBadgeIds = [];
    
    if (userBadgesSnapshot.exists()) {
      userBadgesSnapshot.forEach((childSnapshot) => {
        const badge = childSnapshot.val();
        earnedBadgeIds.push(badge.badgeId);
      });
    }
    
    // Get user's progress data
    const progressSnapshot = await db.ref(`progress/${userId}`).once('value');
    const progressRecords = [];
    
    if (progressSnapshot.exists()) {
      progressSnapshot.forEach((childSnapshot) => {
        progressRecords.push(childSnapshot.val());
      });
    }
    
    // Check lesson completion badges
    const completedLessons = progressRecords.filter(p => p.percentage === 100).length;
    
    if (completedLessons >= 1 && !earnedBadgeIds.includes('first_lesson')) {
      await awardBadgeInternal(userId, 'first_lesson');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.first_lesson);
    }
    
    if (completedLessons >= 5 && !earnedBadgeIds.includes('lesson_master_5')) {
      await awardBadgeInternal(userId, 'lesson_master_5');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.lesson_master_5);
    }
    
    if (completedLessons >= 10 && !earnedBadgeIds.includes('lesson_master_10')) {
      await awardBadgeInternal(userId, 'lesson_master_10');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.lesson_master_10);
    }
    
    if (completedLessons >= 25 && !earnedBadgeIds.includes('lesson_master_25')) {
      await awardBadgeInternal(userId, 'lesson_master_25');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.lesson_master_25);
    }
    
    if (completedLessons >= 50 && !earnedBadgeIds.includes('lesson_master_50')) {
      await awardBadgeInternal(userId, 'lesson_master_50');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.lesson_master_50);
    }
    
    // Get assignment submissions
    const submissionsSnapshot = await db.ref('assignmentSubmissions')
      .orderByChild('studentId')
      .equalTo(userId)
      .once('value');
    
    const submissions = [];
    if (submissionsSnapshot.exists()) {
      submissionsSnapshot.forEach((childSnapshot) => {
        submissions.push(childSnapshot.val());
      });
    }
    
    // Check assignment badges
    if (submissions.length >= 1 && !earnedBadgeIds.includes('first_assignment')) {
      await awardBadgeInternal(userId, 'first_assignment');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.first_assignment);
    }
    
    if (submissions.length >= 5 && !earnedBadgeIds.includes('assignment_pro_5')) {
      await awardBadgeInternal(userId, 'assignment_pro_5');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.assignment_pro_5);
    }
    
    // Check for perfect score
    const perfectScores = submissions.filter(s => s.grade === 100);
    if (perfectScores.length >= 1 && !earnedBadgeIds.includes('perfect_score')) {
      await awardBadgeInternal(userId, 'perfect_score');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.perfect_score);
    }
    
    // Check for high grades (90% or higher)
    const highGrades = submissions.filter(s => s.grade >= 90);
    if (highGrades.length >= 5 && !earnedBadgeIds.includes('all_a_student')) {
      await awardBadgeInternal(userId, 'all_a_student');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.all_a_student);
    }
    
    // Get attendance records
    const attendanceSnapshot = await db.ref('attendance')
      .orderByChild('studentId')
      .equalTo(userId)
      .once('value');
    
    const attendanceRecords = [];
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        const record = childSnapshot.val();
        if (record.status === 'present') {
          attendanceRecords.push(record);
        }
      });
    }
    
    // Check attendance streak
    const streak = calculateAttendanceStreak(attendanceRecords);
    if (streak >= 10 && !earnedBadgeIds.includes('attendance_streak_10')) {
      await awardBadgeInternal(userId, 'attendance_streak_10');
      newlyEarnedBadges.push(BADGE_DEFINITIONS.attendance_streak_10);
    }
    
    // Update user's total points
    const allUserBadgesSnapshot = await db.ref(`badges/${userId}`).once('value');
    let totalPoints = 0;
    
    if (allUserBadgesSnapshot.exists()) {
      allUserBadgesSnapshot.forEach((childSnapshot) => {
        const badge = childSnapshot.val();
        const def = BADGE_DEFINITIONS[badge.badgeId];
        if (def) {
          totalPoints += def.points || 0;
        }
      });
    }
    
    await db.ref(`users/${userId}/badgePoints`).set(totalPoints);
    
    res.json({
      success: true,
      data: {
        newlyEarnedBadges,
        totalPoints,
        message: newlyEarnedBadges.length > 0 
          ? `Congratulations! You earned ${newlyEarnedBadges.length} new badge${newlyEarnedBadges.length > 1 ? 's' : ''}!`
          : 'No new badges earned at this time.'
      }
    });
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check and award badges: ' + error.message
    });
  }
};

// Internal helper function to award a badge
const awardBadgeInternal = async (userId, badgeId) => {
  try {
    const badgeDefinition = BADGE_DEFINITIONS[badgeId];
    if (!badgeDefinition) {
      console.error('Badge definition not found:', badgeId);
      return;
    }
    
    // Check if user already has this badge
    const existingBadgeSnapshot = await db.ref(`badges/${userId}`)
      .orderByChild('badgeId')
      .equalTo(badgeId)
      .once('value');
      
    if (existingBadgeSnapshot.exists()) {
      return; // User already has this badge
    }
    
    // Award the badge
    const badgeData = {
      badgeId,
      userId,
      earnedAt: admin.database.ServerValue.TIMESTAMP,
      createdAt: admin.database.ServerValue.TIMESTAMP
    };
    
    await db.ref(`badges/${userId}`).push(badgeData);
    console.log(`Badge "${badgeDefinition.name}" awarded to user ${userId}`);
    
    // Notify user about the badge
    try {
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      if (userSnapshot.exists()) {
        const user = userSnapshot.val();
        
        await createNotificationInternal({
          recipientId: userId,
          recipientRole: user.role || 'parent',
          type: 'badge',
          title: `${badgeDefinition.icon} Badge Earned!`,
          message: `Congratulations! You earned "${badgeDefinition.name}" - ${badgeDefinition.description} (+${badgeDefinition.points} points)`,
          priority: 'normal',
          actionUrl: '/dashboard/badges',
          metadata: {
            badgeId,
            badgeName: badgeDefinition.name,
            points: badgeDefinition.points,
            category: badgeDefinition.category
          },
          createdBy: 'system'
        });
      }
    } catch (notifError) {
      console.error('Error creating badge notification:', notifError);
      // Don't fail the badge award if notification fails
    }
  } catch (error) {
    console.error('Error awarding badge internally:', error);
  }
};

// Calculate attendance streak
const calculateAttendanceStreak = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return 0;
  }
  
  // Sort by date (newest first)
  const sortedRecords = attendanceRecords.sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt);
    const dateB = new Date(b.date || b.createdAt);
    return dateB - dateA;
  });
  
  let streak = 0;
  let currentDate = new Date();
  
  for (let i = 0; i < sortedRecords.length; i++) {
    const recordDate = new Date(sortedRecords[i].date || sortedRecords[i].createdAt);
    const daysDiff = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === i) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// Get leaderboard based on badge points
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get all users with badge points
    const usersSnapshot = await db.ref('users')
      .orderByChild('badgePoints')
      .limitToLast(parseInt(limit))
      .once('value');
    
    const leaderboard = [];
    
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        if (user.role === 'student' || user.role === 'parent') {
          leaderboard.push({
            userId: childSnapshot.key,
            name: user.childName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
            email: user.email,
            badgePoints: user.badgePoints || 0,
            role: user.role
          });
        }
      });
    }
    
    // Sort by points (highest first)
    leaderboard.sort((a, b) => b.badgePoints - a.badgePoints);
    
    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    res.json({
      success: true,
      data: leaderboard,
      count: leaderboard.length
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard: ' + error.message
    });
  }
};

// Get user's rank on leaderboard
const getUserRank = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Get user's badge points
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userSnapshot.val();
    const userPoints = user.badgePoints || 0;
    
    // Get all users and count how many have more points
    const allUsersSnapshot = await db.ref('users').once('value');
    let rank = 1;
    let totalStudents = 0;
    
    if (allUsersSnapshot.exists()) {
      allUsersSnapshot.forEach((childSnapshot) => {
        const otherUser = childSnapshot.val();
        if (otherUser.role === 'student' || otherUser.role === 'parent') {
          totalStudents++;
          const otherPoints = otherUser.badgePoints || 0;
          if (otherPoints > userPoints) {
            rank++;
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        userId,
        rank,
        totalStudents,
        badgePoints: userPoints,
        percentile: totalStudents > 0 ? Math.round((1 - (rank - 1) / totalStudents) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user rank: ' + error.message
    });
  }
};

module.exports = {
  getAllBadgeDefinitions,
  getUserBadges,
  getUserBadgeStats,
  awardBadge,
  checkAndAwardBadges,
  getLeaderboard,
  getUserRank
};

