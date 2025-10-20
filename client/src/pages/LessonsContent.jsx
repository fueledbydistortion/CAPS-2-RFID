import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Chip, 
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material'
import { 
  Add, 
  Edit, 
  Delete, 
  Book,
  Refresh
} from '@mui/icons-material'
import LessonForm from '../components/LessonForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { 
  createLesson, 
  getAllLessons,
  updateLesson, 
  deleteLesson
} from '../utils/lessonService'

const LessonsContent = () => {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [deletingLesson, setDeletingLesson] = useState(null)
  
  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    loadLessons()
  }, [])

  const loadLessons = async () => {
    setLoading(true)
    try {
      const result = await getAllLessons()
      if (result.success) {
        setLessons(result.data)
      } else {
        showSnackbar('Error loading lessons: ' + result.error, 'error')
      }
    } catch (error) {
      showSnackbar('Error loading lessons: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const handleAddLesson = () => {
    setEditingLesson(null)
    setLessonFormOpen(true)
  }

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson)
    setLessonFormOpen(true)
  }

  const handleDeleteLesson = (lesson) => {
    setDeletingLesson(lesson)
    setConfirmDialogOpen(true)
  }

  const handleLessonFormSubmit = async (formData) => {
    setLoading(true)
    try {
      let result
      if (editingLesson) {
        // Update existing lesson
        result = await updateLesson(editingLesson.id, formData)
        if (result.success) {
          showSnackbar('Lesson updated successfully!')
          setLessonFormOpen(false)
          loadLessons()
        } else {
          showSnackbar('Error updating lesson: ' + result.error, 'error')
        }
      } else {
        // Create new lesson
        result = await createLesson(formData)
        if (result.success) {
          showSnackbar('Lesson created successfully!')
          setLessonFormOpen(false)
          loadLessons()
        } else {
          showSnackbar('Error creating lesson: ' + result.error, 'error')
        }
      }
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingLesson) return
    
    setLoading(true)
    try {
      const result = await deleteLesson(deletingLesson.id)
      if (result.success) {
        showSnackbar('Lesson deleted successfully!')
        setConfirmDialogOpen(false)
        setDeletingLesson(null)
        loadLessons()
      } else {
        showSnackbar('Error deleting lesson: ' + result.error, 'error')
      }
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 4, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lesson Plans
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadLessons} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleAddLesson}
              sx={{ background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))' }}
            >
              Add Lesson
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : lessons.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No lessons found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click "Add Lesson" to create your first lesson
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {lessons.map((lesson) => (
              <Card key={lesson.id} sx={{ 
                flex: '1 1 350px', 
                minWidth: '350px',
                maxWidth: '400px',
                height: 'fit-content',
                background: 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(15px)', 
                border: '2px solid rgba(31, 120, 80, 0.2)', 
                borderRadius: '16px', 
                boxShadow: '0 6px 20px rgba(31, 120, 80, 0.15)', 
                transition: 'all 0.3s ease', 
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: '0 12px 30px rgba(31, 120, 80, 0.25)' 
                } 
              }}>
                <CardHeader
                  avatar={<Book sx={{ color: 'hsl(152, 65%, 28%)' }} />}
                  title={lesson.title}
                  subheader={`Order: ${lesson.order}`}
                  titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {lesson.description}
                    </Typography>
                    {lesson.attachments && lesson.attachments.length > 0 && (
                      <Chip 
                        label={`${lesson.attachments.length} attachment(s)`} 
                        color="info" 
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Edit />}
                      onClick={() => handleEditLesson(lesson)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error" 
                      startIcon={<Delete />}
                      onClick={() => handleDeleteLesson(lesson)}
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Lesson Form Dialog */}
      <LessonForm
        open={lessonFormOpen}
        onClose={() => setLessonFormOpen(false)}
        onSubmit={handleLessonFormSubmit}
        lessonData={editingLesson}
        loading={loading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${deletingLesson?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading}
        type="danger"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LessonsContent

