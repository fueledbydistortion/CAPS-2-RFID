import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  People,
  School,
  TrendingUp,
  CheckCircle,
  Warning,
  Info,
  Refresh,
  Visibility,
  Schedule,
  Notifications,
  Close,
  EmojiEvents,
  Search
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAllParentProgress } from '../utils/progressService';
import { getAllSchedules } from '../utils/scheduleService';
import { getAllAnnouncements } from '../utils/announcementService';
import { getAllSections } from '../utils/sectionService';
import { getAllSkills } from '../utils/skillService';
import { getUserById, getAllUsers } from '../utils/userService';
import ProgressCharts from './ProgressCharts';
import AttendanceCharts from './AttendanceCharts';
import { getAllAttendance } from '../utils/attendanceService';
import { getUserBadges, getUserBadgeStats } from '../utils/badgeService';

const StudentProgressOverview = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState({
    sections: [],
    parentProgress: [],
    summary: {
      totalParents: 0,
      totalLessons: 0,
      averageProgress: 0,
      completedLessons: 0
    }
  });
  const [attendanceData, setAttendanceData] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [studentProgressDataMap, setStudentProgressDataMap] = useState({});
  const [studentBadgeDataMap, setStudentBadgeDataMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProgress, setFilteredProgress] = useState([]);

  useEffect(() => {
    loadData();
  }, [userProfile]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, progressData.parentProgress]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadParentProgress(),
        loadAttendanceData(),
        loadEvents(),
        loadStudentBadgeData()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentBadgeData = async () => {
    try {
      const usersResult = await getAllUsers();
      if (usersResult.success) {
        const students = usersResult.data.filter(user => user.role === 'parent');
        const badgeDataMap = {};
        
        for (const student of students) {
          try {
            const [badgesResult, statsResult] = await Promise.all([
              getUserBadges(student.uid),
              getUserBadgeStats(student.uid)
            ]);
            
            badgeDataMap[student.uid] = {
              badges: badgesResult.success ? badgesResult.data : [],
              stats: statsResult.success ? statsResult.data : {}
            };
          } catch (error) {
            console.error(`Error loading badge data for student ${student.uid}:`, error);
          }
        }
        
        setStudentBadgeDataMap(badgeDataMap);
      }
    } catch (error) {
      console.error('Error loading student badge data:', error);
    }
  };

  const loadParentProgress = async () => {
    try {
      let result;
      if (userProfile?.role === 'teacher') {
        result = await getAllParentProgress(userProfile.uid, 'teacher');
      } else {
        result = await getAllParentProgress(null, 'admin');
      }
      
      if (result.success) {
        setProgressData(result.data);
        
        // Create a map for easy lookup
        const progressMap = {};
        if (result.data.parentProgress) {
          result.data.parentProgress.forEach(parentProgress => {
            progressMap[parentProgress.studentId] = parentProgress;
          });
        }
        setStudentProgressDataMap(progressMap);
      }
    } catch (error) {
      console.error('Error loading parent progress:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      const result = await getAllAttendance();
      if (result.success) {
        setAttendanceData(result.data);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayEventsList = [];
      const upcomingEventsList = [];

      const sectionsResult = await getAllSections();
      const skillsResult = await getAllSkills();
      
      const sectionsMap = {};
      const skillsMap = {};
      
      if (sectionsResult.success) {
        sectionsResult.data.forEach(section => {
          sectionsMap[section.id] = section.name;
        });
      }
      
      if (skillsResult.success) {
        skillsResult.data.forEach(skill => {
          skillsMap[skill.id] = skill.name;
        });
      }

      const schedulesResult = await getAllSchedules();
      if (schedulesResult.success) {
        setSchedules(schedulesResult.data);
        
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todaySchedules = schedulesResult.data.filter(schedule => schedule.day === dayName);
        
        todaySchedules.forEach(schedule => {
          const subjectName = skillsMap[schedule.subjectId] || schedule.subjectId;
          const sectionName = sectionsMap[schedule.sectionId] || schedule.sectionId;
          
          todayEventsList.push({
            id: schedule.id,
            type: 'schedule',
            title: `Class: ${subjectName}`,
            time: `${schedule.timeIn} - ${schedule.timeOut}`,
            description: `Section: ${sectionName}`,
            icon: <Schedule />
          });
        });

        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);
          const dateStr = futureDate.toISOString().split('T')[0];
          const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'long' });
          
          const futureSchedules = schedulesResult.data.filter(schedule => schedule.day === dayName);
          
          futureSchedules.forEach(schedule => {
            const subjectName = skillsMap[schedule.subjectId] || schedule.subjectId;
            const sectionName = sectionsMap[schedule.sectionId] || schedule.sectionId;
            
            upcomingEventsList.push({
              id: `${schedule.id}-${dateStr}`,
              type: 'schedule',
              title: `Class: ${subjectName}`,
              time: dateStr,
              description: `${sectionName} - ${schedule.timeIn} to ${schedule.timeOut}`,
              icon: <Schedule />
            });
          });
        }
      }

      const announcementsResult = await getAllAnnouncements();
      if (announcementsResult.success) {
        const todayAnnouncements = announcementsResult.data.filter(announcement => announcement.date === today);
        
        todayAnnouncements.forEach(announcement => {
          todayEventsList.push({
            id: announcement.id,
            type: 'announcement',
            title: announcement.title,
            time: announcement.type,
            description: announcement.description,
            icon: <Schedule />
          });
        });

        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);
          const dateStr = futureDate.toISOString().split('T')[0];
          
          const futureAnnouncements = announcementsResult.data.filter(announcement => announcement.date === dateStr);
          
          futureAnnouncements.forEach(announcement => {
            upcomingEventsList.push({
              id: `${announcement.id}-${dateStr}`,
              type: 'announcement',
              title: announcement.title,
              time: dateStr,
              description: announcement.description,
              icon: <Schedule />
            });
          });
        }
      }

      upcomingEventsList.sort((a, b) => new Date(a.time) - new Date(b.time));

      setTodayEvents(todayEventsList);
      setUpcomingEvents(upcomingEventsList);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredProgress(progressData.parentProgress || []);
    } else {
      const filtered = (progressData.parentProgress || []).filter(student => {
        const studentName = student.studentName?.toLowerCase() || '';
        const studentEmail = student.studentEmail?.toLowerCase() || '';
        const sections = student.sections?.map(s => s.name.toLowerCase()).join(' ') || '';
        
        return studentName.includes(searchTerm.toLowerCase()) ||
               studentEmail.includes(searchTerm.toLowerCase()) ||
               sections.includes(searchTerm.toLowerCase());
      });
      setFilteredProgress(filtered);
    }
  };

  const getRealProgressData = (studentData) => {
    const studentId = studentData.studentId;
    const progressInfo = studentProgressDataMap[studentId] || {};
    const badgeInfo = studentBadgeDataMap[studentId] || { badges: [], stats: {} };
    
    const lessons = progressInfo.lessons || [];
    const lessonsCompleted = lessons.filter(lesson => lesson.percentage === 100).length;
    const totalLessons = lessons.length || 0;
    const overallProgress = totalLessons > 0 ? Math.round(lessons.reduce((sum, lesson) => sum + (lesson.percentage || 0), 0) / totalLessons) : 0;
    
    return {
      overallProgress,
      lessonsCompleted,
      totalLessons,
      badgesEarned: badgeInfo.badges ? badgeInfo.badges.length : 0,
      totalPoints: badgeInfo.stats?.totalPoints || 0,
      collectionComplete: badgeInfo.stats?.collectionComplete || 0,
      toUnlock: badgeInfo.stats?.toUnlock || 0
    };
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    return parts.map(p => p.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  const handleOpenDialog = async (studentData) => {
    setSelectedStudent(studentData);
    setLoadingUserData(true);
    setDialogOpen(true);
    
    try {
      const result = await getUserById(studentData.studentId);
      if (result.success) {
        const combinedData = {
          ...result.data,
          ...studentData,
          studentName: studentData.studentName,
          studentEmail: studentData.studentEmail,
          averageProgress: studentData.averageProgress,
          completedLessons: studentData.completedLessons,
          totalLessons: studentData.totalLessons,
          sections: studentData.sections
        };
        setFullUserData(combinedData);
      } else {
        setFullUserData(studentData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setFullUserData(studentData);
    } finally {
      setLoadingUserData(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStudent(null);
    setFullUserData(null);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const getProgressStatus = (percentage) => {
    if (percentage >= 100) return { status: 'completed', color: 'success', text: 'Completed' };
    if (percentage >= 75) return { status: 'almost_done', color: 'info', text: 'Almost Done' };
    if (percentage >= 50) return { status: 'in_progress', color: 'warning', text: 'In Progress' };
    if (percentage > 0) return { status: 'started', color: 'info', text: 'Started' };
    return { status: 'not_started', color: 'default', text: 'Not Started' };
  };


  // Only show for admin and teacher
  if (userProfile?.role !== 'admin' && userProfile?.role !== 'teacher') {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Warning sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Access Restricted
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This section is only available for administrators and teachers.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 4, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>
            Student Progress Overview
          </Typography>
          <IconButton onClick={loadParentProgress} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search by student name, email, or section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'hsl(152, 65%, 28%)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: 'hsl(152, 65%, 28%)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'hsl(152, 65%, 28%)',
                },
              },
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards - Using Flexbox */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 3, 
              mb: 4,
              justifyContent: 'center'
            }}>
              <Card sx={{ 
                flex: '1 1 250px',
                minWidth: '250px',
                maxWidth: '300px',
                background: 'rgba(31, 120, 80, 0.1)',
                border: '2px solid rgba(31, 120, 80, 0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(31, 120, 80, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <People sx={{ fontSize: 40, color: 'hsl(152, 65%, 28%)', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'hsl(152, 65%, 28%)', mb: 1 }}>
                    {progressData.summary.totalParents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                flex: '1 1 250px',
                minWidth: '250px',
                maxWidth: '300px',
                background: 'rgba(76, 175, 80, 0.1)',
                border: '2px solid rgba(76, 175, 80, 0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <School sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#4caf50', mb: 1 }}>
                    {progressData.summary.totalLessons}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Lessons
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                flex: '1 1 250px',
                minWidth: '250px',
                maxWidth: '300px',
                background: 'rgba(255, 152, 0, 0.1)',
                border: '2px solid rgba(255, 152, 0, 0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <TrendingUp sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#ff9800', mb: 1 }}>
                    {progressData.summary.averageProgress}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Progress
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ 
                flex: '1 1 250px',
                minWidth: '250px',
                maxWidth: '300px',
                background: 'rgba(156, 39, 176, 0.1)',
                border: '2px solid rgba(156, 39, 176, 0.2)',
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(156, 39, 176, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <CheckCircle sx={{ fontSize: 40, color: '#9c27b0', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: '#9c27b0', mb: 1 }}>
                    {progressData.summary.completedLessons}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Lessons
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Student Progress Table */}
            {filteredProgress.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <People sx={{ fontSize: 64, color: 'rgba(31, 120, 80, 0.3)', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {searchTerm ? 'No students found matching your search' : 'No student progress data found'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search terms' : 'No students are assigned to your sections yet'}
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ 
                boxShadow: 'none', 
                border: '1px solid rgba(31, 120, 80, 0.2)', 
                borderRadius: '12px',
                maxHeight: '700px',
                overflow: 'auto',
                mb: 4
              }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(31, 120, 80, 0.05)' }}>
                      <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>Student</TableCell>
                      <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>Sections</TableCell>
                      <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>Progress</TableCell>
                      <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>Lessons</TableCell>
                      <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProgress.map((parent) => {
                      const progressStatus = getProgressStatus(parent.averageProgress);
                      return (
                        <TableRow key={parent.studentId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ 
                                background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                                width: 40,
                                height: 40
                              }}>
                                {parent.studentName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500} sx={{ color: 'hsl(152, 65%, 28%)' }}>
                                  {parent.studentName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {parent.studentEmail}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {parent.sections.map((section) => (
                                <Chip 
                                  key={section.id}
                                  label={`${section.name} (Grade ${section.grade})`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ minWidth: 100 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {parent.averageProgress}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={parent.averageProgress} 
                                color={getProgressColor(parent.averageProgress)}
                                sx={{ 
                                  height: 6, 
                                  borderRadius: 3,
                                  backgroundColor: 'rgba(31, 120, 80, 0.1)'
                                }} 
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {parent.completedLessons}/{parent.totalLessons}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              completed
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={progressStatus.text}
                              size="small"
                              color={progressStatus.color}
                              variant="filled"
                              icon={progressStatus.status === 'completed' ? <CheckCircle /> : 
                                    progressStatus.status === 'in_progress' ? <TrendingUp /> : 
                                    progressStatus.status === 'not_started' ? <Warning /> : <Info />}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View detailed progress">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleOpenDialog(parent)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Bottom Section: Charts + Schedule + Events */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mt: 4 }}>
              
              {/* Left Column: Charts and Schedule */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Charts Section */}
                <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
                  <Typography variant="h5" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, color: 'hsl(152, 65%, 28%)', mb: 3 }}>
                    Analytics & Reports
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <ProgressCharts progressData={progressData} />
                    {attendanceData.length > 0 && (
                      <AttendanceCharts attendanceData={attendanceData} />
                    )}
                  </Box>
                </Paper>

                {/* Today's Schedule */}
                <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Schedule sx={{ color: 'hsl(152, 65%, 28%)', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>
                      Today's Schedule
                    </Typography>
                  </Box>
                  
                  {todayEvents.length > 0 ? (
                    <List>
                      {todayEvents.map((event, index) => (
                        <ListItem key={event.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            {event.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={event.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {event.time}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {event.description}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No events scheduled for today
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* Right Column: Upcoming Events */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                

                {/* Upcoming Events */}
                <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Notifications sx={{ color: 'hsl(152, 65%, 28%)', mr: 2 }} />
                    <Typography variant="h6" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>
                      Upcoming Events
                    </Typography>
                  </Box>
                  
                  {upcomingEvents.length > 0 ? (
                    <List>
                      {upcomingEvents.slice(0, 5).map((event, index) => (
                        <ListItem key={event.id} sx={{ px: 0, py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {event.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {event.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {event.time}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {event.description}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No upcoming events
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          </>
        )}
      </Paper>

      {/* Detailed Progress Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
          color: 'white',
          borderRadius: '20px 20px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mr: 2
              }}
            >
              {selectedStudent && getInitials(selectedStudent.studentName)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                {selectedStudent?.studentName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                {selectedStudent?.studentEmail}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 4 }}>
          {selectedStudent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Learning Progress Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(156, 39, 176, 0.1)',
                  borderRadius: 2
                }}>
                  <School sx={{ color: 'purple', mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'purple' }}>
                    Learning Progress
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2,
                  '& > *': {
                    flex: '1 1 calc(25% - 6px)',
                    minWidth: '200px'
                  }
                }}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                    border: '2px solid rgba(33, 150, 243, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ color: '#1976d2', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                        {getRealProgressData(selectedStudent).overallProgress}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Progress
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
                    border: '2px solid rgba(76, 175, 80, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <CheckCircle sx={{ color: '#4caf50', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                        {getRealProgressData(selectedStudent).lessonsCompleted}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lessons Completed
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)',
                    border: '2px solid rgba(255, 152, 0, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <School sx={{ color: '#ff9800', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                        {getRealProgressData(selectedStudent).totalLessons}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Lessons
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                    border: '2px solid rgba(156, 39, 176, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <School sx={{ color: '#9c27b0', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>
                        {getRealProgressData(selectedStudent).totalLessons - getRealProgressData(selectedStudent).lessonsCompleted}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Remaining
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Enrolled Sections */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(156, 39, 176, 0.1)',
                  borderRadius: 2
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'purple' }}>
                    Enrolled Sections
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedStudent.sections && selectedStudent.sections.map((section, index) => (
                    <Chip
                      key={index}
                      label={`${section.name} (Grade ${section.grade})`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.95rem', fontWeight: 500 }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Badge Collection Section */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: 2
                }}>
                  <EmojiEvents sx={{ color: '#ff9800', mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff9800' }}>
                    Badge Collection
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2,
                  '& > *': {
                    flex: '1 1 calc(25% - 6px)',
                    minWidth: '200px'
                  }
                }}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                    border: '2px solid rgba(255, 193, 7, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <EmojiEvents sx={{ color: '#ffa726', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffa726' }}>
                        {getRealProgressData(selectedStudent).badgesEarned}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Badges Earned
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
                    border: '2px solid rgba(233, 30, 99, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ color: '#e91e63', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#e91e63' }}>
                        {getRealProgressData(selectedStudent).totalPoints}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Points
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)',
                    border: '2px solid rgba(63, 81, 181, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <CheckCircle sx={{ color: '#3f51b5', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#3f51b5' }}>
                        {getRealProgressData(selectedStudent).collectionComplete}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Collections Complete
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
                    border: '2px solid rgba(0, 150, 136, 0.2)'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Info sx={{ color: '#009688', fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#009688' }}>
                        {getRealProgressData(selectedStudent).toUnlock}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        To Unlock
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              '&:hover': {
                background: 'linear-gradient(45deg, hsl(152, 65%, 20%), hsl(145, 60%, 30%))'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProgressOverview;

