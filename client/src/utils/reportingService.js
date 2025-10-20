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
    console.error('Reporting API request error:', error);
    throw error;
  }
};

// Generate comprehensive attendance report
export const generateAttendanceReport = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.sectionId) queryParams.append('sectionId', filters.sectionId);
    if (filters.studentId) queryParams.append('studentId', filters.studentId);
    
    const endpoint = `/reports/attendance${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(endpoint);
    
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

// Generate comprehensive progress report
export const generateProgressReport = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.sectionId) queryParams.append('sectionId', filters.sectionId);
    if (filters.studentId) queryParams.append('studentId', filters.studentId);
    if (filters.skillId) queryParams.append('skillId', filters.skillId);
    
    const endpoint = `/reports/progress${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest(endpoint);
    
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

// Generate dashboard report with insights
export const generateDashboardReport = async (period = 'week') => {
  try {
    const response = await apiRequest(`/reports/dashboard?period=${period}`);
    
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

// Export individual student report
export const exportStudentReport = async (studentId, startDate, endDate) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('studentId', studentId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    
    const response = await apiRequest(`/reports/student/export?${queryParams.toString()}`);
    
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

// Helper functions for data analysis
export const analyzeAttendanceTrends = (attendanceData) => {
  if (!attendanceData || !attendanceData.dailyBreakdown) {
    return { trend: 'stable', change: 0 };
  }
  
  const dailyData = Object.entries(attendanceData.dailyBreakdown)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, data]) => ({
      date,
      attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
    }));
  
  if (dailyData.length < 2) {
    return { trend: 'stable', change: 0 };
  }
  
  const firstWeek = dailyData.slice(0, Math.ceil(dailyData.length / 2));
  const secondWeek = dailyData.slice(Math.ceil(dailyData.length / 2));
  
  const firstAvg = firstWeek.reduce((sum, day) => sum + day.attendanceRate, 0) / firstWeek.length;
  const secondAvg = secondWeek.reduce((sum, day) => sum + day.attendanceRate, 0) / secondWeek.length;
  
  const change = Math.round(secondAvg - firstAvg);
  
  let trend = 'stable';
  if (change > 5) trend = 'improving';
  else if (change < -5) trend = 'declining';
  
  return { trend, change, firstAvg: Math.round(firstAvg), secondAvg: Math.round(secondAvg) };
};

export const analyzeProgressTrends = (progressData) => {
  if (!progressData || !progressData.studentProgress) {
    return { trend: 'stable', change: 0 };
  }
  
  const students = Object.values(progressData.studentProgress);
  const averageProgress = students.reduce((sum, student) => sum + student.averageProgress, 0) / students.length;
  
  const highPerformers = students.filter(s => s.averageProgress >= 80).length;
  const lowPerformers = students.filter(s => s.averageProgress < 50).length;
  
  return {
    averageProgress: Math.round(averageProgress),
    highPerformers,
    lowPerformers,
    totalStudents: students.length,
    performanceDistribution: {
      excellent: students.filter(s => s.averageProgress >= 90).length,
      good: students.filter(s => s.averageProgress >= 70 && s.averageProgress < 90).length,
      average: students.filter(s => s.averageProgress >= 50 && s.averageProgress < 70).length,
      needsImprovement: students.filter(s => s.averageProgress < 50).length
    }
  };
};

// Generate insights from report data
export const generateInsights = (attendanceData, progressData) => {
  const insights = [];
  
  // Attendance insights
  if (attendanceData && attendanceData.summary) {
    const { attendanceRate, presentCount, absentCount, totalRecords } = attendanceData.summary;
    
    if (attendanceRate >= 95) {
      insights.push({
        type: 'excellent',
        category: 'attendance',
        title: 'Outstanding Attendance',
        message: `${attendanceRate}% attendance rate shows excellent student engagement`,
        icon: '🎉',
        priority: 'high'
      });
    } else if (attendanceRate >= 85) {
      insights.push({
        type: 'good',
        category: 'attendance',
        title: 'Good Attendance',
        message: `${attendanceRate}% attendance rate indicates healthy student participation`,
        icon: '✅',
        priority: 'medium'
      });
    } else if (attendanceRate < 70) {
      insights.push({
        type: 'concern',
        category: 'attendance',
        title: 'Attendance Concerns',
        message: `${attendanceRate}% attendance rate needs attention. ${absentCount} absent records out of ${totalRecords} total`,
        icon: '⚠️',
        priority: 'high'
      });
    }
  }
  
  // Progress insights
  if (progressData && progressData.summary) {
    const { completionRate, averageProgress, completedLessons, totalLessons } = progressData.summary;
    
    if (completionRate >= 80) {
      insights.push({
        type: 'excellent',
        category: 'progress',
        title: 'Strong Learning Progress',
        message: `${completionRate}% completion rate with ${completedLessons}/${totalLessons} lessons completed`,
        icon: '📈',
        priority: 'high'
      });
    } else if (completionRate >= 60) {
      insights.push({
        type: 'good',
        category: 'progress',
        title: 'Steady Progress',
        message: `${completionRate}% completion rate shows consistent learning`,
        icon: '📊',
        priority: 'medium'
      });
    } else if (completionRate < 40) {
      insights.push({
        type: 'concern',
        category: 'progress',
        title: 'Progress Challenges',
        message: `${completionRate}% completion rate indicates need for additional support`,
        icon: '📉',
        priority: 'high'
      });
    }
  }
  
  return insights;
};

// Generate actionable recommendations
export const generateRecommendations = (insights, attendanceData, progressData) => {
  const recommendations = [];
  
  insights.forEach(insight => {
    if (insight.category === 'attendance' && insight.type === 'concern') {
      recommendations.push({
        category: 'attendance',
        priority: 'high',
        title: 'Improve Attendance',
        action: 'Contact families with frequent absences',
        description: 'Reach out to parents of students with attendance issues to understand barriers',
        timeline: 'Within 1 week',
        resources: ['Parent communication templates', 'Attendance tracking tools']
      });
    }
    
    if (insight.category === 'progress' && insight.type === 'concern') {
      recommendations.push({
        category: 'progress',
        priority: 'medium',
        title: 'Learning Support',
        action: 'Provide additional academic support',
        description: 'Offer tutoring sessions or modify lesson difficulty for struggling students',
        timeline: 'Within 2 weeks',
        resources: ['Learning materials', 'Assessment tools', 'Teacher training']
      });
    }
  });
  
  // Add general recommendations based on data patterns
  if (attendanceData && progressData) {
    const attendanceTrend = analyzeAttendanceTrends(attendanceData);
    const progressTrend = analyzeProgressTrends(progressData);
    
    if (attendanceTrend.trend === 'declining') {
      recommendations.push({
        category: 'engagement',
        priority: 'high',
        title: 'Student Engagement',
        action: 'Implement engagement initiatives',
        description: 'Attendance trend is declining. Consider new activities or programs',
        timeline: 'Within 1 week',
        resources: ['Activity planning guides', 'Engagement strategies']
      });
    }
    
    if (progressTrend.lowPerformers > progressTrend.totalStudents * 0.3) {
      recommendations.push({
        category: 'curriculum',
        priority: 'medium',
        title: 'Curriculum Review',
        action: 'Review and adjust curriculum',
        description: `${progressTrend.lowPerformers} students need additional support. Consider curriculum modifications`,
        timeline: 'Within 1 month',
        resources: ['Curriculum guides', 'Assessment data', 'Teacher feedback']
      });
    }
  }
  
  return recommendations;
};

// Format data for charts and visualizations
export const formatDataForCharts = (reportData) => {
  const chartData = {
    attendance: {
      summary: reportData.attendance?.summary || {},
      dailyTrend: Object.entries(reportData.attendance?.dailyBreakdown || {}).map(([date, data]) => ({
        date,
        present: data.present,
        late: data.late,
        absent: data.absent,
        total: data.total,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      studentBreakdown: Object.entries(reportData.attendance?.studentBreakdown || {}).map(([studentId, data]) => ({
        studentId,
        ...data,
        attendanceRate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      }))
    },
    progress: {
      summary: reportData.progress?.summary || {},
      studentProgress: Object.entries(reportData.progress?.studentProgress || {}).map(([studentId, data]) => ({
        studentId,
        ...data
      })),
      skillBreakdown: reportData.progress?.skillProgress || {}
    }
  };
  
  return chartData;
};
