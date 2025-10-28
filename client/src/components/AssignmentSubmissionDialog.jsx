import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import { 
  AttachFile, 
  Delete, 
  CloudUpload,
  FilePresent,
  Assignment,
  CheckCircle
} from '@mui/icons-material';
import { uploadFile } from '../utils/fileService';
import { submitAssignment } from '../utils/assignmentService';

const AssignmentSubmissionDialog = ({ 
  open, 
  onClose, 
  assignment,
  onSubmissionSuccess
}) => {
  const [formData, setFormData] = useState({
    submissionText: '',
    attachments: []
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setFormData({
        submissionText: '',
        attachments: []
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadFile(file, 'submissions');
        if (result.success) {
          return {
            id: result.data.id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.data.url,
            path: result.data.path
          };
        }
        throw new Error(result.error);
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      setErrors(prev => ({
        ...prev,
        attachments: 'Failed to upload files: ' + error.message
      }));
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(file => file.id !== fileId)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.submissionText.trim() && formData.attachments.length === 0) {
      newErrors.submissionText = 'Please provide either text submission or upload files';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submissionData = {
        assignmentId: assignment.id,
        submissionText: formData.submissionText,
        attachments: formData.attachments,
        submittedAt: new Date().toISOString()
      };

      const result = await submitAssignment(submissionData);
      if (result.success) {
        onSubmissionSuccess(result.data);
        onClose();
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
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
        fontSize: '1.5rem'
      }}>
        Submit Assignment
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        {assignment && (
          <>
            {/* Assignment Details */}
            <Box sx={{ mb: 4, p: 3, background: 'rgba(31, 120, 80, 0.05)', borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assignment sx={{ mr: 2, color: 'hsl(152, 65%, 28%)' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  {assignment.title}
                </Typography>
              </Box>
              
              {assignment.description && (
                <Typography variant="body2" sx={{ mb: 2, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'text.secondary' }}>
                  {assignment.description}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              {/* Points chip removed per letter-only grading */}
                <Chip 
                  label={`Due: ${formatDate(assignment.dueDate)}`} 
                  color={new Date(assignment.dueDate) < new Date() ? 'error' : 'default'}
                  size="small" 
                />
              </Box>
              
              {assignment.instructions && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Instructions:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {assignment.instructions}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Submission Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              {/* Text Submission */}
              <TextField
                fullWidth
                label="Your Submission"
                value={formData.submissionText}
                onChange={handleChange('submissionText')}
                multiline
                rows={6}
                placeholder="Write your response, thoughts, or any additional information here..."
                error={!!errors.submissionText}
                helperText={errors.submissionText}
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

              {/* File Upload Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'hsl(152, 65%, 28%)', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                  Attach Files (Optional)
                </Typography>
                
                {/* Upload Button */}
                <Box sx={{ mb: 2 }}>
                  <input
                    accept="*/*"
                    style={{ display: 'none' }}
                    id="submission-file-upload"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="submission-file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      disabled={uploadingFiles}
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
                      {uploadingFiles ? 'Uploading...' : 'Upload Files'}
                    </Button>
                  </label>
                </Box>

                {/* Upload Progress */}
                {uploadingFiles && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="caption" color="text.secondary">
                      Uploading files...
                    </Typography>
                  </Box>
                )}

                {/* File List */}
                {formData.attachments.length > 0 && (
                  <List sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', p: 1 }}>
                    {formData.attachments.map((file) => (
                      <ListItem key={file.id} sx={{ py: 1 }}>
                        <FilePresent sx={{ mr: 2, color: 'hsl(152, 65%, 28%)' }} />
                        <ListItemText
                          primary={file.name}
                          secondary={`${formatFileSize(file.size)}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveFile(file.id)}
                            size="small"
                            sx={{ color: '#f44336' }}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* Error Display */}
                {errors.attachments && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.attachments}
                  </Alert>
                )}
              </Box>

              {/* Submit Error */}
              {errors.submit && (
                <Alert severity="error">
                  {errors.submit}
                </Alert>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={submitting}
          sx={{ 
            borderRadius: '12px',
            px: 3,
            py: 1
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
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
          {submitting ? 'Submitting...' : 'Submit Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentSubmissionDialog;

