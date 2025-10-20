import {
  Add,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Event as EventIcon,
  Refresh,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import AnnouncementDialog from "../components/AnnouncementDialog";
import CalendarDayDialog from "../components/CalendarDayDialog";
import { useAuth } from "../contexts/AuthContext";
import { getAllAnnouncements } from "../utils/announcementService";
import {
  createSchedule,
  deleteSchedule,
  getAllSchedules,
  updateSchedule,
} from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { getAllSkills } from "../utils/skillService";
import { formatTo12Hour } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

const CalendarContent = () => {
  const { userProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null);

  const isAdmin = userProfile?.role === "admin";
  const isTeacher = userProfile?.role === "teacher";
  const isParent = userProfile?.role === "parent";

  useEffect(() => {
    loadSchedules();
    loadSkills();
    loadAnnouncements();
    loadUsers();
    loadSections();
  }, [userProfile]);

  const loadSchedules = async () => {
    setCalendarLoading(true);
    try {
      const result = await getAllSchedules();
      if (result.success) {
        // For teachers, filter schedules for the current teacher
        // For admin, show all schedules
        // For parents, filter schedules for their child's sections
        if (userProfile?.role === "teacher") {
          const teacherSchedules = result.data.filter(
            (schedule) => schedule.teacherId === userProfile.uid
          );
          setSchedules(teacherSchedules);
        } else if (userProfile?.role === "parent") {
          // Wait for sections to load before filtering
          const sectionsResult = await getAllSections();
          if (sectionsResult.success) {
            // Find sections where this parent's child is assigned
            const parentSections = sectionsResult.success
              ? sectionsResult.data.filter((section) => {
                  if (!section.assignedStudents) return false;
                  return section.assignedStudents.includes(userProfile.uid);
                })
              : [];

            // Get schedules for these sections
            const parentSchedules = result.data.filter((schedule) => {
              return parentSections.some(
                (section) => section.id === schedule.sectionId
              );
            });

            setSchedules(parentSchedules);
          }
        } else {
          setSchedules(result.data);
        }
      } else {
        console.error("Error loading schedules:", result.error);
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const result = await getAllSkills();
      if (result.success) {
        setSkills(result.data);
      } else {
        console.error("Error loading skills:", result.error);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const result = await getAllAnnouncements();
      if (result.success) {
        setAnnouncements(result.data);
      } else {
        console.error("Error loading announcements:", result.error);
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        console.error("Error loading users:", result.error);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadSections = async () => {
    try {
      const result = await getAllSections();
      if (result.success) {
        setSections(result.data);
      } else {
        console.error("Error loading sections:", result.error);
      }
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getSchedulesForDate = (date) => {
    if (!date) return [];

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return schedules.filter((schedule) => schedule.day === dayName);
  };

  const formatTime = (time) => {
    if (!time) return "";
    return formatTo12Hour(time);
  };

  const getSkillName = (skillId) => {
    const skill = skills.find((skill) => skill.id === skillId);
    return skill ? skill.name : "Unknown Skill";
  };

  const getAnnouncementsForDate = (date) => {
    if (!date) return [];

    // Format date to YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    return announcements.filter(
      (announcement) => announcement.date === dateStr
    );
  };

  const handleCellClick = (date, showAnnouncements = false) => {
    if (!date) return;

    // Create a new date object to avoid timezone issues
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dateAnnouncements = getAnnouncementsForDate(date);

    // If clicking on announcements, show announcement dialog
    if (showAnnouncements) {
      if (isAdmin || isTeacher) {
        // Admin and Teachers can create or view announcements
        setSelectedDate(dateStr);
        setSelectedAnnouncement(null);
        setDialogOpen(true);
      } else if (dateAnnouncements.length > 0) {
        // Other users (including parents) can only view existing announcements
        setSelectedAnnouncement(dateAnnouncements[0]);
        setDialogOpen(true);
      }
    } else {
      // For parents, only show schedule dialog if there are schedules for this day
      if (isParent) {
        const daySchedules = getSchedulesForDate(date);
        if (daySchedules.length > 0 || dateAnnouncements.length > 0) {
          setSelectedScheduleDate(localDate);
          setScheduleDialogOpen(true);
        }
      } else {
        // Admin and Teacher can always open the dialog
        setSelectedScheduleDate(localDate);
        setScheduleDialogOpen(true);
      }
    }
  };

  const handleAnnouncementClick = (announcement, event) => {
    event.stopPropagation();
    setSelectedAnnouncement(announcement);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDate(null);
    setSelectedAnnouncement(null);
  };

  const handleSave = () => {
    loadAnnouncements();
  };

  const handleScheduleDialogClose = () => {
    setScheduleDialogOpen(false);
    setSelectedScheduleDate(null);
  };

  const handleScheduleUpdate = async (schedule, formData) => {
    try {
      let result;
      if (schedule) {
        // Update existing schedule
        result = await updateSchedule(schedule.id, formData);
        if (result.success) {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Schedule updated successfully!",
            confirmButtonColor: "hsl(152, 65%, 28%)",
          });
          loadSchedules();
        } else {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error updating schedule: " + result.error,
            confirmButtonColor: "#d33",
          });
        }
      } else {
        // Create new schedule
        result = await createSchedule(formData);
        if (result.success) {
          await Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Schedule created successfully!",
            confirmButtonColor: "hsl(152, 65%, 28%)",
          });
          loadSchedules();
        } else {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error creating schedule: " + result.error,
            confirmButtonColor: "#d33",
          });
        }
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error: " + error.message,
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleScheduleDelete = async (schedule) => {
    try {
      const result = await deleteSchedule(schedule.id);
      if (result.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Schedule has been deleted successfully!",
          confirmButtonColor: "hsl(152, 65%, 28%)",
        });
        loadSchedules();
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error deleting schedule: " + result.error,
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error: " + error.message,
        confirmButtonColor: "#d33",
      });
    }
  };

  const handleAnnouncementUpdate = () => {
    loadAnnouncements();
  };

  const getSchedulesForSelectedDate = () => {
    if (!selectedScheduleDate) return [];

    // Handle both Date objects and date strings
    const date =
      selectedScheduleDate instanceof Date
        ? selectedScheduleDate
        : new Date(selectedScheduleDate + "T00:00:00");

    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    // Filter schedules by day of week
    let filteredSchedules = schedules.filter(
      (schedule) => schedule.day === dayName
    );

    // For teachers, only show their schedules
    if (isTeacher) {
      filteredSchedules = filteredSchedules.filter(
        (schedule) => schedule.teacherId === userProfile.uid
      );
    }
    // For parents, schedules are already filtered in loadSchedules

    return filteredSchedules;
  };

  const getAnnouncementsForSelectedDate = () => {
    if (!selectedScheduleDate) return [];

    // Format date to YYYY-MM-DD
    let dateStr;
    if (selectedScheduleDate instanceof Date) {
      const year = selectedScheduleDate.getFullYear();
      const month = String(selectedScheduleDate.getMonth() + 1).padStart(
        2,
        "0"
      );
      const day = String(selectedScheduleDate.getDate()).padStart(2, "0");
      dateStr = `${year}-${month}-${day}`;
    } else {
      dateStr = selectedScheduleDate;
    }

    return announcements.filter(
      (announcement) => announcement.date === dateStr
    );
  };

  const getAnnouncementColor = (type) => {
    switch (type) {
      case "event":
        return "primary";
      case "holiday":
        return "success";
      case "meeting":
        return "info";
      case "reminder":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
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
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CalendarToday
            sx={{ fontSize: 40, color: "hsl(152, 65%, 28%)", mr: 2 }}
          />
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
            {userProfile?.role === "teacher"
              ? "My Schedule Calendar"
              : userProfile?.role === "parent"
              ? "My Child's Schedule Calendar"
              : "Schedule Calendar"}
          </Typography>
        </Box>
        <Typography
          variant="body1"
          sx={{ color: "#1976d2", fontSize: "1.1rem", lineHeight: 1.6 }}>
          {userProfile?.role === "teacher"
            ? "View your teaching schedule and plan your classes for the month."
            : userProfile?.role === "parent"
            ? "View your child's class schedule, upcoming events, and important announcements."
            : "View all schedules and manage class timings for all teachers and sections."}
        </Typography>
      </Paper>

      {/* Calendar Section */}
      <Paper
        sx={{
          p: 4,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
            Schedule Calendar
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={() => {
                  loadSchedules();
                  loadAnnouncements();
                }}
                disabled={calendarLoading}
                size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => navigateMonth("prev")} size="small">
              <ChevronLeft />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ minWidth: 200, textAlign: "center" }}>
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Typography>
            <IconButton onClick={() => navigateMonth("next")} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        {calendarLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Calendar Header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 1,
                mb: 2,
              }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Typography
                  key={day}
                  variant="subtitle2"
                  sx={{
                    textAlign: "center",
                    fontWeight: 600,
                    color: "hsl(152, 65%, 28%)",
                    py: 1,
                  }}>
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Calendar Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 1,
              }}>
              {getDaysInMonth(currentDate).map((date, index) => {
                const daySchedules = getSchedulesForDate(date);
                const dayAnnouncements = getAnnouncementsForDate(date);
                const isToday =
                  date && date.toDateString() === new Date().toDateString();

                return (
                  <Box
                    key={index}
                    onClick={() => handleCellClick(date, false)}
                    sx={{
                      minHeight: 120,
                      p: 1,
                      border: "1px solid rgba(31, 120, 80, 0.1)",
                      borderRadius: 1,
                      backgroundColor: isToday
                        ? "rgba(31, 120, 80, 0.05)"
                        : "transparent",
                      position: "relative",
                      cursor: date ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      "&:hover": date
                        ? {
                            backgroundColor: "rgba(31, 120, 80, 0.08)",
                            transform: "scale(1.02)",
                            boxShadow: "0 2px 8px rgba(31, 120, 80, 0.2)",
                          }
                        : {},
                    }}>
                    {date && (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isToday ? 700 : 500,
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              color: isToday
                                ? "hsl(152, 65%, 28%)"
                                : "text.primary",
                            }}>
                            {date.getDate()}
                          </Typography>
                          {(isAdmin || isTeacher) && !isParent && (
                            <Tooltip title="Add announcement">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCellClick(date, true);
                                }}
                                sx={{
                                  width: 20,
                                  height: 20,
                                  opacity: 0.6,
                                  "&:hover": { opacity: 1 },
                                }}>
                                <Add sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        {/* Announcements for this day */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            mb: 1,
                          }}>
                          {dayAnnouncements
                            .slice(0, 2)
                            .map((announcement, announcementIndex) => (
                              <Tooltip
                                key={announcementIndex}
                                title={
                                  announcement.description || announcement.title
                                }
                                arrow>
                                <Chip
                                  label={announcement.title}
                                  size="small"
                                  color={getAnnouncementColor(
                                    announcement.type
                                  )}
                                  icon={<EventIcon sx={{ fontSize: 14 }} />}
                                  onClick={(e) =>
                                    handleAnnouncementClick(announcement, e)
                                  }
                                  sx={{
                                    fontSize: "0.65rem",
                                    height: 22,
                                    "& .MuiChip-label": {
                                      px: 0.5,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "100px",
                                    },
                                    "& .MuiChip-icon": {
                                      marginLeft: "4px",
                                      marginRight: "-2px",
                                    },
                                    cursor: "pointer",
                                  }}
                                />
                              </Tooltip>
                            ))}
                          {dayAnnouncements.length > 2 && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.65rem",
                                ml: 0.5,
                              }}>
                              +{dayAnnouncements.length - 2} more
                            </Typography>
                          )}
                        </Box>

                        {/* Schedule items for this day */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}>
                          {daySchedules
                            .slice(0, 2)
                            .map((schedule, scheduleIndex) => (
                              <Box
                                key={scheduleIndex}
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.25,
                                }}>
                                <Chip
                                  label={`${formatTime(
                                    schedule.timeIn
                                  )} - ${formatTime(schedule.timeOut)}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{
                                    fontSize: "0.65rem",
                                    height: 18,
                                    "& .MuiChip-label": {
                                      px: 0.5,
                                    },
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    fontSize: "0.6rem",
                                    fontWeight: 500,
                                    lineHeight: 1,
                                    textAlign: "center",
                                  }}>
                                  {getSkillName(schedule.subjectId)}
                                </Typography>
                              </Box>
                            ))}
                          {daySchedules.length > 2 && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.7rem",
                              }}>
                              +{daySchedules.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Weekly Summary - Schedules and Announcements */}
            {(schedules.length > 0 || announcements.length > 0) && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "rgba(31, 120, 80, 0.05)",
                  borderRadius: 1,
                }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)", mb: 2 }}>
                  {userProfile?.role === "teacher"
                    ? "My Weekly Schedule"
                    : userProfile?.role === "parent"
                    ? "My Child's Weekly Schedule"
                    : "Weekly Schedule Summary"}
                </Typography>

                {/* Schedules Section */}
                {schedules.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                        mb: 1,
                        display: "block",
                      }}>
                      Class Schedules
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {schedules.map((schedule, index) => (
                        <Box
                          key={`schedule-${index}`}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}>
                          <Chip
                            label={`${schedule.day}: ${
                              schedule.timeInStart && schedule.timeInEnd
                                ? `${formatTime(
                                    schedule.timeInStart
                                  )} - ${formatTime(schedule.timeInEnd)}`
                                : formatTime(schedule.timeIn)
                            } - ${
                              schedule.timeOutStart && schedule.timeOutEnd
                                ? `${formatTime(
                                    schedule.timeOutStart
                                  )} - ${formatTime(schedule.timeOutEnd)}`
                                : formatTime(schedule.timeOut)
                            }`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 0.5 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.7rem",
                              fontWeight: 500,
                              textAlign: "center",
                            }}>
                            {getSkillName(schedule.subjectId)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Announcements Section */}
                {announcements.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                        mb: 1,
                        display: "block",
                      }}>
                      This Week's Announcements & Events
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {announcements.slice(0, 6).map((announcement, index) => (
                        <Box
                          key={`announcement-${index}`}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}>
                          <Chip
                            label={announcement.title}
                            size="small"
                            color={getAnnouncementColor(announcement.type)}
                            icon={<EventIcon sx={{ fontSize: 14 }} />}
                            sx={{ mb: 0.5, maxWidth: "120px" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.7rem",
                              fontWeight: 500,
                              textAlign: "center",
                            }}>
                            {announcement.date}
                          </Typography>
                        </Box>
                      ))}
                      {announcements.length > 6 && (
                        <Chip
                          label={`+${announcements.length - 6} more`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {schedules.length === 0 && !calendarLoading && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CalendarToday
                  sx={{ fontSize: 64, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary">
                  No schedules found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile?.role === "teacher"
                    ? "You have no schedules assigned yet."
                    : userProfile?.role === "parent"
                    ? "Your child has no schedules assigned yet."
                    : "No schedules have been created yet."}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Announcement Dialog */}
      <AnnouncementDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        selectedDate={selectedDate}
        announcement={selectedAnnouncement}
        onSave={handleSave}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        currentUser={userProfile}
      />

      {/* Calendar Day Dialog */}
      <CalendarDayDialog
        open={scheduleDialogOpen}
        onClose={handleScheduleDialogClose}
        selectedDate={selectedScheduleDate}
        schedules={getSchedulesForSelectedDate()}
        announcements={getAnnouncementsForSelectedDate()}
        skills={skills}
        users={users}
        sections={sections}
        onScheduleUpdate={handleScheduleUpdate}
        onScheduleDelete={handleScheduleDelete}
        onAnnouncementUpdate={handleAnnouncementUpdate}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isParent={isParent}
      />
    </Box>
  );
};

export default CalendarContent;
