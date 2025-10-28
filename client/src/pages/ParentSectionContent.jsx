import {
  AccessTime,
  Assignment,
  Book,
  CheckCircle,
  Refresh,
  School,
  Search,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import AssignmentDetailDialog from "../components/AssignmentDetailDialog";
import LessonDetailDialog from "../components/LessonDetailDialog";
import { useAuth } from "../contexts/AuthContext";
import { getParentSectionContent } from "../utils/parentSectionService";
import {
  getAttachmentProgress,
  getMultipleLessonProgress,
  getProgressColor,
  getProgressStatus,
  updateAttachmentProgressWithLessonUpdate,
} from "../utils/progressService";

const ParentSectionContent = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [content, setContent] = useState({
    sections: [],
    modules: [],
    assignments: [],
    skills: [],
  });
  const [filteredContent, setFilteredContent] = useState({
    modules: [],
    assignments: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [lessonProgress, setLessonProgress] = useState({});
  const [attachmentProgress, setAttachmentProgress] = useState({});
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (userProfile && userProfile.role === "parent") {
      loadContent();
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [content, searchTerm, skillFilter, assignmentFilter]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const result = await getParentSectionContent(userProfile.uid);
      if (result.success) {
        setContent(result.data);
        setFilteredContent({
          modules: result.data.modules,
          assignments: result.data.assignments,
        });

        // Load progress for all modules
        if (result.data.modules && result.data.modules.length > 0) {
          loadModuleProgress(result.data.modules);
        }
      } else {
        showSnackbar("Error loading content: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading content: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadModuleProgress = async (modules) => {
    try {
      const lessonIds = modules.map((module) => module.id);
      const result = await getMultipleLessonProgress(
        userProfile.uid,
        lessonIds
      );
      if (result.success) {
        setLessonProgress(result.data);
      }

      // Load attachment progress for each lesson
      const attachmentProgressData = {};
      for (const module of modules) {
        if (module.attachments && module.attachments.length > 0) {
          const attachmentResult = await getAttachmentProgress(
            userProfile.uid,
            module.id
          );
          if (attachmentResult.success) {
            attachmentProgressData[module.id] = attachmentResult.data;
          }
        }
      }
      setAttachmentProgress(attachmentProgressData);
    } catch (error) {
      console.error("Error loading module progress:", error);
    }
  };

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentDialogOpen(true);
  };

  const handleAssignmentSubmissionSuccess = (submissionData) => {
    showSnackbar("Assignment submitted successfully!", "success");
    // Optionally refresh the content or update the assignment status
  };

  const handleProgressUpdate = (lessonId, progressData) => {
    setLessonProgress((prev) => ({
      ...prev,
      [lessonId]: progressData,
    }));
  };

  const handleAttachmentView = async (lessonId, attachmentId) => {
    try {
      console.log("ParentSectionContent handleAttachmentView called with:", {
        lessonId,
        attachmentId,
        userId: userProfile.uid,
      });

      const result = await updateAttachmentProgressWithLessonUpdate(
        userProfile.uid,
        lessonId,
        attachmentId
      );
      if (result.success) {
        // Update local attachment progress
        setAttachmentProgress((prev) => ({
          ...prev,
          [lessonId]: {
            ...prev[lessonId],
            [attachmentId]: result.data.attachmentProgress,
          },
        }));

        // Update lesson progress with the updated data from backend
        if (result.data.lessonProgress) {
          await handleProgressUpdate(lessonId, result.data.lessonProgress);
        }

        // Show success notification
        showSnackbar("Attachment progress updated successfully!", "success");
      } else {
        showSnackbar(
          "Error updating attachment progress: " + result.error,
          "error"
        );
      }
    } catch (error) {
      console.error("Error updating attachment progress:", error);
      showSnackbar(
        "Error updating attachment progress: " + error.message,
        "error"
      );
    }
  };

  const applyFilters = async () => {
    if (!content.modules || !content.assignments) return;

    let filteredModules = [...content.modules];
    let filteredAssignments = [...content.assignments];

    // Apply search filter
    if (searchTerm.trim()) {
      filteredModules = filteredModules.filter(
        (module) =>
          module.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          module.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          module.skillName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredAssignments = filteredAssignments.filter(
        (assignment) =>
          assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          assignment.skillName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply skill filter
    if (skillFilter !== "all") {
      filteredModules = filteredModules.filter(
        (module) => module.skillId === skillFilter
      );
      filteredAssignments = filteredAssignments.filter(
        (assignment) => assignment.skillId === skillFilter
      );
    }

    // Apply assignment filter
    if (assignmentFilter !== "all") {
      const now = new Date();
      switch (assignmentFilter) {
        case "upcoming":
          filteredAssignments = filteredAssignments.filter((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dueDate >= now && dueDate <= nextWeek;
          });
          break;
        case "overdue":
          filteredAssignments = filteredAssignments.filter((assignment) => {
            const dueDate = new Date(assignment.dueDate);
            return dueDate < now;
          });
          break;
        case "completed":
          // This would need a completion status field in assignments
          break;
      }
    }

    setFilteredContent({
      modules: filteredModules,
      assignments: filteredAssignments,
    });
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getAssignmentStatus = (dueDate, assignment) => {
    // If assignment has submissions and is graded, show completed status
    if (assignment?.latestSubmission?.status === 'graded') {
      return { status: "completed", color: "success", text: "Completed" };
    }
    
    // If assignment has submissions but not graded yet
    if (assignment?.latestSubmission?.status === 'submitted') {
      return { status: "submitted", color: "info", text: "Submitted" };
    }

    // If no submission, check due date
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: "overdue", color: "error", text: "Overdue" };
    } else if (diffDays <= 3) {
      return { status: "urgent", color: "warning", text: "Due Soon" };
    } else if (diffDays <= 7) {
      return { status: "upcoming", color: "info", text: "Upcoming" };
    } else {
      return { status: "normal", color: "success", text: "On Track" };
    }
  };

  if (userProfile?.role !== "parent") {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Access denied. This page is only for parents.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
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
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}>
          <Box>
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
              My Child's Learning Content
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View modules and assignments for your child's sections
            </Typography>
          </Box>
          <IconButton onClick={loadContent} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Card
            sx={{
              flex: "1 1 200px",
              minWidth: "200px",
              textAlign: "center",
              p: 2,
              background: "rgba(31, 120, 80, 0.1)",
              border: "2px solid rgba(31, 120, 80, 0.2)",
              borderRadius: "12px",
            }}>
            <School sx={{ fontSize: 40, color: "hsl(152, 65%, 28%)", mb: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                color: "hsl(152, 65%, 28%)",
              }}>
              {content.sections?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Daycare Centers
            </Typography>
          </Card>
          <Card
            sx={{
              flex: "1 1 200px",
              minWidth: "200px",
              textAlign: "center",
              p: 2,
              background: "rgba(76, 175, 80, 0.1)",
              border: "2px solid rgba(76, 175, 80, 0.2)",
              borderRadius: "12px",
            }}>
            <Book sx={{ fontSize: 40, color: "#4caf50", mb: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                color: "#4caf50",
              }}>
              {content.modules?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Modules
            </Typography>
          </Card>
          <Card
            sx={{
              flex: "1 1 200px",
              minWidth: "200px",
              textAlign: "center",
              p: 2,
              background: "rgba(255, 152, 0, 0.1)",
              border: "2px solid rgba(255, 152, 0, 0.2)",
              borderRadius: "12px",
            }}>
            <Assignment sx={{ fontSize: 40, color: "#ff9800", mb: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                color: "#ff9800",
              }}>
              {content.assignments?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assignments
            </Typography>
          </Card>
          <Card
            sx={{
              flex: "1 1 200px",
              minWidth: "200px",
              textAlign: "center",
              p: 2,
              background: "rgba(156, 39, 176, 0.1)",
              border: "2px solid rgba(156, 39, 176, 0.2)",
              borderRadius: "12px",
            }}>
            <TrendingUp sx={{ fontSize: 40, color: "#9c27b0", mb: 1 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                color: "#9c27b0",
              }}>
              {content.skills?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Skills
            </Typography>
          </Card>
        </Box>

        {/* Search Bar - Full Width */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search modules and assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                "&:hover fieldset": {
                  borderColor: "hsl(152, 65%, 28%)",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "hsl(152, 65%, 28%)",
                },
              },
            }}
          />
        </Box>

        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Skill</InputLabel>
            <Select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              label="Filter by Skill">
              <MenuItem value="all">All Skills</MenuItem>
              {content.skills?.map((skill) => (
                <MenuItem key={skill.id} value={skill.id}>
                  {skill.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Assignment Status</InputLabel>
            <Select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              label="Assignment Status">
              <MenuItem value="all">All Assignments</MenuItem>
              <MenuItem value="upcoming">Upcoming</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", mt: 3 }}>
          <Tab
            icon={<Book />}
            label={`Modules (${filteredContent.modules.length})`}
            iconPosition="start"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
          <Tab
            icon={<Assignment />}
            label={`Assignments (${filteredContent.assignments.length})`}
            iconPosition="start"
            sx={{ textTransform: "none", fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* Content based on active tab */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
        // Modules Tab
        <Paper
          sx={{
            p: 4,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(31, 120, 80, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
          }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)", mb: 3 }}>
            Learning Modules
          </Typography>

          {filteredContent.modules.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Book
                sx={{ fontSize: 64, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No modules found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No modules are assigned to your child's sections yet"}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {filteredContent.modules.map((module) => {
                const progress = lessonProgress[module.id];
                const progressPercentage = progress?.percentage || 0;
                const progressStatus = getProgressStatus(progressPercentage);

                // Calculate attachment progress
                const lessonAttachmentProgress =
                  attachmentProgress[module.id] || {};
                const totalAttachments = module.attachments?.length || 0;
                const viewedAttachments = Object.keys(
                  lessonAttachmentProgress
                ).length;
                const attachmentProgressPercentage =
                  totalAttachments > 0
                    ? Math.round((viewedAttachments / totalAttachments) * 100)
                    : 0;

                return (
                  <Card
                    key={module.id}
                    onClick={() => handleLessonClick(module)}
                    sx={{
                      flex: "1 1 350px",
                      minWidth: "350px",
                      maxWidth: "400px",
                      background: "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(15px)",
                      border: "2px solid rgba(31, 120, 80, 0.2)",
                      borderRadius: "16px",
                      boxShadow: "0 6px 20px rgba(31, 120, 80, 0.15)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 30px rgba(31, 120, 80, 0.25)",
                      },
                    }}>
                    <CardHeader
                      avatar={<Book sx={{ color: "hsl(152, 65%, 28%)" }} />}
                      title={module.title}
                      subheader={`Order: ${module.order}`}
                      titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
                      action={
                        <Chip
                          label={`${progressPercentage}%`}
                          color={getProgressColor(progressPercentage)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      }
                    />
                    <CardContent>
                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: progressStatus.color,
                            }}>
                            {progressStatus.text}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercentage}
                          color={getProgressColor(progressPercentage)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "rgba(31, 120, 80, 0.1)",
                          }}
                        />
                      </Box>

                      {/* Attachment Progress */}
                      {totalAttachments > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              Attachments ({viewedAttachments}/
                              {totalAttachments})
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color:
                                  attachmentProgressPercentage === 100
                                    ? "success.main"
                                    : "info.main",
                              }}>
                              {attachmentProgressPercentage}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={attachmentProgressPercentage}
                            color={
                              attachmentProgressPercentage === 100
                                ? "success"
                                : "info"
                            }
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              backgroundColor: "rgba(31, 120, 80, 0.1)",
                            }}
                          />
                        </Box>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}>
                        {module.description || "No description"}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                          mb: 2,
                        }}>
                        <Chip
                          label={module.skillName}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={module.sectionName}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Grade {module.sectionGrade} • Click to view details
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Paper>
      ) : (
        // Assignments Tab
        <Paper
          sx={{
            p: 4,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(31, 120, 80, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
          }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)", mb: 3 }}>
            Assignments
          </Typography>

          {filteredContent.assignments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Assignment
                sx={{ fontSize: 64, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No assignments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No assignments are assigned to your child's sections yet"}
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
                border: "1px solid rgba(31, 120, 80, 0.2)",
                borderRadius: "12px",
              }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(31, 120, 80, 0.05)" }}>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Assignment
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Skill
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Daycare Center
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Due Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Status
                    </TableCell>
                    {/* Points column removed per letter-only grading */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredContent.assignments.map((assignment) => {
                    const status = getAssignmentStatus(assignment.dueDate, assignment);
                    return (
                      <TableRow
                        key={assignment.id}
                        hover
                        onClick={() => handleAssignmentClick(assignment)}
                        sx={{ cursor: "pointer" }}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ color: "hsl(152, 65%, 28%)" }}>
                            {assignment.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.description || "No description"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={assignment.skillName}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {assignment.sectionName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Grade {assignment.sectionGrade}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.text}
                            size="small"
                            color={status.color}
                            variant="filled"
                            icon={
                              status.status === "overdue" ? (
                                <Warning />
                              ) : status.status === "urgent" ? (
                                <AccessTime />
                              ) : (
                                <CheckCircle />
                              )
                            }
                          />
                        </TableCell>
                        {/* Points cell removed per letter-only grading */}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Lesson Detail Dialog */}
      <LessonDetailDialog
        open={lessonDialogOpen}
        onClose={() => setLessonDialogOpen(false)}
        lesson={selectedLesson}
        userId={userProfile?.uid}
        onProgressUpdate={handleProgressUpdate}
        onAttachmentView={handleAttachmentView}
        attachmentProgress={
          selectedLesson ? attachmentProgress[selectedLesson.id] : {}
        }
      />

      {/* Assignment Detail Dialog */}
      <AssignmentDetailDialog
        open={assignmentDialogOpen}
        onClose={() => setAssignmentDialogOpen(false)}
        assignment={selectedAssignment}
        onSubmissionSuccess={handleAssignmentSubmissionSuccess}
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

export default ParentSectionContent;
