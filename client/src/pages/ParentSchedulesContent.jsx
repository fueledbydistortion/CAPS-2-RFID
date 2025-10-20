import {
  AccessTime,
  CalendarToday,
  Event,
  LocationOn,
  Person,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAllAnnouncements } from "../utils/announcementService";
import {
  getAttendanceBySchedule,
  markAttendance,
} from "../utils/attendanceService";
import { getAllSchedules } from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { formatTo12Hour } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

const ParentSchedulesContent = () => {
  const { userProfile } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [processingAttendance, setProcessingAttendance] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Get days of the week
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        schedulesResult,
        sectionsResult,
        usersResult,
        announcementsResult,
      ] = await Promise.all([
        getAllSchedules(),
        getAllSections(),
        getAllUsers(),
        getAllAnnouncements(),
      ]);

      if (schedulesResult.success) {
        setSchedules(schedulesResult.data);
      }
      if (sectionsResult.success) {
        setSections(sectionsResult.data);
      }
      if (usersResult.success) {
        setUsers(usersResult.data);
      }
      if (announcementsResult.success) {
        setAnnouncements(announcementsResult.data);
      }
    } catch (error) {
      showSnackbar("Error loading data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Get parent's assigned schedules (through their children in sections)
  const getParentSchedules = () => {
    if (!userProfile || userProfile.role !== "parent") return [];

    // In your database structure, the parent's child information is stored in the parent record itself
    // The child is represented by the parent's uid in the assignedStudents array

    // Find sections where this parent's child (represented by parent's uid) is assigned
    const parentSections = sections.filter((section) => {
      if (!section.assignedStudents) return false;
      // Check if this parent's uid is in the assignedStudents array (representing their child)
      return section.assignedStudents.includes(userProfile.uid);
    });

    // Get schedules for these sections
    const parentSchedules = schedules.filter((schedule) => {
      return parentSections.some(
        (section) => section.id === schedule.sectionId
      );
    });

    // Filter by day if specified
    if (dayFilter !== "all") {
      return parentSchedules.filter((schedule) => schedule.day === dayFilter);
    }

    return parentSchedules.sort((a, b) => {
      const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const aIndex = dayOrder.indexOf(a.day);
      const bIndex = dayOrder.indexOf(b.day);
      if (aIndex !== bIndex) return aIndex - bIndex;

      // Sort by time if same day
      return a.timeIn.localeCompare(b.timeIn);
    });
  };

  const parentSchedules = getParentSchedules();

  // Get upcoming events from announcements and schedules
  const getUpcomingEvents = () => {
    const events = [];
    const today = new Date();

    // Get upcoming announcements (next 30 days)
    const upcomingAnnouncements = announcements
      .filter((announcement) => {
        const announcementDate = new Date(announcement.date);
        const daysDiff = Math.ceil(
          (announcementDate - today) / (1000 * 60 * 60 * 24)
        );
        return daysDiff >= 0 && daysDiff <= 30;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 6);

    // Convert announcements to events
    upcomingAnnouncements.forEach((announcement) => {
      events.push({
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        date: announcement.date,
        type: announcement.type,
        category: "announcement",
      });
    });

    // Get upcoming schedules (next 7 days)
    const upcomingSchedules = parentSchedules
      .filter((schedule) => {
        const scheduleDate = new Date();
        const dayName = scheduleDate.toLocaleDateString("en-US", {
          weekday: "long",
        });
        return schedule.day === dayName;
      })
      .slice(0, 4);

    // Convert schedules to events
    upcomingSchedules.forEach((schedule) => {
      const { section } = getScheduleDetails(schedule);
      events.push({
        id: `schedule-${schedule.id}`,
        title: section ? `${section.name} Class` : "Class Activity",
        description: `Scheduled class session`,
        date: new Date().toISOString().split("T")[0],
        time: `${formatTo12Hour(schedule.timeIn)} - ${formatTo12Hour(
          schedule.timeOut
        )}`,
        type: "class",
        category: "schedule",
      });
    });

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const upcomingEvents = getUpcomingEvents();

  // Get section and skill details for a schedule
  const getScheduleDetails = (schedule) => {
    const section = sections.find((s) => s.id === schedule.sectionId);
    const skill = users.find((u) => u.uid === schedule.subjectId); // Assuming subjectId is skill/teacher ID
    const teacher = users.find((u) => u.uid === schedule.teacherId);

    return { section, skill, teacher };
  };

  // Get children in a section for this parent
  const getChildrenInSection = (sectionId) => {
    if (!userProfile) return [];
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.assignedStudents) return [];

    // In your database structure, if the parent's uid is in assignedStudents,
    // it means this parent represents their child in that section
    if (section.assignedStudents.includes(userProfile.uid)) {
      // Return the parent as representing their child
      return [userProfile];
    }

    return [];
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Process attendance based on scanned QR code (kept for backward compatibility)
  const handleProcessAttendance = async () => {
    if (!scannedData || !userProfile) return;

    setProcessingAttendance(true);
    try {
      // Find the schedule
      const schedule = schedules.find((s) => s.id === scannedData.id);
      if (!schedule) {
        showSnackbar("Schedule not found", "error");
        return;
      }

      // Get children in this schedule's section
      const children = getChildrenInSection(schedule.sectionId);
      if (children.length === 0) {
        showSnackbar("No children found for this schedule", "error");
        return;
      }

      // In your database structure, the parent represents their child
      const child = children[0];

      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });

      // Check if there's existing attendance for today
      const today = new Date().toISOString().split("T")[0];

      // Get existing attendance records for this student and schedule
      const existingAttendanceResult = await getAttendanceBySchedule(
        schedule.id
      );
      let existingRecord = null;

      if (existingAttendanceResult.success) {
        existingRecord = existingAttendanceResult.data.attendance.find(
          (record) => record.studentId === child.uid && record.date === today
        );
      }

      // Prepare attendance data based on existing record or new record
      let attendanceData;

      if (existingRecord) {
        // Update existing record with new time-in or time-out
        if (attendanceStatus === "timeIn") {
          attendanceData = {
            ...existingRecord,
            timeIn: currentTime,
            status: "present",
            notes: attendanceNotes || existingRecord.notes,
          };
        } else {
          attendanceData = {
            ...existingRecord,
            timeOut: currentTime,
            status: "present",
            notes: attendanceNotes || existingRecord.notes,
          };
        }
      } else {
        // Create new record
        attendanceData = {
          scheduleId: schedule.id,
          studentId: child.uid,
          date: today,
          status: "present",
          timeIn: attendanceStatus === "timeIn" ? currentTime : null,
          timeOut: attendanceStatus === "timeOut" ? currentTime : null,
          notes: attendanceNotes,
        };
      }

      const result = await markAttendance(attendanceData);
      if (result.success) {
        showSnackbar(
          `Successfully ${
            attendanceStatus === "timeIn" ? "checked in" : "checked out"
          } for ${child.childName || `${child.firstName} ${child.lastName}`}`,
          "success"
        );
        setAttendanceDialogOpen(false);
        setScannedData(null);
        setAttendanceNotes("");
        // Refresh data to show updated attendance
        loadData();
      } else {
        showSnackbar("Error marking attendance: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error processing attendance: " + error.message, "error");
    } finally {
      setProcessingAttendance(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (userProfile?.role !== "parent") {
    return (
      <Alert severity="warning">This page is only accessible to parents.</Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                mb: 1,
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              My Child's Schedules
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#1976d2", fontSize: "1.1rem" }}>
              View your child's class schedules and manage attendance with QR
              codes
            </Typography>
          </Box>
        </Box>

        {/* Day Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Day</InputLabel>
          <Select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            label="Filter by Day">
            <MenuItem value="all">All Days</MenuItem>
            {daysOfWeek.map((day) => (
              <MenuItem key={day} value={day}>
                {day}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Upcoming Events Section - Moved to Top */}
      {upcomingEvents.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(156, 39, 176, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(156, 39, 176, 0.2)",
          }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Event sx={{ color: "#9c27b0", mr: 2, fontSize: 28 }} />
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
                color: "#9c27b0",
              }}>
              Upcoming Events
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {upcomingEvents.slice(0, 6).map((event, index) => (
              <Grid item xs={12} md={6} lg={4} key={event.id}>
                <Card
                  sx={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid rgba(156, 39, 176, 0.1)",
                    borderRadius: "12px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(156, 39, 176, 0.15)",
                    },
                  }}>
                  <CardContent sx={{ p: 2.5, position: "relative" }}>
                    {/* Event Tag */}
                    <Chip
                      label={
                        event.type === "announcement" ? event.type : "Class"
                      }
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        backgroundColor:
                          event.type === "announcement" ? "#e1bee7" : "#c8e6c9",
                        color:
                          event.type === "announcement" ? "#7b1fa2" : "#2e7d32",
                        fontWeight: 600,
                      }}
                    />

                    {/* Event Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "hsl(152, 65%, 28%)",
                        mb: 1.5,
                        pr: 8,
                      }}>
                      {event.title}
                    </Typography>

                    {/* Date */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CalendarToday
                        sx={{
                          fontSize: 16,
                          color: "text.secondary",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </Box>

                    {/* Time (for schedules) */}
                    {event.time && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <AccessTime
                          sx={{
                            fontSize: 16,
                            color: "text.secondary",
                            mr: 1,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}>
                          {event.time}
                        </Typography>
                      </Box>
                    )}

                    {/* Description/Location */}
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocationOn
                        sx={{
                          fontSize: 16,
                          color: "text.secondary",
                          mr: 1,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}>
                        {event.category === "schedule"
                          ? "Classroom"
                          : event.description || "School Event"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Weekly Schedule Layout */}
      {parentSchedules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No schedules found for your children.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Contact your child's teacher to get assigned to class schedules.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Group schedules by day */}
          {daysOfWeek.map((day) => {
            const daySchedules = parentSchedules.filter(
              (schedule) => schedule.day === day
            );

            if (daySchedules.length === 0) return null;

            return (
              <Paper
                key={day}
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                {/* Day Header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: "hsl(152, 65%, 28%)",
                      mr: 2,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 700,
                      color: "hsl(152, 65%, 28%)",
                      mr: 2,
                    }}>
                    {day}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontStyle: "italic",
                    }}>
                    Daily activities and classes
                  </Typography>
                </Box>

                {/* Activities Container - Horizontal Layout */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    overflowX: "auto",
                    pb: 1,
                    "&::-webkit-scrollbar": {
                      height: 6,
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "rgba(31, 120, 80, 0.1)",
                      borderRadius: 3,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(31, 120, 80, 0.3)",
                      borderRadius: 3,
                      "&:hover": {
                        backgroundColor: "rgba(31, 120, 80, 0.5)",
                      },
                    },
                  }}>
                  {daySchedules.map((schedule) => {
                    const { section, skill, teacher } =
                      getScheduleDetails(schedule);
                    const children = getChildrenInSection(schedule.sectionId);

                    return (
                      <Card
                        key={schedule.id}
                        sx={{
                          minWidth: 280,
                          flexShrink: 0,
                          background: "rgba(248, 249, 250, 0.95)",
                          border: "1px solid rgba(31, 120, 80, 0.1)",
                          borderRadius: "12px",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px rgba(31, 120, 80, 0.15)",
                          },
                        }}>
                        <CardContent sx={{ p: 2.5 }}>
                          {/* Time with clock icon */}
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1.5,
                            }}>
                            <AccessTime
                              sx={{
                                fontSize: 16,
                                color: "hsl(152, 65%, 28%)",
                                mr: 1,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: "hsl(152, 65%, 28%)",
                                fontWeight: 500,
                              }}>
                              {schedule.timeInStart && schedule.timeInEnd
                                ? `${formatTo12Hour(
                                    schedule.timeInStart
                                  )} - ${formatTo12Hour(schedule.timeInEnd)}`
                                : formatTo12Hour(schedule.timeIn)}{" "}
                              -{" "}
                              {schedule.timeOutStart && schedule.timeOutEnd
                                ? `${formatTo12Hour(
                                    schedule.timeOutStart
                                  )} - ${formatTo12Hour(schedule.timeOutEnd)}`
                                : formatTo12Hour(schedule.timeOut)}
                            </Typography>
                          </Box>

                          {/* Activity Name */}
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "hsl(152, 65%, 28%)",
                              mb: 1.5,
                              fontSize: "1.1rem",
                            }}>
                            {section ? section.name : "Class Activity"}
                          </Typography>

                          {/* Location with pin icon */}
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <LocationOn
                              sx={{
                                fontSize: 16,
                                color: "text.secondary",
                                mr: 1,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.875rem",
                              }}>
                              {section
                                ? `${section.name} Classroom`
                                : "Classroom"}
                            </Typography>
                          </Box>

                          {/* Teacher info */}
                          {teacher && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 1,
                              }}>
                              <Person
                                sx={{
                                  fontSize: 16,
                                  color: "text.secondary",
                                  mr: 1,
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "text.secondary",
                                  fontSize: "0.875rem",
                                }}>
                                {teacher.firstName} {teacher.lastName}
                              </Typography>
                            </Box>
                          )}

                          {/* Children info */}
                          {children.length > 0 && (
                            <Box
                              sx={{
                                mt: 1.5,
                                pt: 1.5,
                                borderTop: "1px solid rgba(31, 120, 80, 0.1)",
                              }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}>
                                Your Child
                              </Typography>
                              {children.map((child) => (
                                <Chip
                                  key={child.uid}
                                  label={
                                    child.childName ||
                                    `${child.firstName} ${child.lastName}`
                                  }
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    backgroundColor: "hsl(152, 65%, 28%)",
                                    color: "white",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParentSchedulesContent;
