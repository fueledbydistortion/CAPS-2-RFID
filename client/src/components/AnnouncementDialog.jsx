import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material'
import { Close, Event, Announcement as AnnouncementIcon } from '@mui/icons-material'
import Swal from 'sweetalert2'
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../utils/announcementService'

const AnnouncementDialog = ({ open, onClose, selectedDate, announcement, onSave, isAdmin, isTeacher = false, currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'announcement'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (announcement) {
        // Edit mode
        setFormData({
          title: announcement.title || '',
          description: announcement.description || '',
          date: announcement.date || '',
          time: announcement.time || '',
          type: announcement.type || 'announcement'
        })
      } else if (selectedDate) {
        // Create mode with selected date
        setFormData({
          title: '',
          description: '',
          date: selectedDate,
          time: '',
          type: 'announcement'
        })
      }
      setErrors({})
    }
  }, [open, announcement, selectedDate])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    })
    // Clear error for this field
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      })
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      let result
      const announcementData = {
        ...formData,
        createdBy: currentUser?.uid || 'system'
      }

      if (announcement) {
        // Update existing announcement
        result = await updateAnnouncement(announcement.id, announcementData)
      } else {
        // Create new announcement
        result = await createAnnouncement(announcementData)
      }

      if (result.success) {
        // Close dialog immediately
        onSave()
        onClose()
        
        // Show success message without blocking
        Swal.fire({
          icon: 'success',
          title: announcement ? 'Announcement Updated!' : 'Announcement Created!',
          text: announcement 
            ? 'The announcement has been updated successfully.' 
            : 'The announcement has been created successfully.',
          confirmButtonColor: 'hsl(152, 65%, 28%)',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save announcement',
        confirmButtonColor: '#d32f2f'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    // Close dialog temporarily for confirmation
    onClose()
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        const deleteResult = await deleteAnnouncement(announcement.id)
        
        if (deleteResult.success) {
          // Refresh calendar
          onSave()
          
          // Show success message without blocking
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The announcement has been deleted.',
            confirmButtonColor: 'hsl(152, 65%, 28%)',
            timer: 2000,
            showConfirmButton: false
          })
        } else {
          throw new Error(deleteResult.error)
        }
      } catch (error) {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to delete announcement',
          confirmButtonColor: '#d32f2f'
        })
      } finally {
        setLoading(false)
      }
    }
    // Note: If cancelled, the dialog stays closed. User can click the announcement again to reopen.
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'event': return 'primary'
      case 'holiday': return 'success'
      case 'meeting': return 'info'
      case 'reminder': return 'warning'
      default: return 'default'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'event': return <Event />
      default: return <AnnouncementIcon />
    }
  }

  // If not admin or teacher, show read-only view
  if (!isAdmin && !isTeacher && announcement) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon(announcement.type)}
            <Typography variant="h6" sx={{ color: 'white' }}>View Announcement</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Type
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={announcement.type.toUpperCase()} 
                  color={getTypeColor(announcement.type)}
                  size="small"
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Title
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                {announcement.title}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Date
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>
                {new Date(announcement.date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>

            {announcement.description && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {announcement.description}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  // Admin edit/create form
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {announcement ? <Event /> : <AnnouncementIcon />}
          <Typography variant="h6" sx={{ color: 'white' }}>
            {announcement ? 'Edit Announcement' : 'Create Announcement'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {!isAdmin && !isTeacher && (
            <Alert severity="info">
              You can only view announcements. Contact an administrator to make changes.
            </Alert>
          )}

          <FormControl fullWidth error={!!errors.type}>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={handleChange('type')}
              label="Type"
              disabled={!isAdmin && !isTeacher}
            >
              <MenuItem value="announcement">Announcement</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="reminder">Reminder</MenuItem>
            </Select>
            {errors.type && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.type}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="Title"
            fullWidth
            value={formData.title}
            onChange={handleChange('title')}
            error={!!errors.title}
            helperText={errors.title}
            disabled={!isAdmin && !isTeacher}
            required
          />

          <TextField
            label="Date"
            type="date"
            fullWidth
            value={formData.date}
            onChange={handleChange('date')}
            error={!!errors.date}
            helperText={errors.date}
            disabled={!isAdmin && !isTeacher}
            required
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            label="Time (Optional)"
            type="time"
            fullWidth
            value={formData.time}
            onChange={handleChange('time')}
            disabled={!isAdmin && !isTeacher}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange('description')}
            disabled={!isAdmin && !isTeacher}
            placeholder="Enter additional details about this announcement..."
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box>
          {announcement && (isAdmin || isTeacher) && (
            <Button
              onClick={handleDelete}
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Delete
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {(isAdmin || isTeacher) && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {announcement ? 'Update' : 'Create'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default AnnouncementDialog


