import { Add, Delete, Refresh, Search } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getStatusColor } from "../utils/attendanceUtils";
// Removed static QR image import - now using dynamically generated QR codes
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import ScheduleForm from "../components/ScheduleForm";
import { useAuth } from "../contexts/AuthContext";
import { getAttendanceBySchedule } from "../utils/attendanceService";
import {
  createSchedule,
  deleteSchedule,
  getAllSchedules,
  subscribeToAllSchedules,
  updateSchedule,
} from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { getAllSkills } from "../utils/skillService";
import { formatTimeRange } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

const SchedulesContent = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [dayFilter, setDayFilter] = useState("all");
  const [skills, setSkills] = useState([]);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);

  // Dialog states
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Day options
  const dayOptions = [
    "all",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Load schedules and related data when component mounts or user profile changes
  useEffect(() => {
    loadSchedules();
    loadRelatedData();
  }, [userProfile]);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAllSchedules((result) => {
      if (result.success) {
        let schedulesData = result.data;

        // If user is a teacher, filter schedules to show only their assigned schedules
        if (userProfile && userProfile.role === "teacher") {
          schedulesData = result.data.filter(
            (schedule) => schedule.teacherId === userProfile.uid
          );
        }

        setSchedules(schedulesData);
      } else {
        showSnackbar("Error loading schedules: " + result.error, "error");
      }
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Filter schedules when search term or day filter changes
  useEffect(() => {
    let filtered = schedules;

    // Filter by day
    if (dayFilter !== "all") {
      filtered = filtered.filter((schedule) => schedule.day === dayFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (schedule) =>
          schedule.day?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.timeIn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          schedule.timeOut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getSkillName(schedule.subjectId)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getTeacherName(schedule.teacherId)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getSectionName(schedule.sectionId)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSchedules(filtered);
  }, [searchTerm, schedules, dayFilter]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const result = await getAllSchedules();
      if (result.success) {
        let schedulesData = result.data;

        // If user is a teacher, filter schedules to show only their assigned schedules
        if (userProfile && userProfile.role === "teacher") {
          schedulesData = result.data.filter(
            (schedule) => schedule.teacherId === userProfile.uid
          );
        }

        setSchedules(schedulesData);
      } else {
        showSnackbar("Error loading schedules: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading schedules: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [skillsResult, usersResult, sectionsResult] = await Promise.all([
        getAllSkills(),
        getAllUsers(),
        getAllSections(),
      ]);

      if (skillsResult.success) {
        setSkills(skillsResult.data);
      }

      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      if (sectionsResult.success) {
        setSections(sectionsResult.data);
      }
    } catch (error) {
      console.error("Error loading related data:", error);
    }
  };

  const getSkillName = (subjectId) => {
    const skill = skills.find((s) => s.id === subjectId);
    return skill ? skill.name : "Unknown Skill";
  };

  const getTeacherName = (teacherId) => {
    const teacher = users.find((u) => u.uid === teacherId);
    return teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "Unknown Teacher";
  };

  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.name : "Unknown Section";
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleScanQR = async (qrDataString) => {
    try {
      const parsed = JSON.parse(qrDataString);
      // For parent QR, call backend to mark attendance (teacher scans parent QR)
      if (parsed.type === "parent" && (parsed.parentId || parsed.parentID)) {
        const parentId = parsed.parentId || parsed.parentID;
        const attendanceType = parsed.attendanceType || "timeIn";

        // Special handling for timeOut QR codes - make database changes but don't update status
        if (attendanceType === "timeOut") {
          // Still process the attendance to record time-out in database
          const result = await markAttendanceViaQR(
            qrDataString,
            parentId,
            attendanceType,
            "Timed out via QR scan"
          );

          if (result.success) {
            Swal.fire({
              icon: "success",
              title: "Successfully Timed Out",
              text: "Student has been successfully timed out and recorded.",
              confirmButtonColor: "#2196f3",
              timer: 3000,
              timerProgressBar: true,
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Time-Out Failed",
              text: result.error || "Failed to record time-out.",
              confirmButtonColor: "#d33",
            });
          }
          return; // Exit early after processing
        }

        // Calculate attendance status based on current time and schedule
        let attendanceStatus = "present";
        let statusMessage = "";

        // Find the relevant schedule to calculate status
        const relevantSchedule = schedules.find((s) => {
          // Find schedule that matches the current day and time
          const today = new Date().toLocaleDateString("en-US", {
            weekday: "long",
          });
          return s.day === today;
        });

        if (relevantSchedule) {
          const currentTime = new Date().toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          });

          const scheduledTime =
            attendanceType === "timeIn"
              ? relevantSchedule.timeIn
              : relevantSchedule.timeOut;
          const statusResult = calculateAttendanceStatus(
            scheduledTime,
            currentTime,
            15
          ); // 15-minute grace period

          attendanceStatus = statusResult.status;
          statusMessage = formatAttendanceMessage(statusResult, attendanceType);
        }

        const result = await markAttendanceViaQR(
          qrDataString,
          parentId,
          attendanceType,
          statusMessage
        );
        if (result.success) {
          const statusColor = getStatusColor(attendanceStatus);
          const statusIcon =
            attendanceStatus === "present"
              ? "success"
              : attendanceStatus === "late"
              ? "warning"
              : "error";

          Swal.fire({
            icon: statusIcon,
            title: "Attendance Recorded!",
            html: `
              <div style="text-align: left;">
                <p><strong>Student:</strong> ${result.data.child.firstName} ${
              result.data.child.lastName
            }</p>
                <p><strong>Status:</strong> <span style="color: ${
                  statusColor === "success"
                    ? "#4caf50"
                    : statusColor === "warning"
                    ? "#ff9800"
                    : "#f44336"
                }">${attendanceStatus.toUpperCase()}</span></p>
                <p><strong>Time:</strong> ${
                  attendanceType === "timeIn" ? "Check-in" : "Check-out"
                }</p>
                <p><strong>Details:</strong> ${statusMessage}</p>
              </div>
            `,
            confirmButtonColor:
              statusColor === "success"
                ? "#4caf50"
                : statusColor === "warning"
                ? "#ff9800"
                : "#f44336",
            timer: 7000,
            timerProgressBar: true,
          });
          loadSchedules();
        } else {
          Swal.fire({
            icon: "error",
            title: "Attendance Error",
            text: "Error marking attendance: " + result.error,
            confirmButtonColor: "#d33",
          });
        }
      } else if (parsed.type === "schedule" && parsed.id) {
        // If a schedule QR is scanned, just navigate to attendance view for that schedule
        const schedule = schedules.find((s) => s.id === parsed.id);
        if (schedule) {
          Swal.fire({
            icon: "success",
            title: "QR Code Scanned!",
            text: `Opening attendance view for ${schedule.subjectName} - ${schedule.day}`,
            confirmButtonColor: "#2196f3",
            timer: 3000,
            timerProgressBar: true,
          });
          await handleViewAttendance(schedule);
        } else {
          Swal.fire({
            icon: "error",
            title: "Schedule Not Found",
            text: "The scanned schedule could not be found in the system.",
            confirmButtonColor: "#d33",
          });
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: "Invalid QR Code",
          text: "This QR code is not recognized. Please scan a valid schedule or parent QR code.",
          confirmButtonColor: "#ff9800",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Scanning Error",
        text: "Error processing QR code: " + err.message,
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleFormOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleFormOpen(true);
  };

  const handleDeleteSchedule = (schedule) => {
    setDeletingSchedule(schedule);
    setConfirmDialogOpen(true);
  };

  const handleScheduleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      if (editingSchedule) {
        // Update existing schedule
        result = await updateSchedule(editingSchedule.id, formData);
        if (result.success) {
          showSnackbar("Schedule updated successfully!");
          setScheduleFormOpen(false);
        } else {
          showSnackbar("Error updating schedule: " + result.error, "error");
        }
      } else {
        // Create new schedule
        result = await createSchedule(formData);
        if (result.success) {
          showSnackbar("Schedule created successfully!");
          setScheduleFormOpen(false);
        } else {
          showSnackbar("Error creating schedule: " + result.error, "error");
        }
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSchedule) return;

    setLoading(true);
    try {
      const result = await deleteSchedule(deletingSchedule.id);
      if (result.success) {
        showSnackbar("Schedule deleted successfully!");
        setConfirmDialogOpen(false);
        setDeletingSchedule(null);
      } else {
        showSnackbar("Error deleting schedule: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendance = async (schedule) => {
    setLoadingAttendance(true);
    try {
      const result = await getAttendanceBySchedule(schedule.id);
      if (result.success) {
        // Navigate to attendance page with data
        navigate("/dashboard/attendance", {
          state: {
            attendanceData: result.data,
          },
        });
      } else {
        showSnackbar("Error loading attendance: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading attendance: " + error.message, "error");
    } finally {
      setLoadingAttendance(false);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
              background:
                "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
            Class Schedules
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* Allow teachers to add schedules */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddSchedule}
              sx={{
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              }}>
              Add Schedule
            </Button>
          </Box>
        </Box>

        {/* Controls */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
          }}>
          <TextField
            size="small"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          <TextField
            size="small"
            select
            label="Filter by Day"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            sx={{ minWidth: 150 }}>
            {dayOptions.map((day) => (
              <MenuItem key={day} value={day}>
                {day === "all" ? "All Days" : day}
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadSchedules} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(15px)",
              border: "2px solid rgba(31, 120, 80, 0.2)",
              borderRadius: "16px",
              boxShadow: "0 6px 20px rgba(31, 120, 80, 0.15)",
            }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Day
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Time
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Section
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Teacher
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}
                    align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        No schedules found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <TableRow
                      key={schedule.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(31, 120, 80, 0.05)",
                          cursor: "pointer",
                        },
                        "&:active": {
                          backgroundColor: "rgba(31, 120, 80, 0.1)",
                        },
                      }}
                      onClick={() => handleViewAttendance(schedule)}>
                      <TableCell>
                        <Chip
                          label={schedule.day}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatTimeRange(
                            schedule.timeIn,
                            schedule.timeOut,
                            schedule
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            color: "hsl(152, 65%, 28%)",
                            fontWeight: 500,
                          }}>
                          {getSkillName(schedule.subjectId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getTeacherName(schedule.teacherId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getSectionName(schedule.sectionId)}
                        </Typography>
                      </TableCell>
                      {/* Show Actions column for all users including teachers */}
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Delete Schedule">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSchedule(schedule);
                              }}
                              sx={{
                                "&:hover": {
                                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                                },
                              }}>
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Schedule Form Dialog */}
      <ScheduleForm
        open={scheduleFormOpen}
        onClose={() => setScheduleFormOpen(false)}
        onSubmit={handleScheduleFormSubmit}
        scheduleData={editingSchedule}
        loading={loading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Schedule"
        message={`Are you sure you want to delete this schedule? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading}
        type="danger"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchedulesContent;
