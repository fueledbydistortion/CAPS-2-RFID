import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import { moduleSchema } from '../validation/schema';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper
} from '@mui/material';
import { 
  AttachFile, 
  Delete, 
  CloudUpload 
} from '@mui/icons-material';

const ModuleForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  moduleData = null, 
  loading = false 
}) => {
  const [attachments, setAttachments] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const initialValues = {
    title: moduleData?.title || '',
    description: moduleData?.description || '',
    order: moduleData?.order || 1
  };

  useEffect(() => {
    if (moduleData) {
      setAttachments(moduleData.attachments || []);
    } else {
      setAttachments([]);
    }
  }, [moduleData, open]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    handleFiles(files);
    
    // Reset input
    event.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files) => {
    files.forEach(file => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Convert file to blob
      const reader = new FileReader();
      reader.onload = (e) => {
        const blob = new Blob([e.target.result], { type: file.type });
        
        const attachment = {
          id: Date.now() + Math.random(), // Simple ID generation
          name: file.name,
          type: file.type,
          size: file.size,
          blob: blob,
          uploadedAt: new Date().toISOString()
        };
        
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const moduleDataToSubmit = {
      ...values,
      attachments: attachments
    };
    await onSubmit(moduleDataToSubmit);
    setSubmitting(false);
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
        {moduleData ? 'Edit Module' : 'Add New Module'}
      </DialogTitle>
      
      <Formik
        initialValues={initialValues}
        validationSchema={moduleSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Module Title */}
                <Field name="title">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Module Title"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      required
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
                  )}
                </Field>

                {/* Description */}
                <Field name="description">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      placeholder="Enter module description..."
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      required
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
                  )}
                </Field>

                {/* Order */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <Field name="order">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Order"
                          type="number"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          required
                          inputProps={{ min: 1 }}
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
                      )}
                    </Field>
                  </Box>
                </Box>

                {/* Attachments Section */}
                <Box>
                  <Typography variant="h6" sx={{ color: 'hsl(152, 65%, 28%)', mb: 2, display: 'flex', alignItems: 'center', gap: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    <AttachFile fontSize="small" />
                    Attachments
                  </Typography>
                  
                  {/* Drag and Drop Area */}
                  <Box
                    sx={{
                      mb: 2,
                      border: `2px dashed ${isDragOver ? 'hsl(152, 65%, 28%)' : 'rgba(31, 120, 80, 0.3)'}`,
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: isDragOver ? 'rgba(31, 120, 80, 0.05)' : 'transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'hsl(152, 65%, 28%)',
                        backgroundColor: 'rgba(31, 120, 80, 0.02)'
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      accept="*/*"
                      style={{ display: 'none' }}
                      id="file-upload"
                      multiple
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <CloudUpload sx={{ fontSize: 48, color: 'hsl(152, 65%, 28%)', opacity: 0.7 }} />
                        <Typography variant="h6" sx={{ color: 'hsl(152, 65%, 28%)', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          or click to browse files
                        </Typography>
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<AttachFile />}
                          sx={{
                            borderRadius: '12px',
                            borderColor: 'hsl(152, 65%, 28%)',
                            color: 'hsl(152, 65%, 28%)',
                            '&:hover': {
                              borderColor: 'hsl(152, 65%, 28%)',
                              backgroundColor: 'rgba(31, 120, 80, 0.1)'
                            }
                          }}
                        >
                          Browse Files
                        </Button>
                      </Box>
                    </label>
                  </Box>

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <Paper sx={{ p: 2, backgroundColor: 'rgba(31, 120, 80, 0.02)' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'hsl(152, 65%, 28%)' }}>
                        Uploaded Files ({attachments.length})
                      </Typography>
                      <List dense>
                        {attachments.map((attachment) => (
                          <ListItem key={attachment.id} sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight={500}>
                                    {attachment.name}
                                  </Typography>
                                  <Chip 
                                    label={formatFileSize(attachment.size)} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {attachment.type} • Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleRemoveAttachment(attachment.id)}
                                size="small"
                                sx={{ color: '#f44336' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
                
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={onClose} 
                disabled={loading || isSubmitting}
                sx={{ 
                  borderRadius: '12px',
                  px: 3,
                  py: 1
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting}
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
                {(loading || isSubmitting) ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  moduleData ? 'Update Module' : 'Create Module'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ModuleForm;

