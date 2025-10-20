import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  CalendarToday,
  School,
  People,
  Cake,
  TrendingUp,
  CheckCircle,
  EmojiEvents,
  MenuBook,
  Stars
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAllParentProgress } from '../utils/progressService';
import { getUserBadges, getUserBadgeStats } from '../utils/badgeService';

const MyStudentPage = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [badgeData, setBadgeData] = useState({ badges: [], stats: {} });
  const [error, setError] = useState(null);

  // Fetch progress and badge data
  useEffect(() => {
    if (userProfile && userProfile.role === 'parent' && userProfile.uid) {
      loadProgressData();
    }
  }, [userProfile]);

  const loadProgressData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch progress data for parent
      const progressResult = await getAllParentProgress(userProfile.uid, 'parent');
      
      if (progressResult.success && progressResult.data && progressResult.data.parentProgress && progressResult.data.parentProgress.length > 0) {
        // Get the first (and should be only) student's progress
        const studentProgress = progressResult.data.parentProgress[0];
        setProgressData(studentProgress);
        
        // Fetch badge data
        const [badgesResult, statsResult] = await Promise.all([
          getUserBadges(userProfile.uid),
          getUserBadgeStats(userProfile.uid)
        ]);
        
        setBadgeData({
          badges: badgesResult.success ? badgesResult.data : [],
          stats: statsResult.success ? statsResult.data : {}
        });
      } else {
        // No progress data yet
        setProgressData({ 
          averageProgress: 0, 
          completedLessons: 0, 
          totalLessons: 0,
          lessons: []
        });
      }
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is parent
  if (!userProfile || userProfile.role !== 'parent') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh',
        textAlign: 'center'
      }}>
        <Typography variant="h4" sx={{ color: 'hsl(152, 65%, 28%)', mb: 2 }}>
          Access Denied
        </Typography>
        <Typography variant="h6" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, color: 'text.secondary', mb: 2 }}>
          You don't have permission to access this page.
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          This page is only available for parents.
        </Typography>
      </Box>
    );
  }

  // Get child information
  const childFirstName = userProfile.childFirstName || '';
  const childMiddleName = userProfile.childMiddleName || '';
  const childLastName = userProfile.childLastName || '';
  const childFullName = [childFirstName, childMiddleName, childLastName].filter(Boolean).join(' ') || 'N/A';

  // Get birth date
  const getBirthDate = () => {
    if (!userProfile.childBirthMonth || !userProfile.childBirthDay || !userProfile.childBirthYear) {
      return 'N/A';
    }
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = typeof userProfile.childBirthMonth === 'number' 
      ? months[userProfile.childBirthMonth - 1] 
      : userProfile.childBirthMonth;
    return `${monthName} ${userProfile.childBirthDay}, ${userProfile.childBirthYear}`;
  };

  // Calculate age
  const getAge = () => {
    if (!userProfile.childBirthYear || !userProfile.childBirthMonth || !userProfile.childBirthDay) {
      return 'N/A';
    }
    const birthDate = new Date(userProfile.childBirthYear, userProfile.childBirthMonth - 1, userProfile.childBirthDay);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Box>
      {/* Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: 'linear-gradient(135deg, hsl(152, 65%, 28%) 0%, hsl(145, 60%, 40%) 100%)',
          color: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Person sx={{ fontSize: 40, mr: 2, color: 'white' }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif', 
              fontWeight: 700,
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            My Student
          </Typography>
        </Box>
        <Typography 
          variant="body1" 
          sx={{ 
            opacity: 0.95,
            fontSize: '1.1rem',
            color: 'white'
          }}
        >
          View your child's information, profile, and learning progress
        </Typography>
      </Paper>

      {/* Student Information Card */}
      <Paper sx={{ 
        p: 4, 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(15px)', 
        border: '2px solid rgba(31, 120, 80, 0.2)', 
        borderRadius: '16px', 
        boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' 
      }}>
        {/* Child Avatar and Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar 
            src={userProfile?.photoURL || ''}
            sx={{ 
              width: 80,
              height: 80,
              background: userProfile?.photoURL ? 'transparent' : 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              fontSize: '2rem',
              mr: 3
            }}
          >
            {!userProfile?.photoURL && (childFirstName ? childFirstName.charAt(0).toUpperCase() : 'S')}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(152, 65%, 28%)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {childFullName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Student Profile
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Student Information Grid */}
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: 'hsl(152, 65%, 28%)',
          mb: 3,
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
          Personal Information
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Full Name */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Full Name
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {childFullName}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Sex/Gender */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Sex
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {userProfile.childSex || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Date of Birth */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarToday sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Date of Birth
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {getBirthDate()}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Age */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Cake sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Age
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {getAge()} years old
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Handedness */}
          {userProfile.childHandedness && (
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card sx={{ height: '100%', boxShadow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Handedness
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {userProfile.childHandedness}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Currently Studying */}
          {userProfile.isStudying && (
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card sx={{ height: '100%', boxShadow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <School sx={{ color: 'hsl(152, 65%, 28%)' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Currently Studying
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {userProfile.isStudying}
                    {userProfile.isStudying === 'Yes' && userProfile.schoolName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        at {userProfile.schoolName}
                      </Typography>
                    )}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Number of Siblings */}
          {userProfile.numberOfSiblings && (
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card sx={{ height: '100%', boxShadow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <People sx={{ color: 'hsl(152, 65%, 28%)' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Number of Siblings
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {userProfile.numberOfSiblings}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Birth Order */}
          {userProfile.birthOrder && (
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Card sx={{ height: '100%', boxShadow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Birth Order
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {userProfile.birthOrder}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>

        {/* Address Information */}
        {(userProfile.address || userProfile.barangay || userProfile.municipality || userProfile.province || userProfile.region) && (
          <>
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'hsl(152, 65%, 28%)',
              mb: 3,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              Address Information
            </Typography>

            <Card sx={{ boxShadow: 1 }}>
              <CardContent>
                <Typography variant="body1" fontWeight={500}>
                  {userProfile.address}
                  {userProfile.barangay && `, ${userProfile.barangay}`}
                  {userProfile.municipality && `, ${userProfile.municipality}`}
                  {userProfile.province && `, ${userProfile.province}`}
                  {userProfile.region && `, ${userProfile.region}`}
                </Typography>
              </CardContent>
            </Card>
          </>
        )}

        {/* Parent Information */}
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          color: 'hsl(152, 65%, 28%)',
          mb: 3,
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
          Parent/Guardian Information
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* Parent Name */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Parent Name
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {`${userProfile.firstName || ''} ${userProfile.middleName || ''} ${userProfile.lastName || ''}`.trim() || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Email */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Email
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {userProfile.email || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Phone */}
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Card sx={{ height: '100%', boxShadow: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Phone sx={{ color: 'hsl(152, 65%, 28%)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Phone Number
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={500}>
                  {userProfile.phone || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Father Information */}
        {(userProfile.fatherFirstName || userProfile.fatherMiddleName || userProfile.fatherLastName) && (
          <>
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'hsl(152, 65%, 28%)',
              mb: 3,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              Father Information
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card sx={{ height: '100%', boxShadow: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Father's Name
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {[userProfile.fatherFirstName, userProfile.fatherMiddleName, userProfile.fatherLastName].filter(Boolean).join(' ') || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {userProfile.fatherAge && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Age
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {userProfile.fatherAge} years old
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {userProfile.fatherOccupation && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <School sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Occupation
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {userProfile.fatherOccupation}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {userProfile.fatherEducation && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <School sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Educational Attainment
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {userProfile.fatherEducation}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </>
        )}

        {/* Mother Information */}
        {(userProfile.motherFirstName || userProfile.motherMiddleName || userProfile.motherLastName) && (
          <>
            <Divider sx={{ my: 4 }} />
            
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'hsl(152, 65%, 28%)',
              mb: 3,
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              Mother Information
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Card sx={{ height: '100%', boxShadow: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Mother's Name
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={500}>
                      {[userProfile.motherFirstName, userProfile.motherMiddleName, userProfile.motherLastName].filter(Boolean).join(' ') || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {userProfile.motherAge && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Age
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {userProfile.motherAge} years old
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {userProfile.motherOccupation && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <School sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Occupation
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {userProfile.motherOccupation}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {userProfile.motherEducation && (
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <School sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Educational Attainment
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={500}>
                        {userProfile.motherEducation}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Learning Progress Section */}
      {loading ? (
        <Paper sx={{ 
          p: 4, 
          mt: 4,
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(15px)', 
          border: '2px solid rgba(31, 120, 80, 0.2)', 
          borderRadius: '16px', 
          boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' 
        }}>
          <CircularProgress sx={{ color: 'hsl(152, 65%, 28%)' }} />
        </Paper>
      ) : error ? (
        <Paper sx={{ p: 4, mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Paper>
      ) : progressData && (
        <Paper sx={{ 
          p: 4, 
          mt: 4,
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(15px)', 
          border: '2px solid rgba(31, 120, 80, 0.2)', 
          borderRadius: '16px', 
          boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' 
        }}>
          {/* Learning Progress Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <MenuBook sx={{ fontSize: 40, mr: 2, color: 'hsl(152, 65%, 28%)' }} />
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: 'hsl(152, 65%, 28%)',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>
              Learning Progress
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Progress Summary Cards */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {/* Overall Progress */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                border: '2px solid rgba(33, 150, 243, 0.3)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(33, 150, 243, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <TrendingUp sx={{ color: '#1976d2', fontSize: 50, mb: 2 }} />
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#1976d2',
                    mb: 1,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}>
                    {progressData.averageProgress || 0}%
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Overall Progress
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressData.averageProgress || 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#1976d2',
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Lessons Completed */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                border: '2px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(76, 175, 80, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <CheckCircle sx={{ color: '#4caf50', fontSize: 50, mb: 2 }} />
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#4caf50',
                    mb: 1,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}>
                    {progressData.completedLessons || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Lessons Completed
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    out of {progressData.totalLessons || 0} total
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Badges Earned */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
                border: '2px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(255, 193, 7, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <EmojiEvents sx={{ color: '#ffa726', fontSize: 50, mb: 2 }} />
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#ffa726',
                    mb: 1,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}>
                    {badgeData.badges.length || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Badges Earned
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {badgeData.stats.totalPoints || 0} points
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Total Points */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Card sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                border: '2px solid rgba(156, 39, 176, 0.3)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(156, 39, 176, 0.3)'
                }
              }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Stars sx={{ color: '#9c27b0', fontSize: 50, mb: 2 }} />
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700, 
                    color: '#9c27b0',
                    mb: 1,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}>
                    {badgeData.stats.totalPoints || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Total Points
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Keep learning!
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Detailed Lesson Progress */}
          {progressData.lessons && progressData.lessons.length > 0 && (
            <>
              <Divider sx={{ mb: 3 }} />
              
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'hsl(152, 65%, 28%)',
                mb: 3,
                fontFamily: 'Plus Jakarta Sans, sans-serif'
              }}>
                Lesson Progress Details
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {progressData.lessons.slice(0, 10).map((lesson, index) => (
                  <Card key={index} sx={{ 
                    boxShadow: 1,
                    border: '1px solid rgba(31, 120, 80, 0.1)',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: 'rgba(31, 120, 80, 0.3)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: lesson.percentage === 100 ? '#4caf50' : 'hsl(152, 65%, 28%)',
                            width: 40,
                            height: 40
                          }}>
                            {lesson.percentage === 100 ? <CheckCircle /> : <MenuBook />}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {lesson.lessonName || `Lesson ${index + 1}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {lesson.skillName || 'General'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={`${lesson.percentage || 0}%`}
                          color={lesson.percentage === 100 ? 'success' : lesson.percentage >= 50 ? 'warning' : 'default'}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={lesson.percentage || 0}
                        color={lesson.percentage === 100 ? 'success' : 'primary'}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(31, 120, 80, 0.1)'
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {progressData.lessons.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Showing 10 of {progressData.lessons.length} lessons
                </Typography>
              )}
            </>
          )}

          {/* No lessons message */}
          {(!progressData.lessons || progressData.lessons.length === 0) && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <School sx={{ fontSize: 64, color: 'rgba(31, 120, 80, 0.3)', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Lessons Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your child hasn't started any lessons yet. Check back later!
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default MyStudentPage;

