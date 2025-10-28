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
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Assignment,
  Close,
  Grade,
  Person,
  AttachFile,
  CheckCircle,
  Warning,
  AccessTime,
  FilePresent,
  Download,
  Star,
  StarBorder,
  Visibility
} from '@mui/icons-material';
import { getAssignmentSubmissions, gradeAssignmentSubmission } from '../utils/assignmentService';

const AssignmentGradingDialog = ({ 
  open, 
  onClose, 
  assignment,
  onGradingSuccess
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    grade: '',
    feedback: '',
    status: 'graded'
  });
  const [errors, setErrors] = useState({});

  // Simplified letter grade system matching backend
  const LETTER_GRADES = ['A', 'B', 'C', 'D', 'F'];

  // Normalize any incoming grade (letter or numeric) to a letter grade
  const toLetter = (raw) => {
    if (raw === undefined || raw === null) return '';
    if (typeof raw === 'string') {
      const s = raw.trim().toUpperCase();
      // If string is numeric, fall through to numeric mapping
      if (LETTER_GRADES.includes(s)) return s;
      const n = Number(s);
      if (Number.isFinite(n)) {
        if (n >= 90) return 'A';
        if (n >= 80) return 'B';
        if (n >= 70) return 'C';
        if (n >= 60) return 'D';
        return 'F';
      }
      return '';
    }
    const n = Number(raw);
    if (Number.isFinite(n)) {
      if (n >= 90) return 'A';
      if (n >= 80) return 'B';
      if (n >= 70) return 'C';
      if (n >= 60) return 'D';
      return 'F';
    }
    return '';
  };

  const getGradeColor = (grade) => {
    const letter = toLetter(grade);
    if (letter === 'A') return 'success';
    if (letter === 'B') return 'primary';
    if (letter === 'C') return 'warning';
    if (letter === 'D') return 'error';
    return 'error'; // F or invalid
  };

  const getGradeEmoji = (grade) => {
    const letter = toLetter(grade);
    if (letter === 'A') return '🌟';
    if (letter === 'B') return '👍';
    if (letter === 'C') return '📝';
    if (letter === 'D') return '📚';
    return '❌'; // F or invalid
  };

  useEffect(() => {
    if (open && assignment) {
      loadSubmissions();
    }
  }, [open, assignment]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const result = await getAssignmentSubmissions(assignment.id);
      if (result.success) {
        setSubmissions(result.data);
      } else {
        console.error('Error loading submissions:', result.error);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGradeChange = (field) => (event) => {
    const value = event.target.value;
    setGradeForm(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      grade: submission.grade || '',
      feedback: submission.feedback || '',
      status: 'graded' // Always set to graded when grading
    });
  };

  const handleGradeSubmission = async (submissionId) => {
    if (gradeForm.grade === undefined || gradeForm.grade === null || gradeForm.grade === '') {
      setErrors({ grade: 'Please select a grade' });
      return;
    }

    setGrading(prev => ({ ...prev, [submissionId]: true }));
    try {
      console.log('Grading submission with data:', { submissionId, payload: gradeForm });
      const result = await gradeAssignmentSubmission(submissionId, gradeForm);
      if (result.success) {
        // Update local submissions
        setSubmissions(prev => prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, ...result.data }
            : sub
        ));
        
        if (onGradingSuccess) {
          onGradingSuccess(result.data);
        }
        
        setSelectedSubmission(null);
        setGradeForm({ grade: '', feedback: '', status: 'graded' });
        setErrors({});
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setGrading(prev => ({ ...prev, [submissionId]: false }));
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded': return 'success';
      case 'submitted': return 'info';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };


  const renderGradeChip = (grade) => {
    const letter = toLetter(grade);
    if (!letter) return null;

    const colorMap = {
      'A': '#4caf50',
      'B': 'hsl(145, 60%, 40%)',
      'C': '#ff9800',
      'D': '#ff5722',
      'F': '#f44336'
    };

    const emoji = getGradeEmoji(letter);
    const label = `${emoji} ${letter.toUpperCase()}`;

    // Determine text color based on background color
    const isGreenBackground = letter === 'A' || letter === 'B';
    const textColor = isGreenBackground ? 'white' : 'white';

    return (
      <Chip
        label={label}
        sx={{
          bgcolor: colorMap[letter] || '#9e9e9e',
          color: textColor,
          fontWeight: 'bold',
          fontSize: '0.9rem',
          height: 32,
          minWidth: 60
        }}
      />
    );
  };

  if (!assignment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
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
          Grade Assignment: {assignment.title}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Assignment Info */}
        <Box sx={{ p: 4, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
            {assignment.title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Chip 
              label={`Due: ${formatDate(assignment.dueDate)}`} 
              color="default" 
              size="small" 
            />
            <Chip 
              label={`${submissions.length} submissions`} 
              color="secondary" 
              size="small" 
            />
          </Box>
        </Box>

        <Divider />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ px: 4 }}>
            <Tab 
              label={`All Submissions (${submissions.length})`} 
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              label={`Graded (${submissions.filter(s => s.status === 'graded').length})`} 
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              label={`Pending (${submissions.filter(s => s.status === 'submitted').length})`} 
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : submissions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Assignment sx={{ fontSize: 64, color: 'rgba(31, 120, 80, 0.3)', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No submissions yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Students haven't submitted this assignment yet
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(31, 120, 80, 0.2)', borderRadius: '12px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(31, 120, 80, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions
                    .filter(submission => {
                      if (activeTab === 1) return submission.status === 'graded';
                      if (activeTab === 2) return submission.status === 'submitted';
                      return true;
                    })
                    .map((submission) => (
                    <TableRow key={submission.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'hsl(152, 65%, 28%)' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {submission.childName || `Student ${submission.studentId}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submission.parentEmail || `ID: ${submission.studentId}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(submission.submittedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1).toLowerCase()} 
                          size="small" 
                          color={getStatusColor(submission.status)} 
                          variant="filled"
                          sx={{ color: 'white' }}
                        />
                      </TableCell>
                      <TableCell>
                        {submission.grade !== undefined && submission.grade !== null && submission.grade !== '' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {renderGradeChip(submission.grade)}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not graded
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewSubmission(submission)}
                          sx={{ 
                            borderRadius: '8px',
                            textTransform: 'none'
                          }}
                        >
                          View & Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
      </DialogActions>

      {/* Submission Detail Dialog */}
      {selectedSubmission && (
        <Dialog 
          open={!!selectedSubmission} 
          onClose={() => setSelectedSubmission(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', 
            backgroundClip: 'text', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            Grade Submission
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            {/* Submission Details */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                {selectedSubmission.childName || 'Student'} Submission
              </Typography>
              
              {selectedSubmission.parentEmail && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Parent: {selectedSubmission.parentEmail}
                </Typography>
              )}
              
              {selectedSubmission.submissionText && (
                <Paper sx={{ p: 3, mb: 3, background: 'rgba(31, 120, 80, 0.05)' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedSubmission.submissionText}
                  </Typography>
                </Paper>
              )}

              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Attachments ({selectedSubmission.attachments.length})
                  </Typography>
                  <List>
                    {selectedSubmission.attachments.map((attachment, index) => (
                      <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', mb: 1 }}>
                        <ListItemIcon>
                          <FilePresent sx={{ color: 'hsl(152, 65%, 28%)' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={attachment.name}
                          secondary={`${(attachment.size / 1024).toFixed(1)} KB`}
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            startIcon={<Download />}
                            onClick={() => window.open(attachment.url, '_blank')}
                          >
                            Download
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Grading Form */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth sx={{ maxWidth: 200 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={gradeForm.grade}
                  onChange={handleGradeChange('grade')}
                  label="Grade"
                  error={!!errors.grade}
                >
                  <MenuItem value="A">A - Excellent</MenuItem>
                  <MenuItem value="B">B - Good</MenuItem>
                  <MenuItem value="C">C - Satisfactory</MenuItem>
                  <MenuItem value="D">D - Needs Improvement</MenuItem>
                  <MenuItem value="F">F - Fail</MenuItem>
                </Select>
                {errors.grade && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.grade}
                  </Typography>
                )}
              </FormControl>

              <TextField
                label="Feedback (Optional)"
                value={gradeForm.feedback}
                onChange={handleGradeChange('feedback')}
                multiline
                rows={4}
                placeholder="Provide feedback to the student..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />

              {errors.submit && (
                <Alert severity="error">
                  {errors.submit}
                </Alert>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button 
              onClick={() => setSelectedSubmission(null)}
              sx={{ borderRadius: '12px' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleGradeSubmission(selectedSubmission.id)}
              variant="contained"
              disabled={grading[selectedSubmission.id]}
              startIcon={grading[selectedSubmission.id] ? <CircularProgress size={20} /> : <Grade />}
              sx={{ 
                background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                borderRadius: '12px',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
                }
              }}
            >
              {grading[selectedSubmission.id] ? 'Grading...' : 'Submit Grade'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
};

export default AssignmentGradingDialog;
