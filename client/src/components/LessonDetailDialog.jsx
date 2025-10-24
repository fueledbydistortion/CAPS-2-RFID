import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,

  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip
} from '@mui/material'
import {
  Close,
  Book,
  Download,
  Visibility,
  CheckCircle,
  School,
  Person,
  AccessTime,
  Attachment,
  FileDownload,
  QuizOutlined
} from '@mui/icons-material'
import { 
  getLessonProgress,
  updateLessonProgress,
  updateAttachmentProgressWithLessonUpdate
} from '../utils/progressService'
import { 
  downloadFile,
  getStaticFileUrl,
  formatFileSize,
  getFileIcon,
  getFileUrlFromAttachment
} from '../utils/fileService'
import { 
  submitQuiz, 
  getQuizResults 
} from '../utils/quizService'
import QuizTakingDialog from './QuizTakingDialog'

const LessonDetailDialog = ({ 
  open, 
  onClose, 
  lesson, 
  userId,
  onProgressUpdate,
  onAttachmentView,
  attachmentProgress = {},
  onQuizSubmit
}) => {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [quizDialogOpen, setQuizDialogOpen] = useState(false)
  const [quizResults, setQuizResults] = useState(null)

  useEffect(() => {
    if (open && lesson && userId) {
      loadProgress()
      loadQuizResults()
    }
  }, [open, lesson, userId])

  const loadQuizResults = async () => {
    if (!lesson?.id || !userId) return;
    
    try {
      // First try to get from server
      const result = await getQuizResults(userId, lesson.id);
      if (result.success && result.data) {
        setQuizResults(result.data.score);
      } else {
        // Fallback to localStorage
        const storedResults = localStorage.getItem(`quiz_${userId}_${lesson.id}`);
        if (storedResults) {
          setQuizResults(JSON.parse(storedResults));
        }
      }
    } catch (error) {
      console.error('Error loading quiz results:', error);
      // Try localStorage as fallback
      const storedResults = localStorage.getItem(`quiz_${userId}_${lesson.id}`);
      if (storedResults) {
        setQuizResults(JSON.parse(storedResults));
      }
    }
  }

  const loadProgress = async () => {
    setLoading(true)
    try {
      const result = await getLessonProgress(userId, lesson.id)
      if (result.success) {
        setProgress(result.data)
      } else {
        setError('Error loading progress: ' + result.error)
      }
    } catch (error) {
      setError('Error loading progress: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProgressUpdate = async (newProgress) => {
    setUpdating(true)
    try {
      const result = await updateLessonProgress(userId, lesson.id, newProgress)
      if (result.success) {
        setProgress(result.data)
        if (onProgressUpdate) {
          onProgressUpdate(lesson.id, result.data)
        }
      } else {
        setError('Error updating progress: ' + result.error)
      }
    } catch (error) {
      setError('Error updating progress: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Get the file URL (supports Firebase Storage, legacy local files, and blobs)
      const fileUrl = getFileUrlFromAttachment(attachment);
      
      if (fileUrl) {
        // For Firebase Storage and other URLs, create a download link
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = attachment.name || attachment.originalName || 'download';
        link.target = '_blank';
        // Add download attribute to force download instead of opening in browser
        link.setAttribute('download', attachment.name || attachment.originalName || 'download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (attachment.blob && attachment.blob instanceof Blob) {
        // Old blob format - create download link
        const url = URL.createObjectURL(attachment.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError('Unable to download file. File URL not available.');
        console.error('Attachment structure:', attachment);
      }
    } catch (error) {
      setError('Error downloading file: ' + error.message);
      console.error('Download error:', error);
    }
  }

  const handleViewAttachment = async (attachment) => {
    try {
      // Debug: Log the lesson object structure
      console.log('Lesson object structure:', {
        lesson,
        lessonKeys: lesson ? Object.keys(lesson) : null,
        lessonId: lesson?.id,
        lessonUid: lesson?.uid,
        lessonKey: lesson?.key
      });
      
      // Track attachment viewing progress and update lesson progress
      if (onAttachmentView && lesson && lesson.id) {
        console.log('Viewing attachment:', {
          lessonId: lesson.id,
          attachmentId: attachment.id || attachment.name,
          attachment: attachment
        });
        
        const result = await onAttachmentView(lesson.id, attachment.id || attachment.name)
        
        // If the progress update was successful, update local progress state
        if (result && result.success && result.data.lessonProgress) {
          setProgress(result.data.lessonProgress)
        }
      } else {
        console.error('Missing required data for attachment view:', {
          hasOnAttachmentView: !!onAttachmentView,
          hasLesson: !!lesson,
          lessonId: lesson?.id,
          lessonObject: lesson
        });
      }
      
      // Handle both Firebase Storage URLs, legacy files, and blobs
      const fileUrl = getFileUrlFromAttachment(attachment);
      
      if (fileUrl) {
        // Open Firebase Storage URL or legacy local file URL
        window.open(fileUrl, '_blank');
      } else if (attachment.blob && attachment.blob instanceof Blob) {
        // Old blob format
        const url = URL.createObjectURL(attachment.blob);
        window.open(url, '_blank');
        // Clean up after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        setError('Unable to view file. File URL not available.');
        console.error('Attachment structure:', attachment);
      }
    } catch (error) {
      console.error('Error handling attachment view:', error)
      setError('Error tracking attachment progress: ' + error.message)
    }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'success'
    if (percentage >= 75) return 'info'
    if (percentage >= 50) return 'warning'
    return 'error'
  }

  const getProgressText = (percentage) => {
    if (percentage >= 100) return 'Completed'
    if (percentage >= 75) return 'Almost Done'
    if (percentage >= 50) return 'In Progress'
    if (percentage > 0) return 'Started'
    return 'Not Started'
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleStartQuiz = () => {
    setQuizDialogOpen(true)
  }

  const handleQuizSubmit = async (quizData) => {
    try {
      // Save to localStorage temporarily
      localStorage.setItem(`quiz_${userId}_${lesson.id}`, JSON.stringify(quizData.score));
      setQuizResults(quizData.score);
      
      // Submit to server
      const result = await submitQuiz(lesson.id, {
        answers: quizData.answers,
        score: quizData.score
      });
      
      if (!result.success) {
        console.error('Error submitting quiz to server:', result.error);
        // Still show results even if server submission fails
      }
      
      // Call parent's onQuizSubmit if provided
      if (onQuizSubmit) {
        await onQuizSubmit(quizData);
      }
      
      // Update lesson progress based on quiz score
      if (quizData.score.percentage >= 70) {
        await handleProgressUpdate(100);
      } else {
        // Update progress to at least 50% for quiz attempt
        await handleProgressUpdate(Math.max(progress?.percentage || 0, 50));
      }
      
      setQuizDialogOpen(false);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Error submitting quiz: ' + error.message);
    }
  }

  // Calculate progress based on attachment viewing
  const calculateAttachmentBasedProgress = () => {
    if (!lesson || !lesson.attachments) return 0
    
    const totalAttachments = lesson.attachments.length
    if (totalAttachments === 0) return 0
    
    const viewedAttachments = Object.values(attachmentProgress).filter(att => att.viewed).length
    return Math.round((viewedAttachments / totalAttachments) * 100)
  }

  if (!lesson) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        },
      }}>
      <DialogTitle
        sx={{
          background:
            "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Book sx={{ color: "hsl(152, 65%, 28%)" }} />
          {lesson.title}
        </Box>
        <IconButton onClick={handleClose} sx={{ color: "hsl(152, 65%, 28%)" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Progress Section */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card
            sx={{
              mb: 3,
              background: "rgba(31, 120, 80, 0.05)",
              border: "1px solid rgba(31, 120, 80, 0.2)",
            }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: "hsl(152, 65%, 28%)",
                    fontWeight: 600,
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                  }}>
                  Your Progress
                </Typography>
                <Chip
                  label={`${calculateAttachmentBasedProgress()}%`}
                  color={getProgressColor(calculateAttachmentBasedProgress())}
                  variant="filled"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              <LinearProgress
                variant="determinate"
                value={calculateAttachmentBasedProgress()}
                color={getProgressColor(calculateAttachmentBasedProgress())}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  mb: 2,
                  backgroundColor: "rgba(31, 120, 80, 0.1)",
                }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {getProgressText(calculateAttachmentBasedProgress())}
              </Typography>

              {/* Progress Info */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}>
                <Typography variant="caption" color="text.secondary">
                  Progress is automatically calculated based on attachment
                  viewing
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Quiz Section */}
        {lesson && lesson.quizQuestions && lesson.quizQuestions.length > 0 && (
          <Card
            sx={{
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(31, 120, 80, 0.1), rgba(31, 120, 80, 0.05))",
              border: "2px solid rgba(31, 120, 80, 0.3)",
            }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "hsl(152, 65%, 28%)",
                      fontWeight: 600,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 700,
                    }}>
                    <QuizOutlined />
                    Quiz Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lesson.quizQuestions.length} questions • Test your
                    knowledge
                  </Typography>
                </Box>
                {quizResults ? (
                  <Chip
                    label={`${quizResults.percentage}% - ${quizResults.correctCount}/${quizResults.totalQuestions}`}
                    color={quizResults.percentage >= 70 ? "success" : "warning"}
                    icon={
                      quizResults.percentage >= 70 ? <CheckCircle /> : undefined
                    }
                  />
                ) : (
                  <Chip label="Not Taken" variant="outlined" />
                )}
              </Box>

              {quizResults && (
                <Alert
                  severity={quizResults.percentage >= 70 ? "success" : "info"}
                  sx={{ mb: 2 }}>
                  {quizResults.percentage >= 70
                    ? `Great job! You scored ${quizResults.percentage}% on this quiz.`
                    : `You scored ${quizResults.percentage}%. Try again to improve your score!`}
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={<QuizOutlined />}
                onClick={handleStartQuiz}
                fullWidth
                sx={{
                  background:
                    "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                  borderRadius: "12px",
                  py: 1.5,
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))",
                  },
                }}>
                {quizResults ? "Retake Quiz" : "Start Quiz"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lesson Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{
                color: "hsl(152, 65%, 28%)",
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                mb: 2,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
              }}>
              Lesson Details
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
              <Chip
                icon={<School />}
                label={`Skill: ${lesson.skillName}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<Person />}
                label={`Daycare Center: ${lesson.sectionName}`}
                color="secondary"
                variant="outlined"
              />
              <Chip
                icon={<AccessTime />}
                label={`Order: ${lesson.order}`}
                color="info"
                variant="outlined"
              />
            </Box>

            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              {lesson.description ||
                "No description available for this lesson."}
            </Typography>
          </CardContent>
        </Card>

        {/* Attachments */}
        {lesson.attachments && lesson.attachments.length > 0 ? (
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: "hsl(152, 65%, 28%)",
                  fontWeight: 600,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  mb: 2,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 700,
                }}>
                Attachments ({lesson.attachments.length})
              </Typography>

              {/* Legacy file warning */}
              {lesson.attachments.some(
                (att) =>
                  att.name &&
                  !att.filename &&
                  !att.url &&
                  !att.blob &&
                  (att.size || att.type)
              ) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Some files are legacy format and need to be re-uploaded to
                  access them. Please edit the lesson and re-upload these files
                  to make them accessible.
                </Alert>
              )}

              <List>
                {lesson.attachments.map((attachment, index) => {
                  const hasServerFile = attachment.filename && attachment.url;
                  const hasBlobFile =
                    attachment.blob && attachment.blob instanceof Blob;
                  const hasFile = hasServerFile || hasBlobFile;

                  // Handle legacy files that might have different structure
                  const isLegacyFile =
                    attachment.name &&
                    !hasFile &&
                    (attachment.size || attachment.type);

                  // Check if attachment has been viewed
                  const attachmentId = attachment.id || attachment.name;
                  const isViewed =
                    attachmentProgress[attachmentId]?.viewed || false;
                  const viewedAt = attachmentProgress[attachmentId]?.viewedAt;

                  return (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Attachment
                          sx={{
                            color: hasFile
                              ? "hsl(152, 65%, 28%)"
                              : isLegacyFile
                              ? "#ff9800"
                              : "#f44336",
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}>
                            <Typography variant="body2" fontWeight={500}>
                              {attachment.name}
                            </Typography>
                            {isViewed && (
                              <Chip
                                label="Viewed"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              {hasServerFile
                                ? "Server file (ready to download)"
                                : hasBlobFile
                                ? "Local file (ready to download)"
                                : isLegacyFile
                                ? "Legacy file (re-upload needed)"
                                : "File data not available"}
                            </Typography>
                            {attachment.size && (
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {formatFileSize(attachment.size)}
                              </Typography>
                            )}
                            {attachment.type && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block">
                                {attachment.type}
                              </Typography>
                            )}
                            {isViewed && viewedAt && (
                              <Typography
                                variant="caption"
                                color="success.main"
                                display="block">
                                Viewed {new Date(viewedAt).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        }
                        sx={{
                          "& .MuiListItemText-primary": { fontWeight: 500 },
                          "& .MuiListItemText-secondary": {
                            color: hasFile
                              ? "text.secondary"
                              : isLegacyFile
                              ? "#ff9800"
                              : "#f44336",
                          },
                        }}
                      />
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {hasFile ? (
                          <>
                            <Tooltip
                              title={isViewed ? "View Again" : "View File"}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewAttachment(attachment)}
                                sx={{
                                  color: isViewed
                                    ? "#4caf50"
                                    : "hsl(152, 65%, 28%)",
                                  backgroundColor: isViewed
                                    ? "rgba(76, 175, 80, 0.1)"
                                    : "transparent",
                                }}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download File">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDownloadAttachment(attachment)
                                }
                                sx={{ color: "#4caf50" }}>
                                <FileDownload />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : isLegacyFile ? (
                          <Tooltip title="Legacy file - re-upload to access">
                            <IconButton
                              size="small"
                              disabled
                              sx={{ color: "#ff9800" }}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Attachment
                sx={{ fontSize: 48, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary">
                No attachments available for this lesson
              </Typography>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: "8px" }}>
          Close
        </Button>
      </DialogActions>

      {/* Quiz Dialog */}
      <QuizTakingDialog
        open={quizDialogOpen}
        onClose={() => setQuizDialogOpen(false)}
        lesson={lesson}
        onSubmit={handleQuizSubmit}
      />
    </Dialog>
  );
}

export default LessonDetailDialog

