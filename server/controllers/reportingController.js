const { db, admin } = require('../config/firebase-admin-config');

// Generate comprehensive attendance report
const generateAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, sectionId, studentId } = req.query;
    
    let attendanceQuery = db.ref('attendance');
    
    // Apply date filters
    if (startDate && endDate) {
      attendanceQuery = attendanceQuery
        .orderByChild('date')
        .startAt(startDate)
        .endAt(endDate);
    } else if (startDate) {
      attendanceQuery = attendanceQuery
        .orderByChild('date')
        .startAt(startDate);
    } else if (endDate) {
      attendanceQuery = attendanceQuery
        .orderByChild('date')
        .endAt(endDate);
    }
    
    const attendanceSnapshot = await attendanceQuery.once('value');
    const attendanceRecords = [];
    
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        const record = childSnapshot.val();
        
        // Apply section filter
        if (sectionId && record.sectionId !== sectionId) {
          return;
        }
        
        // Apply student filter
        if (studentId && record.studentId !== studentId) {
          return;
        }
        
        attendanceRecords.push({
          id: childSnapshot.key,
          ...record
        });
      });
    }
    
    // Calculate attendance statistics
    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'late').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
    
    const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
    const punctualityRate = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;
    
    // Daily breakdown
    const dailyBreakdown = {};
    attendanceRecords.forEach(record => {
      const date = record.date;
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = { present: 0, late: 0, absent: 0, total: 0 };
      }
      dailyBreakdown[date][record.status]++;
      dailyBreakdown[date].total++;
    });
    
    // Student-wise breakdown
    const studentBreakdown = {};
    attendanceRecords.forEach(record => {
      const studentId = record.studentId;
      if (!studentBreakdown[studentId]) {
        studentBreakdown[studentId] = { present: 0, late: 0, absent: 0, total: 0 };
      }
      studentBreakdown[studentId][record.status]++;
      studentBreakdown[studentId].total++;
    });
    
    res.json({
      success: true,
      data: {
        summary: {
          totalRecords,
          presentCount,
          lateCount,
          absentCount,
          attendanceRate,
          punctualityRate
        },
        dailyBreakdown,
        studentBreakdown,
        records: attendanceRecords
      }
    });
    
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate attendance report: ' + error.message
    });
  }
};

// Generate comprehensive progress report
const generateProgressReport = async (req, res) => {
  try {
    const { sectionId, studentId, skillId } = req.query;
    
    let progressQuery = db.ref('progress');
    const progressRecords = [];
    
    const progressSnapshot = await progressQuery.once('value');
    
    if (progressSnapshot.exists()) {
      progressSnapshot.forEach((userChildSnapshot) => {
        const userId = userChildSnapshot.key;
        
        // Apply student filter
        if (studentId && userId !== studentId) {
          return;
        }
        
        userChildSnapshot.forEach((lessonChildSnapshot) => {
          const progress = lessonChildSnapshot.val();
          
          // Apply skill filter
          if (skillId) {
            // Get lesson details to check skill
            // This would require additional query, simplified for now
          }
          
          progressRecords.push({
            userId,
            ...progress
          });
        });
      });
    }
    
    // Calculate progress statistics
    const totalLessons = progressRecords.length;
    const completedLessons = progressRecords.filter(p => p.percentage === 100).length;
    const inProgressLessons = progressRecords.filter(p => p.percentage > 0 && p.percentage < 100).length;
    const notStartedLessons = progressRecords.filter(p => p.percentage === 0).length;
    
    const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const averageProgress = totalLessons > 0 
      ? Math.round(progressRecords.reduce((sum, p) => sum + (p.percentage || 0), 0) / totalLessons)
      : 0;
    
    // Student-wise progress
    const studentProgress = {};
    progressRecords.forEach(record => {
      const userId = record.userId;
      if (!studentProgress[userId]) {
        studentProgress[userId] = {
          totalLessons: 0,
          completedLessons: 0,
          inProgressLessons: 0,
          notStartedLessons: 0,
          totalProgress: 0
        };
      }
      
      studentProgress[userId].totalLessons++;
      studentProgress[userId].totalProgress += record.percentage || 0;
      
      if (record.percentage === 100) {
        studentProgress[userId].completedLessons++;
      } else if (record.percentage > 0) {
        studentProgress[userId].inProgressLessons++;
      } else {
        studentProgress[userId].notStartedLessons++;
      }
    });
    
    // Calculate average progress for each student
    Object.keys(studentProgress).forEach(userId => {
      const student = studentProgress[userId];
      student.averageProgress = student.totalLessons > 0 
        ? Math.round(student.totalProgress / student.totalLessons)
        : 0;
    });
    
    // Skill-wise breakdown
    const skillProgress = {};
    progressRecords.forEach(record => {
      // This would require getting lesson details and skill information
      // Simplified for now
    });
    
    res.json({
      success: true,
      data: {
        summary: {
          totalLessons,
          completedLessons,
          inProgressLessons,
          notStartedLessons,
          completionRate,
          averageProgress
        },
        studentProgress,
        skillProgress,
        records: progressRecords
      }
    });
    
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate progress report: ' + error.message
    });
  }
};

