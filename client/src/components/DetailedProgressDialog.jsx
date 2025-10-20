import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress
} from '@mui/material'
import {
  CheckCircle,
  TrendingUp,
  Warning,
  Info,
  School,
  Assessment,
  Person,
  Grade,
  Email,
  Phone,
  Home,
  Group,
  Work,
  CalendarToday,
  ChildCare,
  School as SchoolIcon,
  LocationOn,
  PersonPin
} from '@mui/icons-material'

const DetailedProgressDialog = ({ open, onClose, studentData, loading = false }) => {
  if (!studentData && !loading) return null

  const getProgressStatus = (progress) => {
    if (progress >= 100) return { status: 'completed', text: 'Completed', color: 'success' }
    if (progress >= 50) return { status: 'in_progress', text: 'In Progress', color: 'warning' }
    if (progress > 0) return { status: 'started', text: 'Started', color: 'info' }
    return { status: 'not_started', text: 'Not Started', color: 'error' }
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'success'
    if (progress >= 50) return 'warning'
    if (progress > 0) return 'info'
    return 'error'
  }

  const progressStatus = getProgressStatus(studentData?.averageProgress || 0)

  // Format birth date
  const formatBirthDate = () => {
    if (studentData?.childBirthMonth && studentData?.childBirthDay && studentData?.childBirthYear) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
      const month = monthNames[studentData.childBirthMonth - 1] || studentData.childBirthMonth
      return `${month} ${studentData.childBirthDay}, ${studentData.childBirthYear}`
    }
    return 'Not specified'
  }

  // Format full address
  const formatFullAddress = () => {
    if (!studentData) return 'Not specified'
    const parts = [
      studentData.address,
      studentData.barangay,
      studentData.municipality,
      studentData.province,
      studentData.region
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Not specified'
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(31, 120, 80, 0.2)',
          boxShadow: '0 20px 60px rgba(31, 120, 80, 0.3)',
          minHeight: '80vh',
          maxHeight: '90vh',
          width: '95vw'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
        color: 'white',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '1.5rem',
        py: 3
      }}>
        📊 Detailed Progress Summary
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 3, md: 4, lg: 5 } }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 400,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary">
              Loading user details...
            </Typography>
          </Box>
        ) : (
          /* Main Container - Flexbox Layout */
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3,
            height: '100%'
          }}>
          {/* Student Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3, 
            p: 3,
            background: 'rgba(31, 120, 80, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(31, 120, 80, 0.2)'
          }}>
            <Avatar sx={{ 
              background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              width: 80,
              height: 80,
              fontSize: '2rem'
            }}>
              {studentData?.studentName ? studentData.studentName.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                {studentData?.studentName || 'Unknown Student'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {studentData?.studentEmail || studentData?.email || 'No email provided'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={progressStatus.text}
                  color={progressStatus.color}
                  icon={progressStatus.status === 'completed' ? <CheckCircle /> : 
                        progressStatus.status === 'in_progress' ? <TrendingUp /> : 
                        progressStatus.status === 'not_started' ? <Warning /> : <Info />}
                  sx={{ fontWeight: 600 }}
                />
                <Chip 
                  label={`${studentData?.averageProgress || 0}% Complete`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                {studentData?.role && (
                  <Chip 
                    label={studentData.role.toUpperCase()}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Content Sections - Flexbox Row */}
          <Box sx={{ 
            display: 'flex', 
            gap: 4,
            flex: 1,
            minHeight: 0,
            alignItems: 'flex-start',
            flexDirection: { xs: 'column', lg: 'row' }
          }}>
            {/* Left Column - User Details */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              flex: { xs: '1 1 100%', lg: '1 1 45%' },
              minWidth: 0
            }}>
              {/* Personal Information */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '12px'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Person sx={{ color: '#4caf50', fontSize: '2rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#2e7d32' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                      Personal Information
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><Email sx={{ color: '#4caf50' }} /></ListItemIcon>
                      <ListItemText 
                        primary="Email" 
                        secondary={studentData?.studentEmail || studentData?.email || 'Not provided'} 
                      />
                    </ListItem>
                    {studentData?.phone && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><Phone sx={{ color: '#4caf50' }} /></ListItemIcon>
                        <ListItemText primary="Phone" secondary={studentData.phone} />
                      </ListItem>
                    )}
                    {studentData?.firstName && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><Person sx={{ color: '#4caf50' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Full Name" 
                          secondary={`${studentData.firstName} ${studentData.lastName || ''}`.trim()} 
                        />
                      </ListItem>
                    )}
                    {studentData?.createdAt && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><CalendarToday sx={{ color: '#4caf50' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Member Since" 
                          secondary={new Date(studentData.createdAt).toLocaleDateString()} 
                        />
                      </ListItem>
                    )}
                    {studentData?.lastLogin && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><CalendarToday sx={{ color: '#4caf50' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Last Login" 
                          secondary={new Date(studentData.lastLogin).toLocaleDateString()} 
                        />
                      </ListItem>
                    )}
                    {studentData?.organization && (
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><Work sx={{ color: '#4caf50' }} /></ListItemIcon>
                        <ListItemText primary="Organization" secondary={studentData.organization} />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>

              {/* Child Information */}
              {(studentData?.childName || studentData?.childSex || studentData?.childBirthMonth) && (
                <Card sx={{ 
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '12px'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <ChildCare sx={{ color: '#ff9800', fontSize: '2rem' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#f57c00' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                        Child Information
                      </Typography>
                    </Box>
                    <List dense>
                      {studentData?.childName && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><PersonPin sx={{ color: '#ff9800' }} /></ListItemIcon>
                          <ListItemText primary="Child Name" secondary={studentData.childName} />
                        </ListItem>
                      )}
                      {studentData?.childSex && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Person sx={{ color: '#ff9800' }} /></ListItemIcon>
                          <ListItemText primary="Gender" secondary={studentData.childSex} />
                        </ListItem>
                      )}
                      {(studentData?.childBirthMonth || studentData?.childBirthDay || studentData?.childBirthYear) && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><CalendarToday sx={{ color: '#ff9800' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Birth Date" 
                            secondary={formatBirthDate()} 
                          />
                        </ListItem>
                      )}
                      {studentData?.childHandedness && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Person sx={{ color: '#ff9800' }} /></ListItemIcon>
                          <ListItemText primary="Handedness" secondary={studentData.childHandedness} />
                        </ListItem>
                      )}
                      {studentData?.birthOrder && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Person sx={{ color: '#ff9800' }} /></ListItemIcon>
                          <ListItemText primary="Birth Order" secondary={studentData.birthOrder} />
                        </ListItem>
                      )}
                      {studentData?.numberOfSiblings && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Group sx={{ color: '#ff9800' }} /></ListItemIcon>
                          <ListItemText primary="Number of Siblings" secondary={studentData.numberOfSiblings} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Address Information */}
              {(studentData?.address || studentData?.barangay || studentData?.municipality || studentData?.province) && (
                <Card sx={{ 
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(142, 36, 170, 0.1) 100%)',
                  border: '1px solid rgba(156, 39, 176, 0.3)',
                  borderRadius: '12px'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <LocationOn sx={{ color: '#9c27b0', fontSize: '2rem' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#7b1fa2' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                        Address Information
                      </Typography>
                    </Box>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><Home sx={{ color: '#9c27b0' }} /></ListItemIcon>
                        <ListItemText 
                          primary="Full Address" 
                          secondary={formatFullAddress()} 
                        />
                      </ListItem>
                      {studentData?.address && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Home sx={{ color: '#9c27b0' }} /></ListItemIcon>
                          <ListItemText primary="Street Address" secondary={studentData.address} />
                        </ListItem>
                      )}
                      {studentData?.barangay && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><LocationOn sx={{ color: '#9c27b0' }} /></ListItemIcon>
                          <ListItemText primary="Barangay" secondary={studentData.barangay} />
                        </ListItem>
                      )}
                      {studentData?.municipality && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><LocationOn sx={{ color: '#9c27b0' }} /></ListItemIcon>
                          <ListItemText primary="Municipality" secondary={studentData.municipality} />
                        </ListItem>
                      )}
                      {studentData?.province && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><LocationOn sx={{ color: '#9c27b0' }} /></ListItemIcon>
                          <ListItemText primary="Province" secondary={studentData.province} />
                        </ListItem>
                      )}
                      {studentData?.region && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><LocationOn sx={{ color: '#9c27b0' }} /></ListItemIcon>
                          <ListItemText primary="Region" secondary={studentData.region} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Right Column - Progress & Family Info */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 3,
              flex: { xs: '1 1 100%', lg: '1 1 55%' },
              minWidth: 0
            }}>
              {/* Progress Overview */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(31, 120, 80, 0.1) 0%, rgba(30, 136, 229, 0.1) 100%)',
                border: '1px solid rgba(31, 120, 80, 0.3)',
                borderRadius: '12px'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <School sx={{ color: 'hsl(145, 60%, 40%)', fontSize: '2rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                      Progress Overview
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                {studentData?.averageProgress || 0}% Complete
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={studentData?.averageProgress || 0}
                              color={getProgressColor(studentData?.averageProgress || 0)}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'rgba(31, 120, 80, 0.2)'
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {studentData?.completedLessons || 0} of {studentData?.totalLessons || 0} lessons completed
                          </Typography>
                  
                  {/* Progress Stats */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    flexWrap: 'wrap'
                  }}>
                            <Box sx={{ textAlign: 'center', flex: '1 1 45%' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#4caf50' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                                {studentData?.completedLessons || 0}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Completed
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'center', flex: '1 1 45%' }}>
                              <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#ff9800' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                                {(studentData?.totalLessons || 0) - (studentData?.completedLessons || 0)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Remaining
                              </Typography>
                            </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Section Details */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '12px'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Assessment sx={{ color: '#4caf50', fontSize: '2rem' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#2e7d32' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                      Section Details
                    </Typography>
                  </Box>
                    <List dense>
                      {studentData?.sections?.map((section, index) => (
                        <ListItem key={section.id} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Grade sx={{ color: '#4caf50' }} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${section.name} (Grade ${section.grade})`}
                            secondary={`Section ID: ${section.id}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                </CardContent>
              </Card>

              {/* Family Information */}
              {(studentData?.fatherName || studentData?.motherName) && (
                <Card sx={{ 
                  background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(229, 57, 53, 0.1) 100%)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '12px'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Group sx={{ color: '#f44336', fontSize: '2rem' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#d32f2f' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                        Family Information
                      </Typography>
                    </Box>
                    <List dense>
                      {studentData?.fatherName && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Person sx={{ color: '#f44336' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Father" 
                            secondary={`${studentData.fatherName}${studentData.fatherAge ? ` (Age: ${studentData.fatherAge})` : ''}`} 
                          />
                        </ListItem>
                      )}
                      {studentData?.fatherOccupation && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Work sx={{ color: '#f44336' }} /></ListItemIcon>
                          <ListItemText primary="Father's Occupation" secondary={studentData.fatherOccupation} />
                        </ListItem>
                      )}
                      {studentData?.fatherEducation && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><School sx={{ color: '#f44336' }} /></ListItemIcon>
                          <ListItemText primary="Father's Education" secondary={studentData.fatherEducation} />
                        </ListItem>
                      )}
                      {studentData?.motherName && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Person sx={{ color: '#f44336' }} /></ListItemIcon>
                          <ListItemText 
                            primary="Mother" 
                            secondary={`${studentData.motherName}${studentData.motherAge ? ` (Age: ${studentData.motherAge})` : ''}`} 
                          />
                        </ListItem>
                      )}
                      {studentData?.motherOccupation && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><Work sx={{ color: '#f44336' }} /></ListItemIcon>
                          <ListItemText primary="Mother's Occupation" secondary={studentData.motherOccupation} />
                        </ListItem>
                      )}
                      {studentData?.motherEducation && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><School sx={{ color: '#f44336' }} /></ListItemIcon>
                          <ListItemText primary="Mother's Education" secondary={studentData.motherEducation} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* School Information */}
              {studentData?.schoolName && (
                <Card sx={{ 
                  background: 'linear-gradient(135deg, rgba(103, 58, 183, 0.1) 0%, rgba(94, 53, 177, 0.1) 100%)',
                  border: '1px solid rgba(103, 58, 183, 0.3)',
                  borderRadius: '12px'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <SchoolIcon sx={{ color: '#673ab7', fontSize: '2rem' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#512da8' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                        School Information
                      </Typography>
                    </Box>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><SchoolIcon sx={{ color: '#673ab7' }} /></ListItemIcon>
                        <ListItemText primary="School Name" secondary={studentData.schoolName} />
                      </ListItem>
                      {studentData?.isStudying && (
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon><School sx={{ color: '#673ab7' }} /></ListItemIcon>
                          <ListItemText primary="Currently Studying" secondary={studentData.isStudying} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, background: 'rgba(31, 120, 80, 0.05)' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
            borderRadius: '8px',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(31, 120, 80, 0.4)'
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DetailedProgressDialog

