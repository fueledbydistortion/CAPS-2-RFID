import {
  Add,
  AutoAwesome,
  CalendarToday,
  Coffee,
  Delete,
  Edit,
  FitnessCenter,
  Groups,
  Home,
  MenuBook,
  MusicNote,
  Palette,
  Person,
  Restaurant,
  Schedule,
  School,
  Science,
  SportsEsports,
  Wc,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import ScheduleForm from "../components/ScheduleForm";
import { useAuth } from "../contexts/AuthContext";
import {
  createSchedule,
  deleteSchedule,
  getAllSchedules,
  subscribeToAllSchedules,
  updateSchedule,
} from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { getAllSkills } from "../utils/skillService";
import { formatTimeRange, formatTo12Hour } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

// Icon mapping for different activities
const getActivityIcon = (skillName) => {
  const name = skillName?.toLowerCase() || "";

  if (name.includes("arrival") || name.includes("free play"))
    return <AutoAwesome />;
  if (name.includes("opening") || name.includes("routine")) return <MenuBook />;
  if (name.includes("learning") || name.includes("lesson")) return <MenuBook />;
  if (name.includes("circle") || name.includes("group")) return <Groups />;
  if (name.includes("snack") || name.includes("meal")) return <Coffee />;
  if (name.includes("play") || name.includes("recess"))
    return <SportsEsports />;
  if (name.includes("music") || name.includes("song")) return <MusicNote />;
  if (name.includes("art") || name.includes("draw")) return <Palette />;
  if (name.includes("science") || name.includes("experiment"))
    return <Science />;
  if (name.includes("gym") || name.includes("exercise"))
    return <FitnessCenter />;
  if (name.includes("lunch") || name.includes("dinner")) return <Restaurant />;
  if (name.includes("bathroom") || name.includes("toilet")) return <Wc />;
  if (name.includes("nap") || name.includes("rest")) return <Home />;

  return <Schedule />;
};

const ClassScheduleContent = () => {
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [skills, setSkills] = useState([]);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);

  // Dialog states
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Days of the week
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Load schedules and related data when component mounts
  useEffect(() => {
    loadSchedules();
    loadRelatedData();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAllSchedules((result) => {
      if (result.success) {
        setSchedules(result.data);
      } else {
        showSnackbar("Error loading schedules: " + result.error, "error");
      }
    });

    return () => unsubscribe();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const result = await getAllSchedules();
      if (result.success) {
        setSchedules(result.data);
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

      if (skillsResult.success) setSkills(skillsResult.data);
      if (usersResult.success) setUsers(usersResult.data);
      if (sectionsResult.success) setSections(sectionsResult.data);
    } catch (error) {
      console.error("Error loading related data:", error);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
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
        result = await updateSchedule(editingSchedule.id, formData);
        if (result.success) {
          showSnackbar("Schedule updated successfully!");
          setScheduleFormOpen(false);
        } else {
          showSnackbar("Error updating schedule: " + result.error, "error");
        }
      } else {
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

  const getSkillName = (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    return skill ? skill.name : "Unknown Skill";
  };

  const getTeacherName = (teacherId) => {
    const teacher = users.find(
      (u) => u.uid === teacherId && u.role === "teacher"
    );
    return teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "Unknown Teacher";
  };

  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.name : "Unknown Section";
  };

  // Get schedules for the selected day
  const getSchedulesForDay = (day) => {
    return schedules
      .filter((schedule) => schedule.day === day)
      .sort((a, b) => {
        // Sort by time
        const timeA = a.timeIn || "00:00";
        const timeB = b.timeIn || "00:00";
        return timeA.localeCompare(timeB);
      });
  };

  // Get the overall time range for the selected day
  const getDayTimeRange = (day) => {
    const daySchedules = getSchedulesForDay(day);
    if (daySchedules.length === 0) return null;

    const times = daySchedules
      .flatMap((s) => [s.timeIn, s.timeOut])
      .filter(Boolean);
    if (times.length === 0) return null;

    const sortedTimes = times.sort();
    const startTime = sortedTimes[0];
    const endTime = sortedTimes[sortedTimes.length - 1];

    return `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}`;
  };

  const currentDaySchedules = getSchedulesForDay(daysOfWeek[selectedDay]);
  const dayTimeRange = getDayTimeRange(daysOfWeek[selectedDay]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}>
        <Box>
          {/* Weekly Schedule Tag */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "#1976d2",
              color: "white",
              px: 2,
              py: 0.5,
              borderRadius: "20px",
              mb: 2,
            }}>
            <CalendarToday fontSize="small" sx={{ color: "white" }} />
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "white" }}>
              Weekly Schedule
            </Typography>
          </Box>

          {/* Main Title */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: "#333",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              mb: 1,
            }}>
            Daily Routine
          </Typography>

          {/* Time Range */}
          {dayTimeRange && (
            <Typography
              variant="h6"
              sx={{
                color: "#666",
                fontWeight: 400,
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
              {daysOfWeek[selectedDay]} • {dayTimeRange}
            </Typography>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddSchedule}
            sx={{
              bgcolor: "#4caf50",
              borderRadius: "12px",
              px: 3,
              py: 1,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              "&:hover": {
                bgcolor: "#45a049",
              },
            }}>
            Add Schedule
          </Button>
          {/*
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleAddSchedule}
            sx={{
              bgcolor: '#1976d2',
              borderRadius: '12px',
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': {
                bgcolor: '#1565c0'
              }
            }}
          >
            Edit
          </Button>
          */}
        </Box>
      </Box>

      {/* Day Navigation Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedDay}
          onChange={(e, newValue) => setSelectedDay(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              minHeight: 48,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "1rem",
              color: "#666",
              "&.Mui-selected": {
                color: "#1976d2",
                fontWeight: 600,
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#1976d2",
              height: 3,
              borderRadius: "2px 2px 0 0",
            },
          }}>
          {daysOfWeek.map((day, index) => (
            <Tab key={day} label={day} />
          ))}
        </Tabs>
      </Box>

      {/* Schedule List */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: "white",
          borderRadius: "16px",
          border: "1px solid #e0e0e0",
          overflow: "hidden",
          minHeight: 400,
        }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
            }}>
            <CircularProgress />
          </Box>
        ) : currentDaySchedules.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
              color: "#999",
            }}>
            <Schedule sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No schedule for {daysOfWeek[selectedDay]}
            </Typography>
            <Typography variant="body2">
              Click "Edit" to add activities for this day
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {currentDaySchedules.map((schedule, index) => (
              <React.Fragment key={schedule.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    "&:hover": {
                      bgcolor: "#f5f5f5",
                    },
                  }}>
                  <ListItemIcon sx={{ minWidth: 56 }}>
                    <Avatar
                      sx={{
                        bgcolor: "#e3f2fd",
                        color: "#1976d2",
                        width: 40,
                        height: 40,
                      }}>
                      {getActivityIcon(getSkillName(schedule.subjectId))}
                    </Avatar>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: "#333",
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                          }}>
                          {getSkillName(schedule.subjectId)}
                        </Typography>

                        {/* Action Buttons */}
                        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditSchedule(schedule)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  bgcolor: "#e3f2fd",
                                },
                              }}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSchedule(schedule)}
                              sx={{
                                color: "#f44336",
                                "&:hover": {
                                  bgcolor: "#ffebee",
                                },
                              }}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 1,
                          }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#666",
                              fontWeight: 500,
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}>
                            {formatTimeRange(
                              schedule.timeIn,
                              schedule.timeOut,
                              schedule
                            )}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                          <Chip
                            label={getTeacherName(schedule.teacherId)}
                            size="small"
                            icon={<Person />}
                            variant="outlined"
                            sx={{
                              borderColor: "#e0e0e0",
                              color: "#666",
                              fontSize: "0.75rem",
                            }}
                          />
                          <Chip
                            label={getSectionName(schedule.sectionId)}
                            size="small"
                            icon={<School />}
                            variant="outlined"
                            sx={{
                              borderColor: "#e0e0e0",
                              color: "#666",
                              fontSize: "0.75rem",
                            }}
                          />
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < currentDaySchedules.length - 1 && (
                  <Divider sx={{ mx: 3 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Schedule Form Dialog */}
      <ScheduleForm
        open={scheduleFormOpen}
        onClose={() => setScheduleFormOpen(false)}
        onSubmit={handleScheduleFormSubmit}
        scheduleData={editingSchedule}
        selectedDate={daysOfWeek[selectedDay]}
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

      {/* Snackbar for notifications */}
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

export default ClassScheduleContent;
