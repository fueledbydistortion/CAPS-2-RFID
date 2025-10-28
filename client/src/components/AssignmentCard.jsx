import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Assignment,
  Schedule,
  CheckCircle,
  Upload,
  Visibility,
  Grade
} from '@mui/icons-material';
import AssignmentSubmissionDialog from './AssignmentSubmissionDialog';

const AssignmentCard = ({ 
  assignment, 
  submission, 
  onSubmissionSuccess,
  onViewSubmission 
}) => {
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded':
        return 'success';
      case 'submitted':
        return 'info';
      case 'needs_revision':
        return 'warning';
      case 'incomplete':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'graded':
        return 'Graded';
      case 'submitted':
        return 'Submitted';
      case 'needs_revision':
        return 'Needs Revision';
      case 'incomplete':
        return 'Incomplete';
      default:
        return 'Not Submitted';
    }
  };

  const handleSubmitAssignment = () => {
    setSubmissionDialogOpen(true);
  };

  const handleSubmissionSuccess = (submissionData) => {
    setSubmissionDialogOpen(false);
    if (onSubmissionSuccess) {
      onSubmissionSuccess(submissionData);
    }
  };

  return (
    <>
      <Card sx={{ 
        mb: 2, 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(15px)', 
        border: '2px solid rgba(31, 120, 80, 0.2)', 
        borderRadius: '16px', 
        boxShadow: '0 6px 20px rgba(31, 120, 80, 0.15)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 30px rgba(31, 120, 80, 0.25)'
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Assignment sx={{ mr: 2, color: 'hsl(152, 65%, 28%)', fontSize: '2rem' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 0.5 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  {assignment.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {assignment.description}
                </Typography>
              </Box>
            </Box>
            
            {/* Status Chip */}
            <Chip 
              label={getStatusText(submission?.status)}
              color={getStatusColor(submission?.status)}
              size="small"
              icon={submission?.status === 'graded' ? <CheckCircle /> : undefined}
            />
          </Box>

          {/* Assignment Details */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip 
                icon={<Schedule />}
                label={`Due: ${formatDate(assignment.dueDate)}`} 
                color={isOverdue(assignment.dueDate) ? 'error' : 'default'}
                size="small" 
              />
              {/* Points chip removed per letter-only grading */}
            </Box>

            {/* Instructions */}
            {assignment.instructions && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'hsl(152, 65%, 28%)' }}>
                  Instructions:
                </Typography>
                <Typography variant="body2" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.6,
                  background: 'rgba(31, 120, 80, 0.05)',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid rgba(31, 120, 80, 0.1)'
                }}>
                  {assignment.instructions}
                </Typography>
              </Box>
            )}

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'hsl(152, 65%, 28%)' }}>
                  Assignment Materials:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {assignment.attachments.map((file, index) => (
                    <Chip 
                      key={index}
                      label={file.name}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Submission Status */}
          {submission && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'hsl(152, 65%, 28%)' }}>
                Your Submission:
              </Typography>
              
              {submission.submissionText && (
                <Typography variant="body2" sx={{ 
                  mb: 1,
                  background: 'rgba(76, 175, 80, 0.05)',
                  p: 2,
                  borderRadius: '8px',
                  border: '1px solid rgba(76, 175, 80, 0.2)'
                }}>
                  {submission.submissionText}
                </Typography>
              )}

              {submission.attachments && submission.attachments.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {submission.attachments.map((file, index) => (
                    <Chip 
                      key={index}
                      label={file.name}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}

              {/* Grade Display */}
              {submission.grade !== undefined && submission.grade !== null && submission.grade !== '' && (
                <Box sx={{ mt: 2, p: 2, background: 'rgba(31, 120, 80, 0.05)', borderRadius: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Grade sx={{ color: 'hsl(152, 65%, 28%)' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)' }}>
                      Grade: {submission.grade?.toUpperCase()}
                    </Typography>
                  </Box>
                  {submission.feedback && (
                    <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'text.secondary' }}>
                      Feedback: {submission.feedback}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* Overdue Warning */}
          {isOverdue(assignment.dueDate) && !submission && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This assignment is overdue. Please submit as soon as possible.
            </Alert>
          )}
        </CardContent>

        <CardActions sx={{ p: 3, pt: 0 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            {!submission ? (
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={handleSubmitAssignment}
                sx={{
                  background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
                  }
                }}
              >
                Submit Assignment
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => onViewSubmission && onViewSubmission(submission)}
                  sx={{
                    borderRadius: '12px',
                    borderColor: 'hsl(152, 65%, 28%)',
                    color: 'hsl(152, 65%, 28%)',
                    '&:hover': {
                      borderColor: '#0d47a1',
                      backgroundColor: 'rgba(21, 101, 192, 0.04)'
                    }
                  }}
                >
                  View Submission
                </Button>
                
                {submission.status !== 'graded' && (
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    onClick={handleSubmitAssignment}
                    sx={{
                      background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                      borderRadius: '12px',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
                      }
                    }}
                  >
                    Resubmit
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </CardActions>
      </Card>

      {/* Submission Dialog */}
      <AssignmentSubmissionDialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        assignment={assignment}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </>
  );
};

export default AssignmentCard;

