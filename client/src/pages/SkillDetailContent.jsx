import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { 
  ArrowBack,
  Add, 
  Edit, 
  Delete, 
  Book,
  Assignment,
  ViewList,
  ViewModule,
  Refresh
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import LessonForm from '../components/LessonForm'
import AssignmentForm from '../components/AssignmentForm'
import ConfirmDialog from '../components/ConfirmDialog'
import { 
  createLesson, 
  getAllLessons,
  updateLesson, 
  deleteLesson
} from '../utils/lessonService'
import { 
  createAssignment, 
  getAllAssignments,
  updateAssignment, 
  deleteAssignment
} from '../utils/assignmentService'
import { useAuth } from '../contexts/AuthContext'

const SkillDetailContent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { userProfile } = useAuth()
  
  // Get skill data from location state
  const skill = location.state?.skill
  
  const [activeTab, setActiveTab] = useState(0)
  const [modules, setModules] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Dialog states
  const [moduleFormOpen, setModuleFormOpen] = useState(false)
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [deleteType, setDeleteType] = useState('') // 'module' or 'assignment'
  
  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (skill) {
      loadModules()
      loadAssignments()
    }
  }, [skill])

  const loadModules = async () => {
    setLoading(true)
    try {
      const result = await getAllLessons(skill.id)
      if (result.success) {
        setModules(result.data)
      } else {
        showSnackbar('Error loading modules: ' + result.error, 'error')
      }
    } catch (error) {
      showSnackbar('Error loading modules: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    setLoading(true)
    try {
      const result = await getAllAssignments(skill.id)
      if (result.success) {
        setAssignments(result.data)
      } else {
        showSnackbar('Error loading assignments: ' + result.error, 'error')
      }
    } catch (error) {
      showSnackbar('Error loading assignments: ' + error.message, 'error')
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

  const handleBack = () => {
    navigate('/dashboard/skills')
  }

  const handleAddModule = () => {
    setEditingModule(null)
    setModuleFormOpen(true)
  }

  const handleEditModule = (module) => {
    setEditingModule(module)
    setModuleFormOpen(true)
  }

  const handleDeleteModule = (module) => {
    setDeletingItem(module)
    setDeleteType('module')
    setConfirmDialogOpen(true)
  }

  const handleAddAssignment = () => {
    setEditingAssignment(null)
    setAssignmentFormOpen(true)
  }

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment)
    setAssignmentFormOpen(true)
  }

  const handleDeleteAssignment = (assignment) => {
    setDeletingItem(assignment)
    setDeleteType('assignment')
    setConfirmDialogOpen(true)
  }

  const handleModuleFormSubmit = async (formData) => {
    setLoading(true)
    try {
      let result
      if (editingModule) {
        result = await updateLesson(editingModule.id, formData)
        if (result.success) {
          showSnackbar('Module updated successfully!')
          setModuleFormOpen(false)
          loadModules()
        } else {
          showSnackbar('Error updating module: ' + result.error, 'error')
        }
      } else {
        result = await createLesson({ ...formData, skillId: skill.id })
        if (result.success) {
          showSnackbar('Module created successfully!')
          setModuleFormOpen(false)
          loadModules()
        } else {
          showSnackbar('Error creating module: ' + result.error, 'error')
        }
      }
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentFormSubmit = async (formData) => {
    setLoading(true)
    try {
      let result
      if (editingAssignment) {
        result = await updateAssignment(editingAssignment.id, formData)
        if (result.success) {
          showSnackbar('Assignment updated successfully!')
          setAssignmentFormOpen(false)
          loadAssignments()
        } else {
          showSnackbar('Error updating assignment: ' + result.error, 'error')
        }
      } else {
        result = await createAssignment({ ...formData, skillId: skill.id })
        if (result.success) {
          showSnackbar('Assignment created successfully!')
          setAssignmentFormOpen(false)
          loadAssignments()
        } else {
          showSnackbar('Error creating assignment: ' + result.error, 'error')
        }
      }
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    
    setLoading(true)
    try {
      let result
      if (deleteType === 'module') {
        result = await deleteLesson(deletingItem.id)
      } else {
        result = await deleteAssignment(deletingItem.id)
      }
      
      if (result.success) {
        showSnackbar(`${deleteType === 'module' ? 'Module' : 'Assignment'} deleted successfully!`)
        setConfirmDialogOpen(false)
        setDeletingItem(null)
        if (deleteType === 'module') {
          loadModules()
        } else {
          loadAssignments()
        }
      } else {
        showSnackbar(`Error deleting ${deleteType}: ` + result.error, 'error')
      }
    } catch (error) {
      showSnackbar('Error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  if (!skill) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Skill not found. Please go back and select a skill.
        </Typography>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2, color: 'hsl(152, 65%, 28%)' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {skill.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {skill.code && `Code: ${skill.code}`} • {skill.description || 'No description'}
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab 
            icon={<Book />} 
            label={`Modules (${modules.length})`} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            icon={<Assignment />} 
            label={`Assignments (${assignments.length})`} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* Content based on active tab */}
      {activeTab === 0 ? (
        // Modules Tab
        <Paper sx={{ p: 4, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>
              Modules
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleAddModule}
              sx={{ background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))' }}
            >
              Add Module
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : modules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No modules found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Module" to create the first module for this skill.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {modules.map((module) => (
                <Card key={module.id} sx={{ 
                  flex: '1 1 350px', 
                  minWidth: '350px',
                  maxWidth: '400px',
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
                    title={module.title}
                    subheader={`Order: ${module.order}`}
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    action={
                      <Box>
                        <Tooltip title="Edit Module">
                          <IconButton onClick={() => handleEditModule(module)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Module">
                          <IconButton onClick={() => handleDeleteModule(module)} color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {module.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      ) : (
        // Assignments Tab
        <Paper sx={{ p: 4, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(15px)', border: '2px solid rgba(31, 120, 80, 0.2)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>
              Assignments
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleAddAssignment}
              sx={{ background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))' }}
            >
              Add Assignment
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : assignments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No assignments found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Assignment" to create the first assignment for this skill.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {assignments.map((assignment) => (
                <Card key={assignment.id} sx={{ 
                  flex: '1 1 350px', 
                  minWidth: '350px',
                  maxWidth: '400px',
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
                    avatar={<Assignment sx={{ color: 'hsl(152, 65%, 28%)' }} />}
                    title={assignment.title}
                    subheader={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                    titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
                    action={
                      <Box>
                        <Tooltip title="Edit Assignment">
                          <IconButton onClick={() => handleEditAssignment(assignment)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Assignment">
                          <IconButton onClick={() => handleDeleteAssignment(assignment)} color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {assignment.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={`Points: ${assignment.points}`} size="small" color="primary" variant="outlined" />
                      <Chip label={`Type: ${assignment.type}`} size="small" color="secondary" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Module Form Dialog */}
      <LessonForm
        open={moduleFormOpen}
        onClose={() => setModuleFormOpen(false)}
        onSubmit={handleModuleFormSubmit}
        lessonData={editingModule}
        loading={loading}
      />

      {/* Assignment Form Dialog */}
      <AssignmentForm
        open={assignmentFormOpen}
        onClose={() => setAssignmentFormOpen(false)}
        onSubmit={handleAssignmentFormSubmit}
        assignmentData={editingAssignment}
        loading={loading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteType === 'module' ? 'Module' : 'Assignment'}`}
        message={`Are you sure you want to delete "${deletingItem?.title || deletingItem?.name}"? This action cannot be undone.`}
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

export default SkillDetailContent

