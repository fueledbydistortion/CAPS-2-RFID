import {
  Add,
  Delete,
  Edit,
  ExpandLess,
  ExpandMore,
  Print,
  Refresh,
  School,
  Search,
  ViewList,
  ViewModule,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
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
import ConfirmDialog from "../components/ConfirmDialog";
import SectionForm from "../components/SectionForm";
import { useAuth } from "../contexts/AuthContext";
import { generateQRCode } from "../utils/qrService";
import {
  createSection,
  deleteSection,
  getAllSections,
  subscribeToAllSections,
  updateSection,
} from "../utils/sectionService";
import { getAllUsers } from "../utils/userService";

const SectionsContent = () => {
  const { userProfile } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSections, setFilteredSections] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // 'cards' or 'table'
  const [allUsers, setAllUsers] = useState([]);
  const [expandedSectionIds, setExpandedSectionIds] = useState({});
  const [parentQrCache, setParentQrCache] = useState({});
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [qrPreviewSrc, setQrPreviewSrc] = useState("");
  const [qrPreviewType, setQrPreviewType] = useState("timeIn");
  const [qrPreviewParent, setQrPreviewParent] = useState(null);

  // Dialog states
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Load sections and users when component mounts
  useEffect(() => {
    loadSections();
    loadUsers();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAllSections((result) => {
      if (result.success) {
        setSections(result.data);
      } else {
        showSnackbar("Error loading sections: " + result.error, "error");
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter sections when search term or user profile changes
  useEffect(() => {
    let filtered = sections;

    // If user is a teacher, filter sections to show only those assigned to them
    if (userProfile && userProfile.role === "teacher") {
      filtered = filtered.filter(
        (section) => section.teacherId === userProfile.uid
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((section) =>
        section.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSections(filtered);
  }, [searchTerm, sections, userProfile]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const result = await getAllSections();
      if (result.success) {
        setSections(result.data);
      } else {
        showSnackbar("Error loading sections: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading sections: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setAllUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const getStudentName = (studentId) => {
    const parent = allUsers.find((user) => user.uid === studentId);
    if (parent && parent.role === "parent" && parent.childName) {
      return `${parent.firstName} ${parent.lastName} (Child: ${parent.childName})`;
    }
    return parent ? `${parent.firstName} ${parent.lastName}` : "Unknown Parent";
  };

  const getTeacherName = (teacherId) => {
    const teacher = allUsers.find(
      (user) => user.uid === teacherId && user.role === "teacher"
    );
    return teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : "No teacher assigned";
  };

  const ensureParentQRCodes = async (parent) => {
    if (!parent || parent.role !== "parent") return {};
    const cacheKey = parent.uid;
    const cached = parentQrCache[cacheKey];
    if (cached && cached.timeIn && cached.timeOut) return cached;
    const basePayload = {
      type: "parent",
      parentId: parent.uid,
      timestamp: new Date().toISOString(),
    };
    try {
      const [timeIn, timeOut] = await Promise.all([
        generateQRCode(
          JSON.stringify({ ...basePayload, attendanceType: "timeIn" }),
          { color: { dark: "#4caf50", light: "#ffffff" }, width: 160 }
        ),
        generateQRCode(
          JSON.stringify({ ...basePayload, attendanceType: "timeOut" }),
          { color: { dark: "#ff9800", light: "#ffffff" }, width: 160 }
        ),
      ]);
      const qr = { timeIn, timeOut };
      setParentQrCache((prev) => ({ ...prev, [cacheKey]: qr }));
      return qr;
    } catch (e) {
      console.error("QR generation failed:", e);
      return {};
    }
  };

  const toggleExpand = (sectionId) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const openParentQRPreview = async (parent, type) => {
    const qr = await ensureParentQRCodes(parent);
    const src = type === "timeOut" ? qr.timeOut : qr.timeIn;
    if (src) {
      setQrPreviewParent(parent);
      setQrPreviewType(type);
      setQrPreviewSrc(src);
      setQrPreviewOpen(true);
    }
  };

  const closeParentQRPreview = () => {
    setQrPreviewOpen(false);
    setQrPreviewSrc("");
    setQrPreviewParent(null);
  };

  const handlePrintQR = async () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const parentName = qrPreviewParent
      ? `${qrPreviewParent.firstName} ${qrPreviewParent.lastName}`
      : "";

    // Ensure both QR codes are generated
    const qrCodes = await ensureParentQRCodes(qrPreviewParent);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Parent QR Codes - ${parentName}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .page-break {
                page-break-after: always;
                break-after: page;
              }
              .qr-page {
                height: calc(100vh - 30mm);
                margin: 0;
                padding: 0;
              }
              .qr-container {
                margin: 0;
                padding: 20px;
                box-shadow: none;
                border-radius: 0;
                max-width: none;
              }
            }
            body {
              font-family: 'Roboto', Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: #f5f5f5;
            }
            .qr-page {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .qr-container {
              text-align: center;
              background: white;
              padding: 30px;
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            .qr-header {
              margin-bottom: 20px;
            }
            .qr-title {
              font-size: 24px;
              font-weight: 600;
              color: #333;
              margin: 0 0 8px 0;
            }
            .qr-subtitle {
              font-size: 18px;
              margin: 0 0 4px 0;
              font-weight: 500;
            }
            .qr-subtitle.time-in {
              color: #4caf50;
            }
            .qr-subtitle.time-out {
              color: #ff9800;
            }
            .qr-parent-name {
              font-size: 16px;
              color: #666;
              margin: 0;
            }
            .qr-image-wrapper {
              display: inline-block;
              padding: 15px;
              border-radius: 12px;
              background: white;
              margin: 20px 0;
            }
            .qr-image-wrapper.time-in {
              border: 4px solid #4caf50;
            }
            .qr-image-wrapper.time-out {
              border: 4px solid #ff9800;
            }
            .qr-image {
              display: block;
              width: 280px;
              height: 280px;
            }
            .qr-instructions {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
              line-height: 1.6;
              padding: 15px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .qr-footer {
              margin-top: 20px;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #e0e0e0;
              padding-top: 15px;
            }
            @media print {
              body {
                background: white;
              }
            }
          </style>
        </head>
        <body>
          <!-- Page 1: Time In QR Code -->
          <div class="qr-page page-break">
            <div class="qr-container">
              <div class="qr-header">
                <h1 class="qr-title">Smart Childcare</h1>
                <h2 class="qr-subtitle time-in">Time In QR Code</h2>
                <p class="qr-parent-name">${parentName}</p>
              </div>
              <div class="qr-image-wrapper time-in">
                <img src="${
                  qrCodes.timeIn
                }" alt="Time In QR Code" class="qr-image" />
              </div>
              <div class="qr-instructions">
                <strong>Instructions:</strong><br/>
                Present this QR code to the teacher to check in your child.
                The teacher will scan this code using the Smart Childcare system.
              </div>
              <div class="qr-footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br/>
                Smart Childcare Management System
              </div>
            </div>
          </div>

          <!-- Page 2: Time Out QR Code -->
          <div class="qr-page">
            <div class="qr-container">
              <div class="qr-header">
                <h1 class="qr-title">Smart Childcare</h1>
                <h2 class="qr-subtitle time-out">Time Out QR Code</h2>
                <p class="qr-parent-name">${parentName}</p>
              </div>
              <div class="qr-image-wrapper time-out">
                <img src="${
                  qrCodes.timeOut
                }" alt="Time Out QR Code" class="qr-image" />
              </div>
              <div class="qr-instructions">
                <strong>Instructions:</strong><br/>
                Present this QR code to the teacher to check out your child.
                The teacher will scan this code using the Smart Childcare system.
              </div>
              <div class="qr-footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br/>
                Smart Childcare Management System
              </div>
            </div>
          </div>

          <script>
            // Auto-print when loaded
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionFormOpen(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setSectionFormOpen(true);
  };

  const handleDeleteSection = (section) => {
    setDeletingSection(section);
    setConfirmDialogOpen(true);
  };

  const handleSectionFormSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      if (editingSection) {
        // Update existing section
        result = await updateSection(editingSection.id, formData);
        if (result.success) {
          showSnackbar("Section updated successfully!");
          setSectionFormOpen(false);
        } else {
          showSnackbar("Error updating section: " + result.error, "error");
        }
      } else {
        // Create new section
        result = await createSection(formData);
        if (result.success) {
          showSnackbar("Section created successfully!");
          setSectionFormOpen(false);
        } else {
          showSnackbar("Error creating section: " + result.error, "error");
        }
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSection) return;

    setLoading(true);
    try {
      const result = await deleteSection(deletingSection.id);
      if (result.success) {
        showSnackbar("Section deleted successfully!");
        setConfirmDialogOpen(false);
        setDeletingSection(null);
      } else {
        showSnackbar("Error deleting section: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
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
            Daycare Centers Management
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {/* Only show Add Section button for non-teacher users */}
            {(!userProfile || userProfile.role !== "teacher") && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddSection}
                sx={{
                  background:
                    "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                }}>
                Add Daycare Center
              </Button>
            )}
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
            placeholder="Search daycare centers..."
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

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadSections} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title={viewMode === "cards" ? "Table View" : "Card View"}>
              <IconButton
                onClick={() =>
                  setViewMode(viewMode === "cards" ? "table" : "cards")
                }>
                {viewMode === "cards" ? <ViewList /> : <ViewModule />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === "cards" ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {filteredSections.length === 0 ? (
              <Box sx={{ width: "100%", textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  {userProfile && userProfile.role === "teacher"
                    ? "No daycare centers assigned to you yet"
                    : "No daycare centers found"}
                </Typography>
                {userProfile && userProfile.role === "teacher" && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}>
                    Contact your administrator to get daycare centers assigned to you.
                  </Typography>
                )}
              </Box>
            ) : (
              filteredSections.map((section) => (
                <Card
                  key={section.id}
                  sx={{
                    flex: "1 1 350px",
                    minWidth: "350px",
                    maxWidth: "400px",
                    height: "fit-content",
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(15px)",
                    border: "2px solid rgba(31, 120, 80, 0.2)",
                    borderRadius: "16px",
                    boxShadow: "0 6px 20px rgba(31, 120, 80, 0.15)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 30px rgba(31, 120, 80, 0.25)",
                    },
                  }}>
                  <CardHeader
                    avatar={<School sx={{ color: "hsl(152, 65%, 28%)" }} />}
                    action={
                      <IconButton 
                        size="small" 
                        onClick={() => toggleExpand(section.id)}
                        sx={{ color: "hsl(152, 65%, 28%)" }}
                      >
                        {expandedSectionIds[section.id] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    }
                    title={section.name}
                    subheader={`Capacity: ${section.capacity}`}
                    titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
                  />
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}>
                        Teacher: {getTeacherName(section.teacherId)}
                      </Typography>
                      {section.assignedStudents &&
                        section.assignedStudents.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 0.5 }}>
                              Assigned Students (
                              {section.assignedStudents.length}):
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}>
                              {!expandedSectionIds[section.id] && section.assignedStudents
                                .slice(0, 3)
                                .map((studentId) => (
                                  <Chip
                                    key={studentId}
                                    label={getStudentName(studentId)}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              {!expandedSectionIds[section.id] && section.assignedStudents.length > 3 && (
                                <Chip
                                  label={`+${
                                    section.assignedStudents.length - 3
                                  } more`}
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                    </Box>
                    
                    {/* Expanded Student List */}
                    <Collapse in={!!expandedSectionIds[section.id]} timeout="auto" unmountOnExit>
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        backgroundColor: 'rgba(31, 120, 80, 0.03)', 
                        borderRadius: 2,
                        border: '1px solid rgba(31, 120, 80, 0.1)'
                      }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            mb: 1.5, 
                            color: 'hsl(152, 65%, 28%)', 
                            fontWeight: 600 
                          }}
                        >
                          All Students
                        </Typography>
                        {section.assignedStudents && section.assignedStudents.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {section.assignedStudents.map((studentId) => {
                              const parent = allUsers.find(u => u.uid === studentId)
                              if (!parent) return null
                              const name = parent.childName ? `${parent.childName}` : `${parent.firstName} ${parent.lastName}`
                              return (
                                <Chip 
                                  key={studentId}
                                  label={name}
                                  size="medium"
                                  sx={{
                                    backgroundColor: 'rgba(31, 120, 80, 0.1)',
                                    color: 'hsl(152, 65%, 28%)',
                                    fontWeight: 500
                                  }}
                                />
                              )
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No students assigned
                          </Typography>
                        )}
                      </Box>
                    </Collapse>

                    {/* Only show action buttons for non-teacher users */}
                    {(!userProfile || userProfile.role !== "teacher") && (
                      <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Edit />}
                          onClick={() => handleEditSection(section)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleDeleteSection(section)}>
                          Delete
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
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
                    width={48}></TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Daycare Centers
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Capacity
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
                    }}>
                    No. of Students
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Students
                  </TableCell>
                  {/* Only show Actions column for non-teacher users */}
                  {(!userProfile || userProfile.role !== "teacher") && (
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}
                      align="center">
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSections.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        !userProfile || userProfile.role !== "teacher" ? 7 : 6
                      }
                      align="center"
                      sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        {userProfile && userProfile.role === "teacher"
                          ? "No daycare centers assigned to you yet"
                          : "No daycare centers found"}
                      </Typography>
                      {userProfile && userProfile.role === "teacher" && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "block",
                            mt: 1,
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                          }}>
                          Contact your administrator to get daycare centers assigned to
                          you.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSections.map((section) => (
                    <React.Fragment key={section.id}>
                      <TableRow
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(31, 120, 80, 0.02)",
                          },
                        }}>
                        <TableCell
                          width={48}
                          sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                          <IconButton size="small" onClick={() => toggleExpand(section.id)}>
                            {expandedSectionIds[section.id] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{ color: "hsl(152, 65%, 28%)" }}>
                            {section.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {section.capacity}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              section.teacherId
                                ? "text.primary"
                                : "text.secondary"
                            }>
                            {getTeacherName(section.teacherId)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {section.assignedStudents
                              ? section.assignedStudents.length
                              : 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {section.assignedStudents &&
                          section.assignedStudents.length > 0 ? (
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}>
                              {section.assignedStudents
                                .slice(0, 2)
                                .map((studentId) => (
                                  <Chip
                                    key={studentId}
                                    label={getStudentName(studentId)}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                  />
                                ))}
                              {section.assignedStudents.length > 2 && (
                                <Chip
                                  label={`+${
                                    section.assignedStudents.length - 2
                                  }`}
                                  size="small"
                                  variant="outlined"
                                  color="default"
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No parents assigned
                            </Typography>
                          )}
                        </TableCell>
                        {/* Only show Actions column for non-teacher users */}
                        {(!userProfile || userProfile.role !== "teacher") && (
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Tooltip title="Edit Section">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditSection(section)}
                                  sx={{
                                    "&:hover": {
                                      backgroundColor: "rgba(31, 120, 80, 0.1)",
                                    },
                                  }}>
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Section">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteSection(section)}
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
                        )}
                      </TableRow>

                      {/* Expandable content row */}
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={
                            !userProfile || userProfile.role !== "teacher"
                              ? 7
                              : 6
                          }
                          sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                          <Collapse in={!!expandedSectionIds[section.id]} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 1, backgroundColor: 'rgba(31, 120, 80, 0.03)', borderRadius: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1, color: 'hsl(152, 65%, 28%)', fontWeight: 600 }}>
                                Assigned Students
                              </Typography>
                              {section.assignedStudents && section.assignedStudents.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {section.assignedStudents.map((studentId) => {
                                    const parent = allUsers.find(u => u.uid === studentId)
                                    if (!parent) return null
                                    const name = parent.childName ? `${parent.childName}` : `${parent.firstName} ${parent.lastName}`
                                    return (
                                      <Chip 
                                        key={studentId}
                                        label={name}
                                        size="medium"
                                        sx={{
                                          backgroundColor: 'rgba(31, 120, 80, 0.1)',
                                          color: 'hsl(152, 65%, 28%)',
                                          fontWeight: 500
                                        }}
                                      />
                                    )
                                  })}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No students assigned
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Section Form Dialog */}
      <SectionForm
        open={sectionFormOpen}
        onClose={() => setSectionFormOpen(false)}
        onSubmit={handleSectionFormSubmit}
        sectionData={editingSection}
        loading={loading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Section"
        message={`Are you sure you want to delete "${deletingSection?.name}"? This action cannot be undone.`}
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

      {/* Parent QR Preview Modal */}
      <Dialog
        open={qrPreviewOpen}
        onClose={closeParentQRPreview}
        maxWidth="xs"
        fullWidth>
        <DialogTitle sx={{ textAlign: "center", fontWeight: 600 }}>
          {qrPreviewType === "timeIn"
            ? "Parent Time-In QR"
            : "Parent Time-Out QR"}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}>
          {qrPreviewParent && (
            <Typography variant="body2" color="text.secondary">
              {qrPreviewParent.firstName} {qrPreviewParent.lastName}
            </Typography>
          )}
          {qrPreviewSrc && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                border: `3px solid ${
                  qrPreviewType === "timeIn" ? "#4caf50" : "#ff9800"
                }`,
              }}>
              <img
                src={qrPreviewSrc}
                alt="Parent QR"
                style={{ width: 220, height: 220 }}
              />
            </Box>
          )}
          <Typography variant="caption" color="text.secondary">
            Have the teacher scan this code to{" "}
            {qrPreviewType === "timeIn" ? "check in" : "check out"}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
          <Button
            onClick={handlePrintQR}
            variant="outlined"
            startIcon={<Print />}
            sx={{
              borderColor: qrPreviewType === "timeIn" ? "#4caf50" : "#ff9800",
              color: qrPreviewType === "timeIn" ? "#4caf50" : "#ff9800",
              "&:hover": {
                borderColor: qrPreviewType === "timeIn" ? "#45a049" : "#f57c00",
                backgroundColor:
                  qrPreviewType === "timeIn"
                    ? "rgba(76, 175, 80, 0.04)"
                    : "rgba(255, 152, 0, 0.04)",
              },
            }}>
            Print Both QR Codes
          </Button>
          <Button onClick={closeParentQRPreview} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SectionsContent;
