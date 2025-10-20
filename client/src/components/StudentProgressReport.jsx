import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  LinearProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Search,
  Close,
  School,
  CheckCircle,
  EmojiEvents,
  TrendingUp,
  Person
} from '@mui/icons-material';
import { getAllUsers } from '../utils/userService';
import { getAllSections } from '../utils/sectionService';
import { getAllParentProgress } from '../utils/progressService';
import { getUserBadges, getUserBadgeStats } from '../utils/badgeService';

const StudentProgressReport = () => {
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentProgressData, setStudentProgressData] = useState({});
  const [studentBadgeData, setStudentBadgeData] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, students]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResult, sectionsResult, progressResult] = await Promise.all([
        getAllUsers(),
        getAllSections(),
        getAllParentProgress(null, 'admin') // Get all student progress for admin view
      ]);

      if (usersResult.success) {
        // Filter for students only (role: 'parent' in this system represents students)
        const studentUsers = usersResult.data.filter(user => user.role === 'parent');
        setStudents(studentUsers);
        
        // Load progress and badge data for each student
        await loadStudentProgressData(studentUsers);
      }

      if (sectionsResult.success) {
        setSections(sectionsResult.data);
      }

      if (progressResult.success) {
        // Store progress data for all students
        const progressMap = {};
        if (progressResult.data.parentProgress) {
          progressResult.data.parentProgress.forEach(parentProgress => {
            progressMap[parentProgress.parentId] = parentProgress;
          });
        }
        setStudentProgressData(progressMap);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentProgressData = async (studentUsers) => {
    try {
      // Load badge data for each student
      const badgePromises = studentUsers.map(async (student) => {
        const [badgesResult, badgeStatsResult] = await Promise.all([
          getUserBadges(student.uid),
          getUserBadgeStats(student.uid)
        ]);
        
        return {
          studentId: student.uid,
          badges: badgesResult.success ? badgesResult.data : [],
          badgeStats: badgeStatsResult.success ? badgeStatsResult.data : null
        };
      });

      const badgeResults = await Promise.all(badgePromises);
      const badgeMap = {};
      badgeResults.forEach(result => {
        badgeMap[result.studentId] = {
          badges: result.badges,
          badgeStats: result.badgeStats
        };
      });
      
      setStudentBadgeData(badgeMap);
    } catch (error) {
      console.error('Error loading student progress data:', error);
    }
  };

  const filterStudents = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => {
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const childName = student.childName ? student.childName.toLowerCase() : '';
        const email = student.email ? student.email.toLowerCase() : '';
        
        return fullName.includes(searchTerm.toLowerCase()) ||
               childName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase());
      });
      setFilteredStudents(filtered);
    }
  };

  const getStudentSection = (student) => {
    const section = sections.find(s => 
      s.assignedStudents && s.assignedStudents.includes(student.uid)
    );
    return section;
  };

  const openProgressDialog = (student) => {
    setSelectedStudent(student);
    setProgressDialogOpen(true);
  };

  const closeProgressDialog = () => {
    setProgressDialogOpen(false);
    setSelectedStudent(null);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Get real progress data for a student
  const getRealProgressData = (student) => {
    const progressData = studentProgressData[student.uid] || {};
    const badgeData = studentBadgeData[student.uid] || {};
    
    // Calculate lessons completed from progress data
    const lessons = progressData.lessons || [];
    const lessonsCompleted = lessons.filter(lesson => lesson.percentage === 100).length;
    const totalLessons = lessons.length || 0;
    const overallProgress = totalLessons > 0 ? Math.round(lessons.reduce((sum, lesson) => sum + (lesson.percentage || 0), 0) / totalLessons) : 0;
    
    // Get badge data
    const badges = badgeData.badges || [];
    const badgeStats = badgeData.badgeStats || {};
    const badgesEarned = badges.length;
    const totalPoints = badgeStats.totalPoints || badges.reduce((sum, badge) => sum + (badge.points || 0), 0);
    const collectionComplete = badgeStats.completionPercentage || 0;
    const toUnlock = Math.max(0, 20 - badgesEarned); // Assuming 20 total possible badges
    
    return {
      overallProgress,
      lessonsCompleted,
      totalLessons,
      badgesEarned,
      totalPoints,
      collectionComplete,
      toUnlock
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading student data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(15px)', 
        border: '2px solid rgba(31, 120, 80, 0.2)', 
        borderRadius: '20px', 
        boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif', 
              fontWeight: 700, 
              background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', 
              backgroundClip: 'text', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}
          >
            📊 Student Progress Reports
          </Typography>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by student name, child name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              }
            }
          }}
        />
      </Paper>

      {/* Student Progress Table */}
      <TableContainer sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(31, 120, 80, 0.05)' }}>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Student
              </TableCell>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Section
              </TableCell>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Overall Progress
              </TableCell>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Lessons Completed
              </TableCell>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Total Lessons
              </TableCell>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Badges Earned
              </TableCell>
              <TableCell sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => {
              const section = getStudentSection(student);
              const progressData = getRealProgressData(student);
              
              return (
                <TableRow 
                  key={student.uid} 
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(31, 120, 80, 0.02)'
                    }
                  }}
                >
                  {/* Student Column */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'rgba(31, 120, 80, 0.1)',
                          color: 'hsl(152, 65%, 28%)',
                          fontWeight: 600,
                          mr: 2
                        }}
                      >
                        {getInitials(student.firstName, student.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {student.childName || `${student.firstName} ${student.lastName}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Section Column */}
                  <TableCell>
                    {section ? (
                      <Chip
                        label={`${section.name} (Grade ${section.grade || 'N/A'})`}
                        size="small"
                        variant="outlined"
                        sx={{
                          bgcolor: 'rgba(33, 150, 243, 0.1)',
                          color: '#1976d2',
                          borderColor: '#1976d2'
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No Section
                      </Typography>
                    )}
                  </TableCell>

                  {/* Overall Progress Column */}
                  <TableCell>
                    <Box sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TrendingUp sx={{ fontSize: 16, mr: 1, color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {progressData.overallProgress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progressData.overallProgress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(31, 120, 80, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: 'hsl(152, 65%, 28%)'
                          }
                        }}
                      />
                    </Box>
                  </TableCell>

                  {/* Lessons Completed Column */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle sx={{ color: 'success.main', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {progressData.lessonsCompleted}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Total Lessons Column */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <School sx={{ color: 'info.main', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {progressData.totalLessons}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Badges Earned Column */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiEvents sx={{ color: 'warning.main', fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {progressData.badgesEarned}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProgressDialog(student);
                      }}
                      sx={{
                        background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 64, color: 'rgba(31, 120, 80, 0.3)', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {searchTerm ? 'No students found matching your search' : 'No students found'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Students will appear here once they are registered'}
          </Typography>
        </Box>
      )}

      {/* Student Progress Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={closeProgressDialog}
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
              {selectedStudent && getInitials(selectedStudent.firstName, selectedStudent.lastName)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                {selectedStudent?.childName || `${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
                {selectedStudent?.email}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={closeProgressDialog} sx={{ color: 'white' }}>
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStudentSection(selectedStudent) ? (
                    <Chip
                      label={`${getStudentSection(selectedStudent).name} (Grade ${getStudentSection(selectedStudent).grade || 'undefined'})`}
                      sx={{
                        bgcolor: 'rgba(33, 150, 243, 0.1)',
                        color: '#1976d2',
                        fontWeight: 600
                      }}
                    />
                  ) : (
                    <Typography color="text.secondary">No sections assigned</Typography>
                  )}
                </Box>
              </Box>

              {/* Achievements & Badges */}
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(156, 39, 176, 0.1)',
                  borderRadius: 2
                }}>
                  <EmojiEvents sx={{ color: 'purple', mr: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'purple' }}>
                    Achievements & Badges
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Badge Collection
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 3,
                      mb: 3,
                      '& > *': {
                        flex: '1 1 calc(25% - 9px)',
                        minWidth: '150px'
                      }
                    }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                          {getRealProgressData(selectedStudent).badgesEarned}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Badges Earned
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                          {getRealProgressData(selectedStudent).totalPoints}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Points
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                          {getRealProgressData(selectedStudent).collectionComplete}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Collection Complete
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                          {getRealProgressData(selectedStudent).toUnlock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          To Unlock
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Overall Progress
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getRealProgressData(selectedStudent).badgesEarned}/20
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(getRealProgressData(selectedStudent).badgesEarned / 20) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#ff9800'
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', p: 3, pt: 0 }}>
          <Button onClick={closeProgressDialog} variant="contained" sx={{
            background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
            borderRadius: '12px'
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProgressReport;
