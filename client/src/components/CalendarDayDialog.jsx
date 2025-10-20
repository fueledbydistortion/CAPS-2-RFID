import {
  Add,
  CalendarToday,
  Close,
  Edit,
  Event as EventIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { formatTo12Hour } from "../utils/timeUtils";
import AnnouncementDialog from "./AnnouncementDialog";
import ScheduleForm from "./ScheduleForm";

const CalendarDayDialog = ({
  open,
  onClose,
  selectedDate,
  schedules = [],
  announcements = [],
  skills = [],
  users = [],
  sections = [],
  onScheduleUpdate,
  onScheduleDelete,
  onAnnouncementUpdate,
  isAdmin = false,
  isTeacher = false,
  isParent = false,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);

  const getSkillName = (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    return skill ? skill.name : "Unknown Subject";
  };

  const getSkillDescription = (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    return skill ? skill.description : "";
  };

  const getDisplayText = (schedule) => {
    const skillName = getSkillName(schedule.subjectId);
    const skillDescription = getSkillDescription(schedule.subjectId);

    // If there's a description, use it, otherwise use the skill name
    if (skillDescription && skillDescription.trim()) {
      return skillDescription;
    }

    // Fallback to skill name if no description
    return skillName;
  };

  const getTeacherName = (teacherId) => {
    const teacher = users.find((u) => u.id === teacherId);
    return teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "Unknown Teacher";
  };

  const getSectionName = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.name : "Unknown Section";
  };

  const handleEditScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setEditDialogOpen(true);
  };

  const handleAddScheduleClick = () => {
    setSelectedSchedule(null);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedSchedule(null);
  };

  const handleScheduleSubmit = async (formData) => {
    setLoading(true);
    try {
      if (onScheduleUpdate) {
        await onScheduleUpdate(selectedSchedule, formData);
      }
      setEditDialogOpen(false);
      setSelectedSchedule(null);
    } catch (error) {
      console.error("Error updating schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (schedule) => {
    const result = await Swal.fire({
      title: "Delete Schedule?",
      text: `Are you sure you want to delete the schedule for ${getDisplayText(
        schedule
      )} on ${schedule.day}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed && onScheduleDelete) {
      await onScheduleDelete(schedule);
    }
  };

  const handleAddAnnouncementClick = () => {
    setSelectedAnnouncement(null);
    setAnnouncementDialogOpen(true);
  };

  const handleEditAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementDialogOpen(true);
  };

  const handleAnnouncementDialogClose = () => {
    setAnnouncementDialogOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleAnnouncementSave = () => {
    setAnnouncementDialogOpen(false);
    setSelectedAnnouncement(null);
    if (onAnnouncementUpdate) {
      onAnnouncementUpdate();
    }
  };

  const handleDeleteAnnouncement = async (announcement) => {
    const result = await Swal.fire({
      title: "Delete Announcement?",
      text: `Are you sure you want to delete "${announcement.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#999",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed && onAnnouncementUpdate) {
      const { deleteAnnouncement } = await import(
        "../utils/announcementService"
      );
      const deleteResult = await deleteAnnouncement(announcement.id);

      if (deleteResult.success) {
        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Announcement has been deleted.",
          confirmButtonColor: "hsl(152, 65%, 28%)",
        });
        onAnnouncementUpdate();
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete announcement: " + deleteResult.error,
          confirmButtonColor: "#d33",
        });
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = date instanceof Date ? date : new Date(date + "T00:00:00");
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFormattedDateString = (date) => {
    if (!date) return "";
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    return date;
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

  // Sort schedules by time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const timeA = new Date(`2000/01/01 ${a.timeIn}`);
    const timeB = new Date(`2000/01/01 ${b.timeIn}`);
    return timeA - timeB;
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(31, 120, 80, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
            maxHeight: "80vh",
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
            pb: 2,
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarToday />
            <span>Schedule</span>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "hsl(152, 65%, 28%)",
              "&:hover": {
                backgroundColor: "rgba(31, 120, 80, 0.1)",
              },
            }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Date Header - Pic.1 Style */}
          <Box sx={{ px: 4, pt: 3, pb: 2, textAlign: "center" }}>
            {/* Day and Date */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "hsl(152, 65%, 28%)",
                  mb: 1,
                }}>
                {selectedDate && selectedDate instanceof Date
                  ? selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                    })
                  : selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "short" }
                    )
                  : ""}
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 700,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "hsl(152, 65%, 28%)",
                  lineHeight: 1,
                  fontSize: "4rem",
                }}>
                {selectedDate && selectedDate instanceof Date
                  ? selectedDate.getDate()
                  : selectedDate
                  ? new Date(selectedDate + "T00:00:00").getDate()
                  : ""}
              </Typography>
            </Box>

            {/* Class Schedule Preview */}
            {sortedSchedules.length > 0 && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "rgba(31, 120, 80, 0.05)",
                  borderRadius: "12px",
                  border: "1px solid rgba(31, 120, 80, 0.1)",
                }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: "hsl(152, 65%, 28%)",
                    mb: 1,
                    textAlign: "left",
                  }}>
                  Class Schedule for Today
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {sortedSchedules.slice(0, 3).map((schedule, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.primary", fontWeight: 500 }}>
                        {getDisplayText(schedule)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}>
                        {formatTo12Hour(schedule.timeIn)} -{" "}
                        {formatTo12Hour(schedule.timeOut)}
                      </Typography>
                    </Box>
                  ))}
                  {sortedSchedules.length > 3 && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      +{sortedSchedules.length - 3} more classes
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Add Buttons */}
            {(isAdmin || isTeacher) && !isParent && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  gap: 1,
                }}>
                <Tooltip title="Add Announcement">
                  <IconButton
                    onClick={handleAddAnnouncementClick}
                    sx={{
                      bgcolor: "#4caf50",
                      color: "white",
                      width: 40,
                      height: 40,
                      "&:hover": {
                        bgcolor: "#45a049",
                      },
                    }}>
                    <EventIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Schedule">
                  <IconButton
                    onClick={handleAddScheduleClick}
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      width: 40,
                      height: 40,
                      "&:hover": {
                        bgcolor: "#1565c0",
                      },
                    }}>
                    <Add />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Events List - Pic.1 Style */}
          <Box sx={{ px: 4, pb: 3 }}>
            {/* Schedules */}
            {sortedSchedules.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {sortedSchedules.slice(0, 5).map((schedule, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    {/* Main Schedule Pill */}
                    <Box
                      sx={{
                        bgcolor:
                          index % 2 === 0 ? "hsl(152, 65%, 28%)" : "#1976d2",
                        color: "white",
                        borderRadius: "20px",
                        px: 3,
                        py: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        width: "100%",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        mb: 1,
                      }}>
                      <CalendarToday sx={{ fontSize: 20, color: "white" }} />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: "white",
                          flex: 1,
                        }}>
                        {getDisplayText(schedule)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 500,
                          color: "rgba(255, 255, 255, 0.9)",
                          fontSize: "0.75rem",
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

                    {/* Action Buttons */}
                    {(isAdmin || isTeacher) && !isParent && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                          mt: 1,
                        }}>
                        <Tooltip title="Edit Schedule">
                          <IconButton
                            size="small"
                            onClick={() => handleEditScheduleClick(schedule)}
                            sx={{
                              color: "hsl(152, 65%, 28%)",
                              "&:hover": {
                                backgroundColor: "rgba(31, 120, 80, 0.1)",
                              },
                            }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Schedule">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSchedule(schedule)}
                            sx={{
                              color: "#d32f2f",
                              "&:hover": {
                                backgroundColor: "rgba(211, 47, 47, 0.1)",
                              },
                            }}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                ))}
                {sortedSchedules.length > 5 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textAlign: "center",
                      mt: 2,
                      fontWeight: 500,
                    }}>
                    +{sortedSchedules.length - 5} more
                  </Typography>
                )}
              </Box>
            )}

            {/* Announcements */}
            {announcements.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {announcements.slice(0, 3).map((announcement, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    {/* Main Announcement Pill */}
                    <Box
                      sx={{
                        bgcolor:
                          index % 2 === 0 ? "#1976d2" : "hsl(152, 65%, 28%)",
                        color: "white",
                        borderRadius: "20px",
                        px: 3,
                        py: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        width: "100%",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        mb: 1,
                      }}>
                      <EventIcon sx={{ fontSize: 20, color: "white" }} />
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: "white",
                          flex: 1,
                        }}>
                        {announcement.title}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    {(isAdmin || isTeacher) && !isParent && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                          mt: 1,
                        }}>
                        <Tooltip title="Edit Announcement">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEditAnnouncementClick(announcement)
                            }
                            sx={{
                              color: "hsl(152, 65%, 28%)",
                              "&:hover": {
                                backgroundColor: "rgba(31, 120, 80, 0.1)",
                              },
                            }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Announcement">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteAnnouncement(announcement)
                            }
                            sx={{
                              color: "#d32f2f",
                              "&:hover": {
                                backgroundColor: "rgba(211, 47, 47, 0.1)",
                              },
                            }}>
                            <Close fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                ))}
                {announcements.length > 3 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textAlign: "center",
                      mt: 2,
                      fontWeight: 500,
                    }}>
                    +{announcements.length - 3} more
                  </Typography>
                )}
              </Box>
            )}

            {/* No Events */}
            {sortedSchedules.length === 0 && announcements.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CalendarToday
                  sx={{ fontSize: 64, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No events for this day
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}>
                  {(isAdmin || isTeacher) && !isParent
                    ? "Add a schedule or announcement to get started."
                    : "There are no schedules or announcements for this day."}
                </Typography>
                {(isAdmin || isTeacher) && !isParent && (
                  <Box
                    sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <Button
                      variant="contained"
                      startIcon={<EventIcon />}
                      onClick={handleAddAnnouncementClick}
                      sx={{
                        bgcolor: "#4caf50",
                        borderRadius: "20px",
                        px: 3,
                        py: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": {
                          bgcolor: "#45a049",
                        },
                      }}>
                      Add Announcement
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleAddScheduleClick}
                      sx={{
                        bgcolor: "#1976d2",
                        borderRadius: "20px",
                        px: 3,
                        py: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": {
                          bgcolor: "#1565c0",
                        },
                      }}>
                      Add Schedule
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Quick Add Actions - Show when there are existing events */}
            {(sortedSchedules.length > 0 || announcements.length > 0) &&
              (isAdmin || isTeacher) &&
              !isParent && (
                <Box
                  sx={{
                    mt: 3,
                    pt: 3,
                    borderTop: "1px solid rgba(0,0,0,0.1)",
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                  }}>
                  <Button
                    variant="outlined"
                    startIcon={<EventIcon />}
                    onClick={handleAddAnnouncementClick}
                    sx={{
                      borderColor: "#4caf50",
                      color: "#4caf50",
                      borderRadius: "20px",
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "#45a049",
                        backgroundColor: "rgba(76, 175, 80, 0.05)",
                      },
                    }}>
                    Add Announcement
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddScheduleClick}
                    sx={{
                      borderColor: "#1976d2",
                      color: "#1976d2",
                      borderRadius: "20px",
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        borderColor: "#1565c0",
                        backgroundColor: "rgba(25, 118, 210, 0.05)",
                      },
                    }}>
                    Add Schedule
                  </Button>
                </Box>
              )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, justifyContent: "center" }}>
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              borderRadius: "20px",
              px: 6,
              py: 2,
              background:
                "linear-gradient(to bottom, hsl(152, 65%, 28%), hsl(152, 60%, 25%))",
              boxShadow: "0 4px 12px rgba(31, 120, 80, 0.3)",
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              "&:hover": {
                background:
                  "linear-gradient(to bottom, hsl(152, 60%, 25%), hsl(152, 55%, 22%))",
                boxShadow: "0 6px 16px rgba(31, 120, 80, 0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Form Dialog */}
      <ScheduleForm
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onSubmit={handleScheduleSubmit}
        scheduleData={selectedSchedule}
        selectedDate={selectedDate}
        loading={loading}
      />

      {/* Announcement Dialog */}
      <AnnouncementDialog
        open={announcementDialogOpen}
        onClose={handleAnnouncementDialogClose}
        selectedDate={getFormattedDateString(selectedDate)}
        announcement={selectedAnnouncement}
        onSave={handleAnnouncementSave}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
      />
    </>
  );
};

export default CalendarDayDialog;
