import {
  AccessTime,
  Add,
  CalendarToday,
  Class as ClassIcon,
  Close,
  Delete,
  Description,
  Edit,
  Event as EventIcon,
  Person,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { formatTo12Hour } from "../utils/timeUtils";
import AnnouncementDialog from "./AnnouncementDialog";
import ScheduleForm from "./ScheduleForm";

const ScheduleDetailDialog = ({ 
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
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const getSkillName = (skillId) => {
    const skill = skills.find((s) => s.id === skillId);
    return skill ? skill.name : "Unknown Subject";
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
      text: `Are you sure you want to delete the schedule for ${getSkillName(
        schedule.subjectId
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
      // Import delete function here
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

  const getDayOfWeek = (date) => {
    if (!date) return "";
    const dateObj = date instanceof Date ? date : new Date(date + "T00:00:00");
    return dateObj.toLocaleDateString("en-US", { weekday: "long" });
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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(31, 120, 80, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
            maxHeight: "90vh",
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
            <span>Schedule & Events</span>
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
          {/* Date Header */}
          <Box sx={{ px: 4, pt: 3, pb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: "hsl(152, 65%, 28%)",
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 700,
              }}>
              {formatDate(selectedDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Day: {getDayOfWeek(selectedDate)}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 4 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                },
              }}>
              <Tab 
                label={`Schedules (${schedules.length})`} 
                icon={<CalendarToday />} 
                iconPosition="start"
              />
              <Tab 
                label={`Announcements (${announcements.length})`} 
                icon={<EventIcon />} 
                iconPosition="start"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ px: 4, py: 3, maxHeight: "50vh", overflowY: "auto" }}>
            {/* Schedules Tab */}
            {tabValue === 0 && (
              <Box>
                {schedules.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <CalendarToday
                      sx={{
                        fontSize: 64,
                        color: "rgba(31, 120, 80, 0.3)",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom>
                      No schedules for this day
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}>
                      {isAdmin || isTeacher
                        ? "Click the button below to create a new schedule for this day."
                        : isTeacher
                        ? "You don't have any classes scheduled for this day."
                        : "There are no schedules for this day yet."}
                    </Typography>
                    {(isAdmin || isTeacher) && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddScheduleClick}
                        sx={{ 
                          background:
                            "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                          borderRadius: "12px",
                          px: 3,
                          py: 1,
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))",
                          },
                        }}>
                        Create Schedule
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {schedules.map((schedule, index) => (
                      <Card 
                        key={index}
                        sx={{ 
                          border: "1px solid rgba(31, 120, 80, 0.2)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(31, 120, 80, 0.1)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(31, 120, 80, 0.2)",
                          },
                        }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 2,
                            }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                  color: "hsl(152, 65%, 28%)",
                                  mb: 1,
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                  fontWeight: 700,
                                }}>
                                {getSkillName(schedule.subjectId)}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 1,
                                }}>
                                <AccessTime
                                  sx={{ fontSize: 18, color: "text.secondary" }}
                                />
                                <Typography
                                  variant="body2"
                                  color="text.secondary">
                                  {schedule.timeInStart && schedule.timeInEnd
                                    ? `${formatTo12Hour(
                                        schedule.timeInStart
                                      )} - ${formatTo12Hour(
                                        schedule.timeInEnd
                                      )}`
                                    : formatTo12Hour(schedule.timeIn)}{" "}
                                  -{" "}
                                  {schedule.timeOutStart && schedule.timeOutEnd
                                    ? `${formatTo12Hour(
                                        schedule.timeOutStart
                                      )} - ${formatTo12Hour(
                                        schedule.timeOutEnd
                                      )}`
                                    : formatTo12Hour(schedule.timeOut)}
                                </Typography>
                              </Box>
                            </Box>
                            {(isAdmin || isTeacher) && (
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Tooltip title="Edit Schedule">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEditScheduleClick(schedule)
                                    }
                                    sx={{ 
                                      color: "hsl(152, 65%, 28%)",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(31, 120, 80, 0.1)",
                                      },
                                    }}>
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Schedule">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteSchedule(schedule)
                                    }
                                    sx={{ 
                                      color: "#d32f2f",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(211, 47, 47, 0.1)",
                                      },
                                    }}>
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {/* Schedule Details */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                            }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}>
                              <Person
                                sx={{
                                  fontSize: 20,
                                  color: "hsl(145, 60%, 40%)",
                                }}
                              />
                              <Typography variant="body2">
                                <strong>Teacher:</strong>{" "}
                                {getTeacherName(schedule.teacherId)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}>
                              <ClassIcon
                                sx={{
                                  fontSize: 20,
                                  color: "hsl(145, 60%, 40%)",
                                }}
                              />
                              <Typography variant="body2">
                                <strong>Section:</strong>{" "}
                                {getSectionName(schedule.sectionId)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}>
                              <CalendarToday
                                sx={{
                                  fontSize: 20,
                                  color: "hsl(145, 60%, 40%)",
                                }}
                              />
                              <Typography variant="body2">
                                <strong>Day:</strong> {schedule.day}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add New Schedule Button */}
                    {(isAdmin || isTeacher) && (
                      <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={handleAddScheduleClick}
                          sx={{ 
                            borderRadius: "12px",
                            borderColor: "hsl(152, 65%, 28%)",
                            color: "hsl(152, 65%, 28%)",
                            px: 3,
                            py: 1,
                            "&:hover": {
                              borderColor: "#0d47a1",
                              backgroundColor: "rgba(31, 120, 80, 0.05)",
                            },
                          }}>
                          Add Another Schedule
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Announcements Tab */}
            {tabValue === 1 && (
              <Box>
                {announcements.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <EventIcon
                      sx={{
                        fontSize: 64,
                        color: "rgba(31, 120, 80, 0.3)",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom>
                      No announcements for this date
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3 }}>
                      {isAdmin || isTeacher
                        ? "Click the button below to create an announcement or event for this date."
                        : "There are no announcements or events for this date."}
                    </Typography>
                    {(isAdmin || isTeacher) && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddAnnouncementClick}
                        sx={{ 
                          background:
                            "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                          borderRadius: "12px",
                          px: 3,
                          py: 1,
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))",
                          },
                        }}>
                        Create Announcement
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {announcements.map((announcement, index) => (
                      <Card 
                        key={index}
                        sx={{ 
                          border: "1px solid rgba(31, 120, 80, 0.2)",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(31, 120, 80, 0.1)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 6px 20px rgba(31, 120, 80, 0.2)",
                          },
                        }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 2,
                            }}>
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 1,
                                }}>
                                <Chip 
                                  label={announcement.type} 
                                  size="small"
                                  color={getAnnouncementColor(
                                    announcement.type
                                  )}
                                  sx={{
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                  color: "hsl(152, 65%, 28%)",
                                  mb: 1,
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                  fontWeight: 700,
                                }}>
                                {announcement.title}
                              </Typography>
                              {announcement.description && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1,
                                    mb: 1,
                                  }}>
                                  <Description
                                    sx={{
                                      fontSize: 18,
                                      color: "text.secondary",
                                      mt: 0.3,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary">
                                    {announcement.description}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            {(isAdmin || isTeacher) && (
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Tooltip title="Edit Announcement">
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEditAnnouncementClick(announcement)
                                    }
                                    sx={{ 
                                      color: "hsl(152, 65%, 28%)",
                                      "&:hover": {
                                        backgroundColor:
                                          "rgba(31, 120, 80, 0.1)",
                                      },
                                    }}>
                                    <Edit />
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
                                        backgroundColor:
                                          "rgba(211, 47, 47, 0.1)",
                                      },
                                    }}>
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add New Announcement Button */}
                    {(isAdmin || isTeacher) && (
                      <Box sx={{ textAlign: "center", mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={handleAddAnnouncementClick}
                          sx={{ 
                            borderRadius: "12px",
                            borderColor: "hsl(152, 65%, 28%)",
                            color: "hsl(152, 65%, 28%)",
                            px: 3,
                            py: 1,
                            "&:hover": {
                              borderColor: "#0d47a1",
                              backgroundColor: "rgba(31, 120, 80, 0.05)",
                            },
                          }}>
                          Add Another Announcement
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose}
            sx={{ 
              borderRadius: "12px",
              px: 3,
              py: 1,
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

export default ScheduleDetailDialog;
