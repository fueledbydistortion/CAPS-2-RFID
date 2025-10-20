import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
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
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  AttachFile, 
  Delete, 
  CloudUpload,
  Add,
  ExpandMore,
  QuizOutlined
} from '@mui/icons-material';
import { 
  uploadLessonFiles,
  validateFile,
  formatFileSize,
  getFileUrlFromAttachment,
  deleteLessonFile
} from '../utils/fileService';
import { lessonSchema } from '../validation/schema';

const LessonForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  lessonData = null, 
  loading = false 
}) => {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [deletedAttachments, setDeletedAttachments] = useState([]); // Track attachments to delete from server
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleting, setDeleting] = useState(false); // Track deletion in progress
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10
  });

  const initialValues = {
    title: lessonData?.title || '',
    description: lessonData?.description || '',
    order: lessonData?.order || 1,
    content: lessonData?.content || ''
  };

  useEffect(() => {
    if (lessonData) {
      setQuizQuestions(lessonData.quizQuestions || []);
      // Ensure each attachment has a unique ID for proper deletion
      const processedAttachments = (lessonData.attachments || []).map((att, index) => ({
        ...att,
        id: att.id || `existing-${Date.now()}-${index}` // Generate unique ID if missing
      }));
      setAttachments(processedAttachments);
    } else {
      setQuizQuestions([]);
      setAttachments([]);
    }
    setDeletedAttachments([]); // Reset deleted attachments tracking
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10
    });
  }, [lessonData, open]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    handleFiles(files);
    
    // Reset input
    event.target.value = '';
  };

  const handleRemoveAttachment = async (attachmentId) => {
    const attachment = attachments.find(att => att.id === attachmentId);
    if (!attachment) return;

    // Check if this is an existing server file (has filename and no local File object)
    const isServerFile = attachment.filename && !(attachment.file instanceof File);

    if (isServerFile && lessonData?.id) {
      // For existing server files, we need to delete from server
      if (window.confirm(`Are you sure you want to delete "${attachment.name || attachment.originalName}"? This cannot be undone.`)) {
        setDeleting(true);
        try {
          const result = await deleteLessonFile(lessonData.id, attachment.filename);
          if (result.success) {
            // Remove from local state
            setAttachments(prev => prev.filter(att => att.id !== attachmentId));
            alert('File deleted successfully!');
          } else {
            alert('Failed to delete file: ' + result.error);
          }
        } catch (error) {
          alert('Error deleting file: ' + error.message);
        } finally {
          setDeleting(false);
        }
      }
    } else {
      // For new local files, just remove from state
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    }
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
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push({
          id: Date.now() + Math.random(), // Simple ID generation
          name: file.name,
          file: file,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const handleAddQuestion = () => {
    // Validate new question
    if (!newQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }
    
    const filledOptions = newQuestion.options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Please provide at least 2 answer options');
      return;
    }
    
    // Add question to list
    const questionToAdd = {
      id: Date.now(),
      question: newQuestion.question,
      options: newQuestion.options.filter(opt => opt.trim() !== ''),
      correctAnswer: newQuestion.correctAnswer,
      points: newQuestion.points
    };
    
    setQuizQuestions(prev => [...prev, questionToAdd]);
    
    // Reset new question form
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10
    });
  };

  const handleRemoveQuestion = (questionId) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleNewQuestionChange = (field, value) => {
    setNewQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setNewQuestion(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return {
        ...prev,
        options: newOptions
      };
    });
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const lessonDataToSubmit = {
      ...values,
      quizQuestions: quizQuestions,
      attachments: attachments
    };
    await onSubmit(lessonDataToSubmit);
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
        {lessonData ? 'Edit Lesson' : 'Add New Lesson'}
      </DialogTitle>
      
      <Formik
        initialValues={initialValues}
        validationSchema={lessonSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Lesson Title */}
                <Field name="title">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Lesson Title"
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
                      label="Description (Optional)"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      multiline
                      rows={3}
                      placeholder="Enter lesson description..."
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

                {/* Content */}
                <Field name="content">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Content (Optional)"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      multiline
                      rows={4}
                      placeholder="Enter lesson content, instructions, or materials..."
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

          {/* Quiz Questions Section */}
          <Box>
            <Typography variant="h6" sx={{ color: 'hsl(152, 65%, 28%)', mb: 2, display: 'flex', alignItems: 'center', gap: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              <QuizOutlined fontSize="small" />
              Quiz Questions (Optional)
            </Typography>
            
                {/* Existing Questions */}
                {quizQuestions.length > 0 && (
                  <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(31, 120, 80, 0.02)' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'hsl(152, 65%, 28%)' }}>
                      Questions ({quizQuestions.length})
                    </Typography>
                    <List dense>
                      {quizQuestions.map((q, index) => (
                    <ListItem key={q.id} sx={{ px: 0, flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                            {index + 1}. {q.question}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {q.options.length} options • {q.points} points
                          </Typography>
                          <Box sx={{ ml: 2 }}>
                            {q.options.map((option, idx) => (
                              <Typography 
                                key={idx} 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  color: idx === q.correctAnswer ? '#4caf50' : 'text.secondary',
                                  fontWeight: idx === q.correctAnswer ? 600 : 400
                                }}
                              >
                                {String.fromCharCode(65 + idx)}. {option} {idx === q.correctAnswer && '✓'}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveQuestion(q.id)}
                          sx={{ color: '#f44336' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                      {index < formData.quizQuestions.length - 1 && <Divider sx={{ width: '100%', mt: 1 }} />}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            
            {/* Add New Question Form */}
            <Accordion sx={{ border: '1px solid rgba(31, 120, 80, 0.2)' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ color: 'hsl(152, 65%, 28%)', fontWeight: 600 }}>
                  Add New Question
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Question"
                    value={newQuestion.question}
                    onChange={(e) => handleNewQuestionChange('question', e.target.value)}
                    multiline
                    rows={2}
                    placeholder="Enter your quiz question..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                  
                  <Typography variant="subtitle2" sx={{ color: 'hsl(152, 65%, 28%)', mt: 1 }}>
                    Answer Options
                  </Typography>
                  
                  {newQuestion.options.map((option, index) => (
                    <TextField
                      key={index}
                      fullWidth
                      label={`Option ${String.fromCharCode(65 + index)}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px'
                        }
                      }}
                    />
                  ))}
                  
                  <FormControl component="fieldset">
                    <Typography variant="subtitle2" sx={{ color: 'hsl(152, 65%, 28%)', mb: 1 }}>
                      Correct Answer
                    </Typography>
                    <RadioGroup
                      value={newQuestion.correctAnswer}
                      onChange={(e) => handleNewQuestionChange('correctAnswer', parseInt(e.target.value))}
                    >
                      {newQuestion.options.map((option, index) => (
                        option.trim() !== '' && (
                          <FormControlLabel
                            key={index}
                            value={index}
                            control={<Radio />}
                            label={`Option ${String.fromCharCode(65 + index)}: ${option || '(empty)'}`}
                          />
                        )
                      ))}
                    </RadioGroup>
                  </FormControl>
                  
                  <TextField
                    fullWidth
                    label="Points"
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => handleNewQuestionChange('points', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px'
                      }
                    }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddQuestion}
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
                    Add Question
                  </Button>
                </Box>
              </AccordionDetails>
            </Accordion>
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
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                    Files will be uploaded to the server for better performance
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
              {/* <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Maximum file size: 10MB per file
              </Typography> */}
            </Box>

            {/* Attachments List */}
            {attachments.length > 0 && (
              <Paper sx={{ p: 2, backgroundColor: 'rgba(31, 120, 80, 0.02)' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'hsl(152, 65%, 28%)' }}>
                  Uploaded Files ({attachments.length})
                </Typography>
                <List dense>
                  {attachments.map((attachment) => {
                    // Check if file is viewable (either has blob File object or Firebase Storage URL)
                    const fileUrl = getFileUrlFromAttachment(attachment);
                    const hasLocalFile = attachment.file instanceof File;
                    const hasStorageUrl = !!fileUrl;
                    const isViewable = hasLocalFile || hasStorageUrl;
                    
                    const viewUrl = hasLocalFile 
                      ? URL.createObjectURL(attachment.file)
                      : fileUrl;
                    
                    return (
                      <ListItem key={attachment.id} sx={{ px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                component={isViewable ? "a" : "span"}
                                href={isViewable ? viewUrl : undefined}
                                target={isViewable ? "_blank" : undefined}
                                rel={isViewable ? "noopener noreferrer" : undefined}
                                onClick={(e) => {
                                  if (!isViewable) {
                                    e.preventDefault();
                                    alert('File data not available. Please re-upload the file to view it.');
                                  }
                                }}
                                sx={{
                                  textDecoration: 'none',
                                  color: isViewable ? 'hsl(152, 65%, 28%)' : '#ff9800',
                                  fontWeight: 500,
                                  cursor: isViewable ? 'pointer' : 'default',
                                  opacity: isViewable ? 1 : 0.8,
                                  '&:hover': {
                                    textDecoration: isViewable ? 'underline' : 'none'
                                  }
                                }}
                                title={isViewable ? 'Click to view file' : 'File data not available - re-upload to view'}
                              >
                                <Typography variant="body2" fontWeight={500}>
                                  {attachment.name || attachment.originalName}
                                </Typography>
                              </Box>
                              <Chip 
                                label={formatFileSize(attachment.size)} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              {hasStorageUrl && !hasLocalFile && (
                                <Chip 
                                  label="Cloud" 
                                  size="small" 
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                    color: '#4caf50'
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {attachment.type || attachment.mimetype || 'Unknown type'}
                              {attachment.uploadedAt && ` • Uploaded ${new Date(attachment.uploadedAt).toLocaleString()}`}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                            size="small"
                            disabled={deleting}
                            sx={{ color: '#f44336' }}
                          >
                            {deleting ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
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
                  lessonData ? 'Update Lesson' : 'Create Lesson'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default LessonForm;

