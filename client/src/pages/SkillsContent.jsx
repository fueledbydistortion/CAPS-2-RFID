import {
  Add,
  Assignment,
  Attachment,
  Book,
  Delete,
  Edit,
  ExpandLess,
  ExpandMore,
  FileDownload,
  Grade,
  Refresh,
  School,
  Search,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
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
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import AssignmentForm from "../components/AssignmentForm";
import AssignmentGradingDialog from "../components/AssignmentGradingDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import LessonForm from "../components/LessonForm";
import SectionAssignmentDialog from "../components/SectionAssignmentDialog";
import SkillForm from "../components/SkillForm";
import { useAuth } from "../contexts/AuthContext";
import {
  createAssignment,
  deleteAssignment,
  getAllAssignments,
  updateAssignment,
} from "../utils/assignmentService";
import {
  formatFileSize,
  getFileUrlFromAttachment,
  uploadLessonFiles,
} from "../utils/fileService";
import {
  createLesson,
  deleteLesson,
  getAllLessons,
  updateLesson,
} from "../utils/lessonService";
import { getSkillProgress } from "../utils/progressService";
import {
  createSkill,
  deleteSkill,
  getAllSkills,
  getSkillSections,
  updateSkill,
} from "../utils/skillService";

const SkillsContent = () => {
  const { userProfile } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSkills, setExpandedSkills] = useState(new Set());
  const [skillLessons, setSkillLessons] = useState({});
  const [skillAssignments, setSkillAssignments] = useState({});
  const [skillSections, setSkillSections] = useState({});
  const [skillProgress, setSkillProgress] = useState({});
  const [activeTabs, setActiveTabs] = useState({});
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [selectedLessonAttachments, setSelectedLessonAttachments] = useState(
    []
  );
  const [selectedLessonTitle, setSelectedLessonTitle] = useState("");

  // Dialog states
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [sectionAssignmentOpen, setSectionAssignmentOpen] = useState(false);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deletingSkill, setDeletingSkill] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteType, setDeleteType] = useState(""); // 'skill', 'lesson', or 'assignment'
  const [currentSkillId, setCurrentSkillId] = useState(null);
  const [selectedSkillForSections, setSelectedSkillForSections] =
    useState(null);

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Load skills when component mounts
  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const result = await getAllSkills();
      if (result.success) {
        setSkills(result.data);
      } else {
        showSnackbar("Error loading skills: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading skills: " + error.message, "error");
    } finally {
      setLoading(false);
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

  const handleAddSkill = () => {
    setEditingSkill(null);
    setSkillFormOpen(true);
  };

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    setSkillFormOpen(true);
  };

  const handleDeleteSkill = (skill) => {
    setDeletingSkill(skill);
    setDeletingItem(skill);
    setDeleteType("skill");
    setConfirmDialogOpen(true);
  };

  const handleToggleExpand = async (skillId) => {
    const newExpanded = new Set(expandedSkills);
    if (expandedSkills.has(skillId)) {
      newExpanded.delete(skillId);
    } else {
      newExpanded.add(skillId);
      // Load lessons, assignments, sections, and progress for this skill
      await loadSkillLessons(skillId);
      await loadSkillAssignments(skillId);
      await loadSkillSections(skillId);
      await loadSkillProgress(skillId);
      // Set default tab to lessons (0)
      setActiveTabs((prev) => ({
        ...prev,
        [skillId]: 0,
      }));
    }
    setExpandedSkills(newExpanded);
  };

  const handleTabChange = (skillId, newValue) => {
    setActiveTabs((prev) => ({
      ...prev,
      [skillId]: newValue,
    }));
  };

  const loadSkillLessons = async (skillId) => {
    try {
      const result = await getAllLessons(skillId);
      if (result.success) {
        // Process lessons to handle attachments properly
        const processedLessons = result.data.map((lesson) => ({
          ...lesson,
          attachments: lesson.attachments || [],
        }));

        setSkillLessons((prev) => ({
          ...prev,
          [skillId]: processedLessons,
        }));
      }
    } catch (error) {
      console.error("Error loading lessons:", error);
    }
  };

  const loadSkillAssignments = async (skillId) => {
    try {
      const result = await getAllAssignments(skillId);
      if (result.success) {
        setSkillAssignments((prev) => ({
          ...prev,
          [skillId]: result.data,
        }));
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  const loadSkillSections = async (skillId) => {
    try {
      const result = await getSkillSections(skillId);
      if (result.success) {
        setSkillSections((prev) => ({
          ...prev,
          [skillId]: result.data,
        }));
      }
    } catch (error) {
      console.error("Error loading skill sections:", error);
    }
  };

  const loadSkillProgress = async (skillId) => {
    try {
      const result = await getSkillProgress(skillId);
      if (result.success) {
        setSkillProgress((prev) => ({
          ...prev,
          [skillId]: result.data,
        }));
      }
    } catch (error) {
      console.error("Error loading skill progress:", error);
    }
  };

  // Lesson handlers
  const handleAddLesson = (skillId) => {
    setEditingLesson(null);
    setCurrentSkillId(skillId);
    setLessonFormOpen(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setCurrentSkillId(lesson.skillId);
    setLessonFormOpen(true);
  };

  const handleDeleteLesson = (lesson) => {
    setDeletingItem(lesson);
    setDeleteType("lesson");
    setConfirmDialogOpen(true);
  };

  // Assignment handlers
  const handleAddAssignment = (skillId) => {
    setEditingAssignment(null);
    setCurrentSkillId(skillId);
    setAssignmentFormOpen(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setCurrentSkillId(assignment.skillId);
    setAssignmentFormOpen(true);
  };

  const handleDeleteAssignment = (assignment) => {
    setDeletingItem(assignment);
    setDeleteType("assignment");
    setConfirmDialogOpen(true);
  };

  const handleGradeAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setGradingDialogOpen(true);
  };

  const handleGradingSuccess = (gradedSubmission) => {
    showSnackbar("Assignment graded successfully!");
    // Optionally refresh data or update UI
  };

  // Section assignment handlers
  const handleAssignSections = (skill) => {
    setSelectedSkillForSections(skill);
    setSectionAssignmentOpen(true);
  };

  const handleViewAttachments = (lesson) => {
    setSelectedLessonAttachments(lesson.attachments || []);
    setSelectedLessonTitle(lesson.title);
    setAttachmentDialogOpen(true);
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Get the file URL (supports Firebase Storage, legacy local files, and blobs)
      const fileUrl = getFileUrlFromAttachment(attachment);

      if (fileUrl) {
        // For Firebase Storage and other URLs, create a download link
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download =
          attachment.name || attachment.originalName || "download";
        link.target = "_blank";
        // Add download attribute to force download instead of opening in browser
        link.setAttribute(
          "download",
          attachment.name || attachment.originalName || "download"
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (attachment.blob && attachment.blob instanceof Blob) {
        // Old blob format - create download link
        const url = URL.createObjectURL(attachment.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = attachment.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error("Unable to download file. File URL not available.");
        console.error("Attachment structure:", attachment);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleViewAttachment = (attachment) => {
    try {
      // Get the file URL (supports Firebase Storage, legacy local files, and blobs)
      const fileUrl = getFileUrlFromAttachment(attachment);

      if (fileUrl) {
        // For Firebase Storage and other URLs, open in new tab
        window.open(fileUrl, "_blank");
      } else if (attachment.blob && attachment.blob instanceof Blob) {
        // Old blob format - create object URL for viewing
        const url = URL.createObjectURL(attachment.blob);
        window.open(url, "_blank");
        // Clean up the object URL after a short delay to allow the window to load
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        console.error("Unable to view file. File URL not available.");
        console.error("Attachment structure:", attachment);
      }
    } catch (error) {
      console.error("Error viewing file:", error);
    }
  };

  const handleSectionAssignmentChange = async () => {
    if (selectedSkillForSections) {
      await loadSkillSections(selectedSkillForSections.id);
    }
  };

  const handleSkillFormSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      if (editingSkill) {
        // Update existing skill
        result = await updateSkill(editingSkill.id, formData);
        if (result.success) {
          showSnackbar("Skill updated successfully!");
          setSkillFormOpen(false);
          // Refresh skills list after successful update
          await loadSkills();
        } else {
          showSnackbar("Error updating skill: " + result.error, "error");
        }
      } else {
        // Create new skill
        result = await createSkill(formData);
        if (result.success) {
          showSnackbar("Skill created successfully!");
          setSkillFormOpen(false);
          // Refresh skills list after successful creation
          await loadSkills();
        } else {
          showSnackbar("Error creating skill: " + result.error, "error");
        }
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLessonFormSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      let lessonId;

      if (editingLesson) {
        // Update existing lesson (without attachments - they'll be uploaded separately)
        const { attachments, ...lessonData } = formData;
        result = await updateLesson(editingLesson.id, lessonData);
        if (result.success) {
          lessonId = editingLesson.id;
          showSnackbar("Lesson updated successfully!");
        } else {
          showSnackbar("Error updating lesson: " + result.error, "error");
          return;
        }
      } else {
        // Create new lesson (without attachments - they'll be uploaded separately)
        const { attachments, ...lessonData } = formData;
        result = await createLesson({ ...lessonData, skillId: currentSkillId });
        if (result.success) {
          lessonId = result.data.id;
          showSnackbar("Lesson created successfully!");
        } else {
          showSnackbar("Error creating lesson: " + result.error, "error");
          return;
        }
      }

      // Handle file uploads if there are attachments
      if (formData.attachments && formData.attachments.length > 0) {
        const filesToUpload = formData.attachments.filter((att) => att.file);
        if (filesToUpload.length > 0) {
          const fileUploadResult = await uploadLessonFiles(
            lessonId,
            filesToUpload.map((att) => att.file)
          );
          if (!fileUploadResult.success) {
            showSnackbar(
              "Lesson created but file upload failed: " +
                fileUploadResult.error,
              "warning"
            );
          } else {
            showSnackbar("Lesson and files uploaded successfully!");
          }
        }
      }

      setLessonFormOpen(false);
      await loadSkillLessons(currentSkillId);
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentFormSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      if (editingAssignment) {
        result = await updateAssignment(editingAssignment.id, formData);
        if (result.success) {
          showSnackbar("Assignment updated successfully!");
          setAssignmentFormOpen(false);
          await loadSkillAssignments(currentSkillId);
        } else {
          showSnackbar("Error updating assignment: " + result.error, "error");
        }
      } else {
        result = await createAssignment({
          ...formData,
          skillId: currentSkillId,
        });
        if (result.success) {
          showSnackbar("Assignment created successfully!");
          setAssignmentFormOpen(false);
          await loadSkillAssignments(currentSkillId);
        } else {
          showSnackbar("Error creating assignment: " + result.error, "error");
        }
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setLoading(true);
    try {
      let result;
      if (deleteType === "skill") {
        result = await deleteSkill(deletingSkill.id);
        if (result.success) {
          showSnackbar("Skill deleted successfully!");
          setConfirmDialogOpen(false);
          setDeletingSkill(null);
          await loadSkills();
        }
      } else if (deleteType === "lesson") {
        result = await deleteLesson(deletingItem.id);
        if (result.success) {
          showSnackbar("Lesson deleted successfully!");
          setConfirmDialogOpen(false);
          await loadSkillLessons(deletingItem.skillId);
        }
      } else if (deleteType === "assignment") {
        result = await deleteAssignment(deletingItem.id);
        if (result.success) {
          showSnackbar("Assignment deleted successfully!");
          setConfirmDialogOpen(false);
          await loadSkillAssignments(deletingItem.skillId);
        }
      }

      if (!result.success) {
        showSnackbar(`Error deleting ${deleteType}: ` + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter skills based on search query
  const filteredSkills = skills.filter((skill) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      skill.name?.toLowerCase().includes(query) ||
      skill.code?.toLowerCase().includes(query) ||
      skill.description?.toLowerCase().includes(query)
    );
  });

  return (
    <Box>
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
            Skills Management
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadSkills} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddSkill}
              sx={{
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              }}>
              Add Skill
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search skills by name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "hsl(152, 65%, 28%)" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
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
                    }}
                    width={50}></TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Code
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Description
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
                {filteredSkills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        {searchQuery
                          ? "No skills found matching your search."
                          : 'No skills found. Click "Add Skill" to create the first skill.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSkills.map((skill) => (
                    <React.Fragment key={skill.id}>
                      {/* Main Skill Row */}
                      <TableRow>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleExpand(skill.id)}
                            sx={{
                              color: "hsl(152, 65%, 28%)",
                              "&:hover": {
                                backgroundColor: "rgba(31, 120, 80, 0.1)",
                              },
                            }}>
                            {expandedSkills.has(skill.id) ? (
                              <ExpandLess />
                            ) : (
                              <ExpandMore />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{ color: "hsl(152, 65%, 28%)" }}>
                            {skill.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {skill.code || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 300,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {skill.description || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Edit Skill">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditSkill(skill)}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: "rgba(31, 120, 80, 0.1)",
                                  },
                                }}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Skill">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteSkill(skill)}
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

                      {/* Expanded Content Row */}
                      {expandedSkills.has(skill.id) && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                            }}>
                            <Box
                              sx={{
                                p: 3,
                                backgroundColor: "rgba(31, 120, 80, 0.02)",
                              }}>
                              {/* Tabs */}
                              <Box
                                sx={{
                                  borderBottom: 1,
                                  borderColor: "divider",
                                  mb: 2,
                                }}>
                                <Tabs
                                  value={activeTabs[skill.id] || 0}
                                  onChange={(e, newValue) =>
                                    handleTabChange(skill.id, newValue)
                                  }
                                  sx={{
                                    "& .MuiTab-root": {
                                      textTransform: "none",
                                      fontWeight: 600,
                                      minHeight: 48,
                                    },
                                  }}>
                                  <Tab
                                    icon={<Book fontSize="small" />}
                                    label={`Lessons (${
                                      skillLessons[skill.id]?.length || 0
                                    })`}
                                    iconPosition="start"
                                  />
                                  <Tab
                                    icon={<Assignment fontSize="small" />}
                                    label={`Assignments (${
                                      skillAssignments[skill.id]?.length || 0
                                    })`}
                                    iconPosition="start"
                                  />
                                  <Tab
                                    icon={<School fontSize="small" />}
                                    label={`Daycare Centers (${
                                      skillSections[skill.id]?.length || 0
                                    })`}
                                    iconPosition="start"
                                  />
                                </Tabs>
                              </Box>

                              {/* Tab Content */}
                              <Box sx={{ minHeight: 200 }}>
                                {/* Lessons Tab */}
                                {activeTabs[skill.id] === 0 && (
                                  <Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        mb: 2,
                                      }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() =>
                                          handleAddLesson(skill.id)
                                        }
                                        sx={{ borderRadius: "8px" }}>
                                        Add Lesson
                                      </Button>
                                    </Box>

                                    {skillLessons[skill.id]?.length === 0 ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ textAlign: "center", py: 4 }}>
                                        No lessons found. Click "Add Lesson" to
                                        create the first lesson.
                                      </Typography>
                                    ) : (
                                      <TableContainer
                                        component={Paper}
                                        sx={{
                                          boxShadow: "none",
                                          border:
                                            "1px solid rgba(31, 120, 80, 0.2)",
                                        }}>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow
                                              sx={{
                                                backgroundColor:
                                                  "rgba(31, 120, 80, 0.05)",
                                              }}>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Title
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Order
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Description
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Attachments
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Progress
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}
                                                align="center">
                                                Actions
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {skillLessons[skill.id]?.map(
                                              (lesson) => (
                                                <TableRow key={lesson.id} hover>
                                                  <TableCell>
                                                    <Typography
                                                      variant="body2"
                                                      fontWeight={500}
                                                      sx={{
                                                        color:
                                                          "hsl(152, 65%, 28%)",
                                                      }}>
                                                      {lesson.title}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography variant="body2">
                                                      {lesson.order}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary"
                                                      sx={{
                                                        maxWidth: 200,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                          "ellipsis",
                                                        whiteSpace: "nowrap",
                                                      }}>
                                                      {lesson.description ||
                                                        "-"}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    {lesson.attachments &&
                                                    lesson.attachments.length >
                                                      0 ? (
                                                      <Box
                                                        sx={{
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: 1,
                                                        }}>
                                                        <Box
                                                          sx={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: 0.5,
                                                            flex: 1,
                                                          }}>
                                                          {lesson.attachments
                                                            .slice(0, 2)
                                                            .map(
                                                              (
                                                                attachment,
                                                                index
                                                              ) => (
                                                                <Chip
                                                                  key={index}
                                                                  label={
                                                                    attachment.name
                                                                  }
                                                                  size="small"
                                                                  color="primary"
                                                                  variant="outlined"
                                                                  sx={{
                                                                    fontSize:
                                                                      "0.7rem",
                                                                    maxWidth: 120,
                                                                  }}
                                                                />
                                                              )
                                                            )}
                                                          {lesson.attachments
                                                            .length > 2 && (
                                                            <Chip
                                                              label={`+${
                                                                lesson
                                                                  .attachments
                                                                  .length - 2
                                                              } more`}
                                                              size="small"
                                                              color="secondary"
                                                              variant="outlined"
                                                              sx={{
                                                                fontSize:
                                                                  "0.7rem",
                                                              }}
                                                            />
                                                          )}
                                                        </Box>
                                                        <Tooltip title="View All Attachments">
                                                          <IconButton
                                                            size="small"
                                                            onClick={() =>
                                                              handleViewAttachments(
                                                                lesson
                                                              )
                                                            }
                                                            sx={{
                                                              color:
                                                                "hsl(152, 65%, 28%)",
                                                            }}>
                                                            <Attachment fontSize="small" />
                                                          </IconButton>
                                                        </Tooltip>
                                                      </Box>
                                                    ) : (
                                                      <Typography
                                                        variant="body2"
                                                        color="text.secondary">
                                                        No attachments
                                                      </Typography>
                                                    )}
                                                  </TableCell>
                                                  <TableCell>
                                                    {(() => {
                                                      const progressData =
                                                        skillProgress[
                                                          skill.id
                                                        ] || [];
                                                      const lessonProgress =
                                                        progressData.find(
                                                          (p) =>
                                                            p.lessonId ===
                                                            lesson.id
                                                        );
                                                      const averageProgress =
                                                        lessonProgress
                                                          ? Math.round(
                                                              lessonProgress.reduce(
                                                                (sum, p) =>
                                                                  sum +
                                                                  p.percentage,
                                                                0
                                                              ) /
                                                                lessonProgress.length
                                                            )
                                                          : 0;

                                                      return (
                                                        <Box
                                                          sx={{
                                                            display: "flex",
                                                            alignItems:
                                                              "center",
                                                            gap: 1,
                                                          }}>
                                                          <Box sx={{ flex: 1 }}>
                                                            <LinearProgress
                                                              variant="determinate"
                                                              value={
                                                                averageProgress
                                                              }
                                                              color={
                                                                averageProgress >=
                                                                100
                                                                  ? "success"
                                                                  : averageProgress >=
                                                                    50
                                                                  ? "info"
                                                                  : "warning"
                                                              }
                                                              sx={{
                                                                height: 6,
                                                                borderRadius: 3,
                                                              }}
                                                            />
                                                          </Box>
                                                          <Typography
                                                            variant="caption"
                                                            sx={{
                                                              fontWeight: 600,
                                                              minWidth: 35,
                                                            }}>
                                                            {averageProgress}%
                                                          </Typography>
                                                        </Box>
                                                      );
                                                    })()}
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{
                                                      fontFamily:
                                                        "Plus Jakarta Sans, sans-serif",
                                                    }}
                                                    align="center">
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        justifyContent:
                                                          "center",
                                                      }}>
                                                      <Tooltip title="Edit Lesson">
                                                        <IconButton
                                                          size="small"
                                                          onClick={() =>
                                                            handleEditLesson(
                                                              lesson
                                                            )
                                                          }>
                                                          <Edit fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                      <Tooltip title="Delete Lesson">
                                                        <IconButton
                                                          size="small"
                                                          color="error"
                                                          onClick={() =>
                                                            handleDeleteLesson(
                                                              lesson
                                                            )
                                                          }>
                                                          <Delete fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                    </Box>
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            )}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    )}
                                  </Box>
                                )}

                                {/* Assignments Tab */}
                                {activeTabs[skill.id] === 1 && (
                                  <Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        mb: 2,
                                      }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() =>
                                          handleAddAssignment(skill.id)
                                        }
                                        sx={{ borderRadius: "8px" }}>
                                        Add Assignment
                                      </Button>
                                    </Box>

                                    {skillAssignments[skill.id]?.length ===
                                    0 ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ textAlign: "center", py: 4 }}>
                                        No assignments found. Click "Add
                                        Assignment" to create the first
                                        assignment.
                                      </Typography>
                                    ) : (
                                      <TableContainer
                                        component={Paper}
                                        sx={{
                                          boxShadow: "none",
                                          border:
                                            "1px solid rgba(31, 120, 80, 0.2)",
                                        }}>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow
                                              sx={{
                                                backgroundColor:
                                                  "rgba(31, 120, 80, 0.05)",
                                              }}>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Title
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Due Date
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Description
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Points
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}
                                                align="center">
                                                Actions
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {skillAssignments[skill.id]?.map(
                                              (assignment) => (
                                                <TableRow
                                                  key={assignment.id}
                                                  hover>
                                                  <TableCell>
                                                    <Typography
                                                      variant="body2"
                                                      fontWeight={500}
                                                      sx={{
                                                        color:
                                                          "hsl(152, 65%, 28%)",
                                                      }}>
                                                      {assignment.title}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography variant="body2">
                                                      {new Date(
                                                        assignment.dueDate
                                                      ).toLocaleDateString()}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary"
                                                      sx={{
                                                        maxWidth: 200,
                                                        overflow: "hidden",
                                                        textOverflow:
                                                          "ellipsis",
                                                        whiteSpace: "nowrap",
                                                      }}>
                                                      {assignment.description ||
                                                        "-"}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        px: 1,
                                                        py: 0.5,
                                                        backgroundColor:
                                                          "rgba(31, 120, 80, 0.1)",
                                                        borderRadius: "4px",
                                                        color:
                                                          "hsl(152, 65%, 28%)",
                                                        fontWeight: 500,
                                                      }}>
                                                      {assignment.points} pts
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{
                                                      fontFamily:
                                                        "Plus Jakarta Sans, sans-serif",
                                                    }}
                                                    align="center">
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        justifyContent:
                                                          "center",
                                                      }}>
                                                      <Tooltip title="Grade Assignment">
                                                        <IconButton
                                                          size="small"
                                                          onClick={() =>
                                                            handleGradeAssignment(
                                                              assignment
                                                            )
                                                          }
                                                          sx={{
                                                            color: "#4caf50",
                                                          }}>
                                                          <Grade fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                      <Tooltip title="Edit Assignment">
                                                        <IconButton
                                                          size="small"
                                                          onClick={() =>
                                                            handleEditAssignment(
                                                              assignment
                                                            )
                                                          }>
                                                          <Edit fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                      <Tooltip title="Delete Assignment">
                                                        <IconButton
                                                          size="small"
                                                          color="error"
                                                          onClick={() =>
                                                            handleDeleteAssignment(
                                                              assignment
                                                            )
                                                          }>
                                                          <Delete fontSize="small" />
                                                        </IconButton>
                                                      </Tooltip>
                                                    </Box>
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            )}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    )}
                                  </Box>
                                )}

                                {/* Daycare Centers Tab */}
                                {activeTabs[skill.id] === 2 && (
                                  <Box>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        mb: 2,
                                      }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<School />}
                                        onClick={() =>
                                          handleAssignSections(skill)
                                        }
                                        sx={{ borderRadius: "8px" }}>
                                        Assign Daycare Centers
                                      </Button>
                                    </Box>

                                    {skillSections[skill.id]?.length === 0 ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ textAlign: "center", py: 4 }}>
                                        No sections assigned to this skill.
                                        Click "Assign Daycare Centers" to assign
                                        sections.
                                      </Typography>
                                    ) : (
                                      <TableContainer
                                        component={Paper}
                                        sx={{
                                          boxShadow: "none",
                                          border:
                                            "1px solid rgba(31, 120, 80, 0.2)",
                                        }}>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow
                                              sx={{
                                                backgroundColor:
                                                  "rgba(31, 120, 80, 0.05)",
                                              }}>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Daycare Centers
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Capacity
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}>
                                                Students
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  fontFamily:
                                                    "Plus Jakarta Sans, sans-serif",
                                                  fontWeight: 600,
                                                }}
                                                align="center">
                                                Actions
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {skillSections[skill.id]?.map(
                                              (section) => (
                                                <TableRow
                                                  key={section.id}
                                                  hover>
                                                  <TableCell>
                                                    <Typography
                                                      variant="body2"
                                                      fontWeight={500}
                                                      sx={{
                                                        color:
                                                          "hsl(152, 65%, 28%)",
                                                      }}>
                                                      {section.name}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography variant="body2">
                                                      {section.capacity}
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary">
                                                      {section.assignedStudents
                                                        ?.length || 0}{" "}
                                                      students
                                                    </Typography>
                                                  </TableCell>
                                                  <TableCell
                                                    sx={{
                                                      fontFamily:
                                                        "Plus Jakarta Sans, sans-serif",
                                                    }}
                                                    align="center">
                                                    <Tooltip title="Manage Daycare Centers">
                                                      <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                          handleAssignSections(
                                                            skill
                                                          )
                                                        }
                                                        sx={{
                                                          "&:hover": {
                                                            backgroundColor:
                                                              "rgba(31, 120, 80, 0.1)",
                                                          },
                                                        }}>
                                                        <School fontSize="small" />
                                                      </IconButton>
                                                    </Tooltip>
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            )}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Skill Form Dialog */}
      <SkillForm
        open={skillFormOpen}
        onClose={() => setSkillFormOpen(false)}
        onSubmit={handleSkillFormSubmit}
        skillData={editingSkill}
        loading={loading}
      />

      {/* Lesson Form Dialog */}
      <LessonForm
        open={lessonFormOpen}
        onClose={() => setLessonFormOpen(false)}
        onSubmit={handleLessonFormSubmit}
        lessonData={editingLesson}
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

      {/* Section Assignment Dialog */}
      <SectionAssignmentDialog
        open={sectionAssignmentOpen}
        onClose={() => setSectionAssignmentOpen(false)}
        skillId={selectedSkillForSections?.id}
        skillName={selectedSkillForSections?.name}
        onAssignmentChange={handleSectionAssignmentChange}
      />

      {/* Assignment Grading Dialog */}
      <AssignmentGradingDialog
        open={gradingDialogOpen}
        onClose={() => setGradingDialogOpen(false)}
        assignment={selectedAssignment}
        onGradingSuccess={handleGradingSuccess}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${
          deleteType === "skill"
            ? "Skill"
            : deleteType === "lesson"
            ? "Lesson"
            : "Assignment"
        }`}
        message={`Are you sure you want to delete "${
          deletingItem?.name || deletingItem?.title
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading}
        type="danger"
      />

      {/* Attachment Viewer Dialog */}
      <Dialog
        open={attachmentDialogOpen}
        onClose={() => setAttachmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(31, 120, 80, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
          },
        }}>
        <DialogTitle
          sx={{
            background:
              "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 700,
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}>
          <Attachment sx={{ color: "hsl(152, 65%, 28%)" }} />
          Attachments - {selectedLessonTitle}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedLessonAttachments.length > 0 ? (
            <List>
              {selectedLessonAttachments.map((attachment, index) => {
                const hasServerFile = attachment.filename && attachment.url;
                const hasBlobFile =
                  attachment.blob && attachment.blob instanceof Blob;
                const hasFile = hasServerFile || hasBlobFile;

                // Handle legacy files that might have different structure
                const isLegacyFile =
                  attachment.name &&
                  !hasFile &&
                  (attachment.size || attachment.type);

                return (
                  <ListItem key={index} sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <Attachment
                        sx={{
                          color: hasFile
                            ? "hsl(152, 65%, 28%)"
                            : isLegacyFile
                            ? "#ff9800"
                            : "#f44336",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={attachment.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {hasServerFile
                              ? "Server file"
                              : hasBlobFile
                              ? "Local file"
                              : isLegacyFile
                              ? "Legacy file (re-upload needed)"
                              : "File data not available"}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {attachment.mimetype ||
                              attachment.type ||
                              "Unknown type"}
                          </Typography>
                          {attachment.size && (
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              {formatFileSize(attachment.size)}
                            </Typography>
                          )}
                        </Box>
                      }
                      sx={{
                        "& .MuiListItemText-primary": { fontWeight: 500 },
                        "& .MuiListItemText-secondary": {
                          color: hasFile
                            ? "text.secondary"
                            : isLegacyFile
                            ? "#ff9800"
                            : "#f44336",
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {hasFile ? (
                        <>
                          <Tooltip title="View File">
                            <IconButton
                              size="small"
                              onClick={() => handleViewAttachment(attachment)}
                              sx={{ color: "hsl(152, 65%, 28%)" }}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download File">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDownloadAttachment(attachment)
                              }
                              sx={{ color: "#4caf50" }}>
                              <FileDownload />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : isLegacyFile ? (
                        <Tooltip title="Legacy file - re-upload to access">
                          <IconButton
                            size="small"
                            disabled
                            sx={{ color: "#ff9800" }}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Attachment
                sx={{ fontSize: 48, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary">
                No attachments available for this lesson
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setAttachmentDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: "8px" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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

export default SkillsContent;
