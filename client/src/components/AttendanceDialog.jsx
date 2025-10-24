import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Schedule, 
  Edit, 
  Save, 
  Close 
} from '@mui/icons-material';
import { markAttendance } from '../utils/attendanceService';
import { getAllUsers } from '../utils/userService';
import { formatTo12Hour } from '../utils/timeUtils';

const AttendanceDialog = ({ 
  open, 
  onClose, 
  scheduleData, 
  attendanceData, 
  loading = false 
}) => {
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    timeIn: '',
    timeOut: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  // Load students when dialog opens
  useEffect(() => {
    if (open && attendanceData?.attendance) {
      loadStudents();
    }
  }, [open, attendanceData]);

  const loadStudents = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.uid === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle color="success" />;
      case 'late':
        return <Schedule color="warning" />;
      case 'absent':
        return <Cancel color="error" />;
      default:
        return <Cancel color="disabled" />;
    }
  };

  const handleEditAttendance = (studentAttendance) => {
    setEditingStudent(studentAttendance.studentId);
    setEditForm({
      status: studentAttendance.status,
      timeIn: studentAttendance.timeIn || '',
      timeOut: studentAttendance.timeOut || '',
      notes: studentAttendance.notes || ''
    });
  };

  const handleSaveAttendance = async () => {
    if (!editingStudent || !scheduleData) return;

    setSaving(true);
    try {
      const result = await markAttendance({
        scheduleId: scheduleData.id,
        studentId: editingStudent,
        status: editForm.status,
        timeIn: editForm.timeIn || null,
        timeOut: editForm.timeOut || null,
        notes: editForm.notes || null
      });

      if (result.success) {
        // Update the attendance data locally
        const updatedAttendance = attendanceData.attendance.map(att => 
          att.studentId === editingStudent 
            ? { ...att, ...editForm }
            : att
        );
        
        // Update the parent component's data
        if (attendanceData.onUpdate) {
          attendanceData.onUpdate({
            ...attendanceData,
            attendance: updatedAttendance
          });
        }
        
        setEditingStudent(null);
        setEditForm({ status: '', timeIn: '', timeOut: '', notes: '' });
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditForm({ status: '', timeIn: '', timeOut: '', notes: '' });
  };

  if (!attendanceData) return null;

  const { schedule, section, attendance, totalStudents, presentCount, absentCount, lateCount } = attendanceData;

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
        fontSize: '1.5rem'
      }}>
        Attendance Monitoring
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Schedule Information */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(31, 120, 80, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: 'hsl(152, 65%, 28%)', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                Schedule Details
              </Typography>
              <Typography variant="body1">
                <strong>Day:</strong> {schedule.day} | 
                <strong> Time:</strong> {formatTo12Hour(schedule.timeIn)} - {formatTo12Hour(schedule.timeOut)} | 
                <strong> Daycare Center:</strong> {section.name} ({section.grade})
              </Typography>
            </Box>

            {/* Attendance Summary */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Total: ${totalStudents}`} 
                color="primary" 
                variant="outlined"
              />
              <Chip 
                label={`Present: ${presentCount}`} 
                color="success" 
                variant="outlined"
              />
              <Chip 
                label={`Late: ${lateCount}`} 
                color="warning" 
                variant="outlined"
              />
              <Chip 
                label={`Absent: ${absentCount}`} 
                color="error" 
                variant="outlined"
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Attendance Table */}
            <TableContainer sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2,
              maxHeight: 400
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(31, 120, 80, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Time In</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Time Out</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Notes</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'hsl(152, 65%, 28%)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendance.map((studentAttendance) => (
                    <TableRow key={studentAttendance.studentId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {getStudentName(studentAttendance.studentId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {editingStudent === studentAttendance.studentId ? (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={editForm.status}
                              onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                            >
                              <MenuItem value="present">Present</MenuItem>
                              <MenuItem value="late">Late</MenuItem>
                              <MenuItem value="absent">Absent</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(studentAttendance.status)}
                            <Chip 
                              label={studentAttendance.status.charAt(0).toUpperCase() + studentAttendance.status.slice(1)} 
                              color={getStatusColor(studentAttendance.status)}
                              size="small"
                            />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingStudent === studentAttendance.studentId ? (
                          <TextField
                            size="small"
                            value={editForm.timeIn}
                            onChange={(e) => setEditForm(prev => ({ ...prev, timeIn: e.target.value }))}
                            placeholder="e.g., 8:15 AM"
                            sx={{ minWidth: 120 }}
                          />
                        ) : (
                          <Typography variant="body2">
                            {formatTo12Hour(studentAttendance.timeIn) || '-'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingStudent === studentAttendance.studentId ? (
                          <TextField
                            size="small"
                            value={editForm.timeOut}
                            onChange={(e) => setEditForm(prev => ({ ...prev, timeOut: e.target.value }))}
                            placeholder="e.g., 9:00 AM"
                            sx={{ minWidth: 120 }}
                          />
                        ) : (
                          <Typography variant="body2">
                            {formatTo12Hour(studentAttendance.timeOut) || '-'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingStudent === studentAttendance.studentId ? (
                          <TextField
                            size="small"
                            value={editForm.notes}
                            onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Notes..."
                            sx={{ minWidth: 150 }}
                          />
                        ) : (
                          <Typography variant="body2">
                            {studentAttendance.notes || '-'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingStudent === studentAttendance.studentId ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={handleSaveAttendance}
                              disabled={saving}
                            >
                              <Save />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={handleCancelEdit}
                            >
                              <Close />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleEditAttendance(studentAttendance)}
                          >
                            <Edit />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
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
    </Dialog>
  );
};

export default AttendanceDialog;