// Generate combined dashboard report
const generateDashboardReport = async (req, res) => {
  try {
    const { period = 'week' } = req.query; // week, month, quarter, year
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = now;
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get attendance data
    const attendanceSnapshot = await db.ref('attendance')
      .orderByChild('date')
      .startAt(startDateStr)
      .endAt(endDateStr)
      .once('value');
    
    const attendanceRecords = [];
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        attendanceRecords.push(childSnapshot.val());
      });
    }
    
    // Get progress data
    const progressSnapshot = await db.ref('progress').once('value');
    const progressRecords = [];
    if (progressSnapshot.exists()) {
      progressSnapshot.forEach((userChildSnapshot) => {
        userChildSnapshot.forEach((lessonChildSnapshot) => {
          progressRecords.push(lessonChildSnapshot.val());
        });
      });
    }
    
    // Get user data for demographics
    const usersSnapshot = await db.ref('users').once('value');
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }
    
    // Calculate key metrics
    const totalStudents = users.filter(u => u.role === 'parent').length;
    const totalTeachers = users.filter(u => u.role === 'teacher').length;
    
    const attendanceStats = {
      totalRecords: attendanceRecords.length,
      presentCount: attendanceRecords.filter(r => r.status === 'present').length,
      lateCount: attendanceRecords.filter(r => r.status === 'late').length,
      absentCount: attendanceRecords.filter(r => r.status === 'absent').length
    };
    
    const progressStats = {
      totalLessons: progressRecords.length,
      completedLessons: progressRecords.filter(p => p.percentage === 100).length,
      averageProgress: progressRecords.length > 0 
        ? Math.round(progressRecords.reduce((sum, p) => sum + (p.percentage || 0), 0) / progressRecords.length)
        : 0
    };
    
    // Generate trends
    const attendanceTrend = generateAttendanceTrend(attendanceRecords, period);
    const progressTrend = generateProgressTrend(progressRecords, period);
    
    // Generate insights
    const insights = generateInsights(attendanceStats, progressStats, attendanceTrend, progressTrend);
    
    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate: startDateStr, endDate: endDateStr },
        demographics: {
          totalStudents,
          totalTeachers
        },
        attendance: {
          ...attendanceStats,
          attendanceRate: attendanceStats.totalRecords > 0 
            ? Math.round((attendanceStats.presentCount / attendanceStats.totalRecords) * 100)
            : 0,
          trend: attendanceTrend
        },
        progress: {
          ...progressStats,
          completionRate: progressStats.totalLessons > 0 
            ? Math.round((progressStats.completedLessons / progressStats.totalLessons) * 100)
            : 0,
          trend: progressTrend
        },
        insights,
        recommendations: generateRecommendations(attendanceStats, progressStats, insights)
      }
    });
    
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard report: ' + error.message
    });
  }
};

// Helper function to generate attendance trend
const generateAttendanceTrend = (attendanceRecords, period) => {
  const trend = {};
  
  attendanceRecords.forEach(record => {
    const date = record.date;
    if (!trend[date]) {
      trend[date] = { present: 0, late: 0, absent: 0, total: 0 };
    }
    trend[date][record.status]++;
    trend[date].total++;
  });
  
  return trend;
};

