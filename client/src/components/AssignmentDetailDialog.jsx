import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import { 
  Assignment,
  Close,
  CalendarToday,
  Grade,
  School,
  Person,
  AttachFile,
  CloudUpload,
  CheckCircle,
  Warning,
  AccessTime,
  FilePresent,
  Delete
} from '@mui/icons-material';
import AssignmentSubmissionDialog from './AssignmentSubmissionDialog';
import { getMySubmissionForAssignment } from '../utils/assignmentService';
import { useAuth } from '../contexts/AuthContext';

const AssignmentDetailDialog = ({ 
  open, 
  onClose, 
  assignment,
  onSubmissionSuccess
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [mySubmission, setMySubmission] = useState(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab(0);
      loadMySubmission();
    }
  }, [open, assignment]);

  const loadMySubmission = async () => {
    if (!assignment || !userProfile) return;
    setLoadingSubmission(true);
    try {
      const result = await getMySubmissionForAssignment(assignment.id);
      if (result.success) {
        setMySubmission(result.data || null);
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSubmitAssignment = () => {
    setSubmissionDialogOpen(true);
  };

  const handleSubmissionSuccess = (submissionData) => {
    setSubmissionDialogOpen(false);
    // Reload submission to show the new one
    loadMySubmission();
    if (onSubmissionSuccess) {
      onSubmissionSuccess(submissionData);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignmentStatus = (dueDate, submission) => {
    // If assignment is submitted and graded, show completed status
    if (submission && submission.status === 'graded') {
      return { 
        status: 'completed', 
        color: 'success', 
        text: 'Completed',
        icon: <CheckCircle />
      };
    }
    
    // If assignment is submitted but not graded yet
    if (submission && submission.status === 'submitted') {
      return { 
        status: 'submitted', 
        color: 'info', 
        text: 'Submitted',
        icon: <CheckCircle />
      };
    }

    // If no submission, check due date
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        status: 'overdue', 
        color: 'error', 
        text: 'Overdue',
        icon: <Warning />
      };
    } else if (diffDays <= 3) {
      return { 
        status: 'urgent', 
        color: 'warning', 
        text: 'Due Soon',
        icon: <AccessTime />
      };
    } else if (diffDays <= 7) {
      return { 
        status: 'upcoming', 
        color: 'info', 
        text: 'Upcoming',
        icon: <CalendarToday />
      };
    } else {
      return { 
        status: 'normal', 
        color: 'success', 
        text: 'On Track',
        icon: <CheckCircle />
      };
    }
  };

  if (!assignment) return null;

  const status = getAssignmentStatus(assignment.dueDate, mySubmission);

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(31, 120, 80, 0.2)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', 
          backgroundClip: 'text', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assignment sx={{ mr: 2, color: 'hsl(152, 65%, 28%)' }} />
            Assignment Details
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {/* Assignment Header */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              {assignment.title}
            </Typography>
            
            {assignment.description && (
              <Typography variant="body1" sx={{ mb: 3, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'text.secondary', lineHeight: 1.6 }}>
                {assignment.description}
              </Typography>
            )}

            {/* Assignment Info Cards */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              {/* Points card removed per letter-only grading */}

              <Card sx={{ 
                flex: '1 1 200px', 
                minWidth: '200px',
                background: 'rgba(255, 152, 0, 0.05)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                borderRadius: '12px'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarToday sx={{ mr: 1, color: '#ff9800', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ff9800' }}>
                      Due Date
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatDate(assignment.dueDate)}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ 
                flex: '1 1 200px', 
                minWidth: '200px',
                background: 'rgba(76, 175, 80, 0.05)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                borderRadius: '12px'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <School sx={{ mr: 1, color: '#4caf50', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      Daycare Center
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {assignment.sectionName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Grade {assignment.sectionGrade}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ 
                flex: '1 1 200px', 
                minWidth: '200px',
                background: status.color === 'error' ? 'rgba(244, 67, 54, 0.05)' : 
                           status.color === 'warning' ? 'rgba(255, 152, 0, 0.05)' :
                           status.color === 'info' ? 'rgba(31, 120, 80, 0.05)' :
                           'rgba(76, 175, 80, 0.05)',
                border: status.color === 'error' ? '1px solid rgba(244, 67, 54, 0.2)' : 
                       status.color === 'warning' ? '1px solid rgba(255, 152, 0, 0.2)' :
                       status.color === 'info' ? '1px solid rgba(31, 120, 80, 0.2)' :
                       '1px solid rgba(76, 175, 80, 0.2)',
                borderRadius: '12px'
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {status.icon}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, ml: 1 }}>
                      Status
                    </Typography>
                  </Box>
                  <Chip 
                    label={status.text} 
                    size="small" 
                    color={status.color} 
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </CardContent>
              </Card>
            </Box>

            {/* Skill and Additional Info */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
              <Chip 
                label={assignment.skillName} 
                color="primary" 
                variant="outlined" 
                sx={{ fontWeight: 600 }}
              />
              {assignment.attachments && assignment.attachments.length > 0 && (
                <Chip 
                  label={`${assignment.attachments.length} Attachments`} 
                  color="secondary" 
                  variant="outlined" 
                  icon={<AttachFile />}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>

          <Divider />

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ px: 4 }}>
              <Tab 
                label="Instructions" 
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              {assignment.attachments && assignment.attachments.length > 0 && (
                <Tab 
                  label={`Attachments (${assignment.attachments.length})`} 
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                />
              )}
              <Tab 
                label={mySubmission ? "My Submission" : "My Submission"} 
                sx={{ textTransform: 'none', fontWeight: 600 }}
                icon={mySubmission ? <CheckCircle /> : null}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ p: 4 }}>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  Assignment Instructions
                </Typography>
                {assignment.instructions ? (
                  <Typography variant="body1" sx={{ 
                    whiteSpace: 'pre-wrap', 
                    lineHeight: 1.6,
                    p: 3,
                    background: 'rgba(31, 120, 80, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(31, 120, 80, 0.2)'
                  }}>
                    {assignment.instructions}
                  </Typography>
                ) : (
                  <Alert severity="info">
                    No specific instructions provided for this assignment.
                  </Alert>
                )}
              </Box>
            )}

            {activeTab === 1 && assignment.attachments && assignment.attachments.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  Assignment Attachments
                </Typography>
                <List>
                  {assignment.attachments.map((attachment, index) => (
                    <ListItem 
                      key={index}
                      sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '8px', 
                        mb: 1,
                        background: 'rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      <ListItemIcon>
                        <FilePresent sx={{ color: 'hsl(152, 65%, 28%)' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={attachment.name || attachment.filename}
                        secondary={attachment.description || 'No description'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* My Submission Tab */}
            {activeTab === (assignment.attachments && assignment.attachments.length > 0 ? 2 : 1) && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  My Submission
                </Typography>
                
                {loadingSubmission ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : mySubmission ? (
                  <Card sx={{ 
                    background: 'rgba(76, 175, 80, 0.05)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    borderRadius: '12px'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Submission Status */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          Submitted
                        </Typography>
                        <Chip 
                          label={mySubmission.status || 'submitted'} 
                          size="small" 
                          color="success" 
                          variant="filled"
                          sx={{ ml: 2 }}
                        />
                      </Box>

                      {/* Submission Details */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Submitted on:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {formatDate(mySubmission.submittedAt)}
                        </Typography>
                      </Box>

                      {/* Submission Text */}
                      {mySubmission.submissionText && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Your Response:
                          </Typography>
                          <Paper sx={{ 
                            p: 2, 
                            background: 'rgba(255, 255, 255, 0.8)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px'
                          }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {mySubmission.submissionText}
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {/* Attachments */}
                      {mySubmission.attachments && mySubmission.attachments.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Your Attachments ({mySubmission.attachments.length}):
                          </Typography>
                          <List>
                            {mySubmission.attachments.map((attachment, index) => (
                              <ListItem 
                                key={index}
                                sx={{ 
                                  border: '1px solid #e0e0e0', 
                                  borderRadius: '8px', 
                                  mb: 1,
                                  background: 'rgba(255, 255, 255, 0.8)'
                                }}
                              >
                                <ListItemIcon>
                                  <FilePresent sx={{ color: 'hsl(152, 65%, 28%)' }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={attachment.name || attachment.filename}
                                  secondary={`${(attachment.size / 1024).toFixed(1)} KB`}
                                />
                                <ListItemSecondaryAction>
                                  <Button
                                    size="small"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  >
                                    View
                                  </Button>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {/* Grade and Feedback */}
                      {mySubmission.grade !== undefined && mySubmission.grade !== null && mySubmission.grade !== '' && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Grade:
                          </Typography>
                          <Chip 
                            label={mySubmission.grade?.toUpperCase()} 
                            size="medium" 
                            color={mySubmission.grade === 'A' ? 'success' : 
                                   mySubmission.grade === 'B' ? 'primary' : 
                                   mySubmission.grade === 'C' ? 'warning' : 
                                   mySubmission.grade === 'D' ? 'error' : 'default'} 
                            variant="filled"
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '1rem',
                              color: 'white'
                            }}
                          />
                        </Box>
                      )}

                      {mySubmission.feedback && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Teacher Feedback:
                          </Typography>
                          <Paper sx={{ 
                            p: 2, 
                            background: 'rgba(31, 120, 80, 0.05)',
                            border: '1px solid rgba(31, 120, 80, 0.2)',
                            borderRadius: '8px'
                          }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                              {mySubmission.feedback}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="info">
                    You haven't submitted this assignment yet. Click "Submit Assignment" to get started.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={onClose} 
            sx={{ 
              borderRadius: '12px',
              px: 3,
              py: 1
            }}
          >
            Close
          </Button>
          <Button 
            onClick={handleSubmitAssignment}
            variant="contained"
            startIcon={mySubmission ? <CloudUpload /> : <CloudUpload />}
            sx={{ 
              background: mySubmission ? 
                'linear-gradient(45deg, #ff9800, #f57c00)' : 
                'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              borderRadius: '12px',
              px: 3,
              py: 1,
              '&:hover': {
                background: mySubmission ? 
                  'linear-gradient(45deg, #f57c00, #ef6c00)' : 
                  'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
              }
            }}
          >
            {mySubmission ? 'Resubmit Assignment' : 'Submit Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Submission Dialog */}
      <AssignmentSubmissionDialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        assignment={assignment}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </>
  );
};

export default AssignmentDetailDialog;