// Helper function to generate progress trend
const generateProgressTrend = (progressRecords, period) => {
  // Simplified progress trend based on completion dates
  const trend = {};
  
  progressRecords.forEach(record => {
    if (record.percentage === 100 && record.updatedAt) {
      const date = new Date(record.updatedAt).toISOString().split('T')[0];
      if (!trend[date]) {
        trend[date] = 0;
      }
      trend[date]++;
    }
  });
  
  return trend;
};

// Helper function to generate insights
const generateInsights = (attendanceStats, progressStats, attendanceTrend, progressTrend) => {
  const insights = [];
  
  // Attendance insights
  if (attendanceStats.attendanceRate > 90) {
    insights.push({
      type: 'positive',
      category: 'attendance',
      message: 'Excellent attendance rate! Students are consistently present.',
      impact: 'high'
    });
  } else if (attendanceStats.attendanceRate < 70) {
    insights.push({
      type: 'concern',
      category: 'attendance',
      message: 'Low attendance rate detected. Consider reaching out to families.',
      impact: 'high'
    });
  }
  
  // Progress insights
  if (progressStats.completionRate > 80) {
    insights.push({
      type: 'positive',
      category: 'progress',
      message: 'Strong learning progress! Students are completing lessons effectively.',
      impact: 'medium'
    });
  } else if (progressStats.completionRate < 50) {
    insights.push({
      type: 'concern',
      category: 'progress',
      message: 'Low lesson completion rate. May need additional support.',
      impact: 'medium'
    });
  }
  
  return insights;
};

// Helper function to generate recommendations
const generateRecommendations = (attendanceStats, progressStats, insights) => {
  const recommendations = [];
  
  if (attendanceStats.attendanceRate < 80) {
    recommendations.push({
      category: 'attendance',
      priority: 'high',
      action: 'Implement attendance improvement program',
      description: 'Contact families with low attendance to understand barriers'
    });
  }
  
  if (progressStats.completionRate < 60) {
    recommendations.push({
      category: 'progress',
      priority: 'medium',
      action: 'Provide additional learning support',
      description: 'Offer extra tutoring or modify lesson difficulty'
    });
  }
  
  return recommendations;
};

// Export individual student report
const exportStudentReport = async (req, res) => {
  try {
    const { studentId, startDate, endDate } = req.query;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }
    
    // Get student information
    const studentSnapshot = await db.ref(`users/${studentId}`).once('value');
    if (!studentSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }
    
    const student = studentSnapshot.val();
    
    // Get attendance records
    let attendanceQuery = db.ref('attendance').orderByChild('studentId').equalTo(studentId);
    
    if (startDate && endDate) {
      // This would require a compound query, simplified for now
      const attendanceSnapshot = await attendanceQuery.once('value');
      const attendanceRecords = [];
      
      if (attendanceSnapshot.exists()) {
        attendanceSnapshot.forEach((childSnapshot) => {
          const record = childSnapshot.val();
          if (record.date >= startDate && record.date <= endDate) {
            attendanceRecords.push(record);
          }
        });
      }
      
      // Get progress records
      const progressSnapshot = await db.ref(`progress/${studentId}`).once('value');
      const progressRecords = [];
      
      if (progressSnapshot.exists()) {
        progressSnapshot.forEach((childSnapshot) => {
          progressRecords.push(childSnapshot.val());
        });
      }
      
      res.json({
        success: true,
        data: {
          student: {
            id: studentId,
            name: student.childName || `${student.firstName} ${student.lastName}`,
            email: student.email
          },
          period: { startDate, endDate },
          attendance: {
            records: attendanceRecords,
            summary: {
              totalDays: attendanceRecords.length,
              presentDays: attendanceRecords.filter(r => r.status === 'present').length,
              lateDays: attendanceRecords.filter(r => r.status === 'late').length,
              absentDays: attendanceRecords.filter(r => r.status === 'absent').length
            }
          },
          progress: {
            records: progressRecords,
            summary: {
              totalLessons: progressRecords.length,
              completedLessons: progressRecords.filter(p => p.percentage === 100).length,
              averageProgress: progressRecords.length > 0 
                ? Math.round(progressRecords.reduce((sum, p) => sum + (p.percentage || 0), 0) / progressRecords.length)
                : 0
            }
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error exporting student report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export student report: ' + error.message
    });
  }
};

module.exports = {
  generateAttendanceReport,
  generateProgressReport,
  generateDashboardReport,
  exportStudentReport
};
