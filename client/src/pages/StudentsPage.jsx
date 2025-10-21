import {
  CalendarToday,
  CameraAlt,
  Close,
  Delete,
  Email,
  People,
  Person,
  Phone,
  Print,
  School,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { generateQRCode } from "../utils/qrService";
import {
  deleteProfilePicture,
  uploadProfilePicture,
} from "../utils/userService";

const StudentsPage = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  // QR Code states
  const [parentQrCache, setParentQrCache] = useState({});
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [qrPreviewSrc, setQrPreviewSrc] = useState("");
  const [qrPreviewType, setQrPreviewType] = useState("timeIn");
  const [qrPreviewParent, setQrPreviewParent] = useState(null);

  // Profile picture upload states
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [deletingPicture, setDeletingPicture] = useState(false);

  // Confirmation modal states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (
      userProfile &&
      (userProfile.role === "admin" || userProfile.role === "teacher")
    ) {
      loadStudents();
    }
  }, [userProfile]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Get Firebase ID token from current user
      if (!userProfile || !userProfile.uid) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const auth = (await import("firebase/auth")).getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();

      // Fetch all users with parent role from users collection (parents are the students)
      const response = await fetch(`${API_BASE_URL}/users/role/parent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStudents(data.data || []);
          // Load attendance for all students
          loadAttendanceData(data.data || [], token);
        } else {
          setError("Failed to load students: " + data.error);
        }
      } else {
        setError("Failed to load students");
      }
    } catch (err) {
      setError("Error loading students: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async (studentsList, token) => {
    try {
      const attendanceMap = {};

      for (const student of studentsList) {
        const response = await fetch(
          `${API_BASE_URL}/attendance/student/${student.uid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const totalDays = data.length;
          const presentDays = data.filter(
            (record) => record.status === "present"
          ).length;
          const attendanceRate =
            totalDays > 0
              ? ((presentDays / totalDays) * 100).toFixed(1)
              : "0.0";

          attendanceMap[student.uid] = {
            totalDays,
            presentDays,
            attendanceRate,
          };
        }
      }

      setAttendanceData(attendanceMap);
    } catch (err) {
      console.error("Error loading attendance data:", err);
    }
  };

  // Ensure QR codes exist for a given parent (time-in and time-out variants)
  const ensureParentQRCodes = async (parent) => {
    if (!parent || parent.role !== "parent") return {};
    const cacheKey = parent.uid;
    const existing = parentQrCache[cacheKey];
    if (existing && existing.timeIn && existing.timeOut) return existing;

    // QR payloads for parent-driven scans (backend infers active schedule)
    const basePayload = {
      type: "parent",
      parentId: parent.uid,
      timestamp: new Date().toISOString(),
    };
    const timeInPayload = JSON.stringify({
      ...basePayload,
      attendanceType: "timeIn",
    });
    const timeOutPayload = JSON.stringify({
      ...basePayload,
      attendanceType: "timeOut",
    });

    try {
      const [timeIn, timeOut] = await Promise.all([
        generateQRCode(timeInPayload, {
          color: { dark: "#4caf50", light: "#ffffff" },
          width: 160,
        }),
        generateQRCode(timeOutPayload, {
          color: { dark: "#ff9800", light: "#ffffff" },
          width: 160,
        }),
      ]);
      const qr = { timeIn, timeOut };
      setParentQrCache((prev) => ({ ...prev, [cacheKey]: qr }));
      return qr;
    } catch (e) {
      console.error("Failed generating parent QR codes:", e);
      return {};
    }
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

  // Profile picture upload handler
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setSuccessMessage(
        "Please select a valid image file (JPEG, PNG, GIF, WEBP)"
      );
      setSuccessModalOpen(true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSuccessMessage("File size must be less than 5MB");
      setSuccessModalOpen(true);
      return;
    }

    setUploadingPicture(true);
    try {
      const result = await uploadProfilePicture(selectedStudent.uid, file);
      if (result.success) {
        // Update the selected student's photo URL
        setSelectedStudent((prev) => ({
          ...prev,
          photoURL: result.data.photoURL,
        }));

        // Update the student in the list
        setStudents((prev) =>
          prev.map((s) =>
            s.uid === selectedStudent.uid
              ? { ...s, photoURL: result.data.photoURL }
              : s
          )
        );

        setSuccessMessage("Profile picture uploaded successfully!");
        setSuccessModalOpen(true);
      } else {
        setSuccessMessage("Failed to upload profile picture: " + result.error);
        setSuccessModalOpen(true);
      }
    } catch (error) {
      setSuccessMessage("Error uploading profile picture: " + error.message);
      setSuccessModalOpen(true);
    } finally {
      setUploadingPicture(false);
      // Reset file input
      event.target.value = "";
    }
  };

  // Profile picture delete handler
  const handleProfilePictureDelete = async () => {
    if (!selectedStudent || !selectedStudent.photoURL) {
      setSuccessMessage("No profile picture to delete");
      setSuccessModalOpen(true);
      return;
    }

    // Open confirmation modal
    setDeleteConfirmOpen(true);
  };

  // Confirm delete profile picture
  const confirmDeleteProfilePicture = async () => {
    setDeleteConfirmOpen(false);
    setDeletingPicture(true);
    try {
      const result = await deleteProfilePicture(selectedStudent.uid);
      if (result.success) {
        // Update the selected student's photo URL to null
        setSelectedStudent((prev) => ({
          ...prev,
          photoURL: null,
        }));

        // Update the student in the list
        setStudents((prev) =>
          prev.map((s) =>
            s.uid === selectedStudent.uid ? { ...s, photoURL: null } : s
          )
        );

        setSuccessMessage("Profile picture deleted successfully!");
        setSuccessModalOpen(true);
      } else {
        setSuccessMessage("Failed to delete profile picture: " + result.error);
        setSuccessModalOpen(true);
      }
    } catch (error) {
      setSuccessMessage("Error deleting profile picture: " + error.message);
      setSuccessModalOpen(true);
    } finally {
      setDeletingPicture(false);
    }
  };

  const handlePrintQR = async () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const parentName = qrPreviewParent
      ? `${qrPreviewParent.firstName} ${qrPreviewParent.lastName}`
      : "";
    const childName = qrPreviewParent
      ? [
          qrPreviewParent.childFirstName,
          qrPreviewParent.childMiddleName,
          qrPreviewParent.childLastName,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

    // Ensure both QR codes are generated
    const qrCodes = await ensureParentQRCodes(qrPreviewParent);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Parent QR Codes - ${childName}</title>
          <style>
            @media print {
              @page { size: A4; margin: 15mm; }
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; break-after: page; }
            }
            body { font-family: 'Roboto', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .qr-page { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
            .qr-container { text-align: center; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 400px; }
            .qr-title { font-size: 24px; font-weight: 600; color: #333; margin: 0 0 8px 0; }
            .qr-subtitle { font-size: 18px; margin: 0 0 4px 0; font-weight: 500; }
            .qr-subtitle.time-in { color: #4caf50; }
            .qr-subtitle.time-out { color: #ff9800; }
            .qr-student-name { font-size: 16px; color: #666; margin: 0; }
            .qr-image-wrapper { display: inline-block; padding: 15px; border-radius: 12px; background: white; margin: 20px 0; }
            .qr-image-wrapper.time-in { border: 4px solid #4caf50; }
            .qr-image-wrapper.time-out { border: 4px solid #ff9800; }
            .qr-image { display: block; width: 280px; height: 280px; }
            .qr-instructions { font-size: 14px; color: #666; margin-top: 20px; line-height: 1.6; padding: 15px; background: #f9f9f9; border-radius: 8px; }
            .qr-footer { margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="qr-page page-break">
            <div class="qr-container">
              <div class="qr-header">
                <h1 class="qr-title">Smart Childcare</h1>
                <h2 class="qr-subtitle time-in">Time In QR Code</h2>
                <p class="qr-student-name">${childName}</p>
                <p style="font-size: 14px; color: #999;">Parent: ${parentName}</p>
              </div>
              <div class="qr-image-wrapper time-in">
                <img src="${
                  qrCodes.timeIn
                }" alt="Time In QR Code" class="qr-image" />
              </div>
              <div class="qr-instructions">
                <strong>Instructions:</strong><br/>
                Present this QR code to the teacher to check in your child.
              </div>
              <div class="qr-footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br/>
                Smart Childcare Management System
              </div>
            </div>
          </div>
          <div class="qr-page">
            <div class="qr-container">
              <div class="qr-header">
                <h1 class="qr-title">Smart Childcare</h1>
                <h2 class="qr-subtitle time-out">Time Out QR Code</h2>
                <p class="qr-student-name">${childName}</p>
                <p style="font-size: 14px; color: #999;">Parent: ${parentName}</p>
              </div>
              <div class="qr-image-wrapper time-out">
                <img src="${
                  qrCodes.timeOut
                }" alt="Time Out QR Code" class="qr-image" />
              </div>
              <div class="qr-instructions">
                <strong>Instructions:</strong><br/>
                Present this QR code to the teacher to check out your child.
              </div>
              <div class="qr-footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br/>
                Smart Childcare Management System
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleViewProfile = async (student) => {
    setProfileLoading(true);
    setDialogOpen(true);
    setSelectedStudent(student);
    setProfileLoading(false);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStudent(null);
  };

  // Check if user is admin
  if (
    userProfile &&
    userProfile.role !== "admin" &&
    userProfile.role !== "teacher"
  ) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "50vh",
          textAlign: "center",
        }}>
        <Typography variant="h4" sx={{ color: "hsl(152, 65%, 28%)", mb: 2 }}>
          Access Denied
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            color: "text.secondary",
            mb: 2,
          }}>
          You don't have permission to access this page.
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          This page is only available for administrators.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            size={60}
            sx={{ color: "hsl(152, 65%, 28%)", mb: 2 }}
          />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              color: "hsl(152, 65%, 28%)",
            }}>
            Loading students...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: "linear-gradient(135deg, #001f3f 0%, #003366 100%)",
          color: "white",
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <People sx={{ fontSize: 40, mr: 2, color: "white" }} />
          <Typography
            variant="h4"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}>
            Students Overview
          </Typography>
        </Box>
        <Typography
          variant="body1"
          sx={{
            opacity: 0.95,
            fontSize: "1.1rem",
            color: "white",
          }}>
          View basic profile information of all enrolled students
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Students Table */}
      <Paper
        sx={{
          p: 3,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)", mb: 3 }}>
          All Students
        </Typography>

        {students.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <School
              sx={{ fontSize: 64, color: "rgba(31, 120, 80, 0.3)", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary">
              No students found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Students will appear here once they are enrolled
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "rgba(31, 120, 80, 0.05)" }}>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Student Name
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Email
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Phone
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    RFID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                    }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => {
                  const attendance = attendanceData[student.uid];
                  // Construct child name from separate fields
                  const childName =
                    [
                      student.childFirstName,
                      student.childMiddleName,
                      student.childLastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || "";
                  const studentName =
                    childName ||
                    `${student.firstName || ""} ${
                      student.lastName || ""
                    }`.trim();
                  return (
                    <TableRow
                      key={student.uid}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(31, 120, 80, 0.05)",
                        },
                      }}>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}>
                          <Avatar
                            src={student.photoURL || ""}
                            sx={{
                              background: student.photoURL
                                ? "transparent"
                                : "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                              width: 40,
                              height: 40,
                            }}>
                            {!student.photoURL &&
                              (childName || student.firstName || "S")
                                .charAt(0)
                                .toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body1"
                              fontWeight={500}
                              sx={{ color: "hsl(152, 65%, 28%)" }}>
                              {studentName || "N/A"}
                            </Typography>
                            {childName && (
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                Parent:{" "}
                                {`${student.firstName || ""} ${
                                  student.lastName || ""
                                }`.trim()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.email || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.phone || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                            fontWeight: 600,
                          }}>
                          {student.childRFID || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit Profile">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewProfile(student)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Student Profile Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "90vh",
          },
        }}>
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={selectedStudent?.photoURL || ""}
                sx={{
                  width: 50,
                  height: 50,
                  background: selectedStudent?.photoURL
                    ? "transparent"
                    : "rgba(255, 255, 255, 0.2)",
                  fontSize: "1.5rem",
                  color: "white",
                }}>
                {!selectedStudent?.photoURL &&
                  (() => {
                    const childName = selectedStudent
                      ? [
                          selectedStudent.childFirstName,
                          selectedStudent.childMiddleName,
                          selectedStudent.childLastName,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : "";
                    return (childName || selectedStudent?.firstName || "S")
                      .charAt(0)
                      .toUpperCase();
                  })()}
              </Avatar>

              {/* Profile Picture Action Button */}
              {selectedStudent?.photoURL ? (
                // Delete button - shown when profile picture exists
                <IconButton
                  onClick={handleProfilePictureDelete}
                  disabled={deletingPicture || uploadingPicture}
                  sx={{
                    position: "absolute",
                    bottom: -4,
                    right: -4,
                    backgroundColor: "white",
                    width: 24,
                    height: 24,
                    "&:hover": {
                      backgroundColor: "#ffebee",
                    },
                  }}>
                  {deletingPicture ? (
                    <CircularProgress size={14} />
                  ) : (
                    <Delete sx={{ fontSize: 14, color: "#f44336" }} />
                  )}
                </IconButton>
              ) : (
                // Upload button - shown when no profile picture
                <>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="profile-picture-upload"
                    type="file"
                    onChange={handleProfilePictureUpload}
                  />
                  <label htmlFor="profile-picture-upload">
                    <IconButton
                      component="span"
                      disabled={uploadingPicture || deletingPicture}
                      sx={{
                        position: "absolute",
                        bottom: -4,
                        right: -4,
                        backgroundColor: "white",
                        width: 24,
                        height: 24,
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                        },
                      }}>
                      {uploadingPicture ? (
                        <CircularProgress size={14} />
                      ) : (
                        <CameraAlt
                          sx={{ fontSize: 14, color: "hsl(152, 65%, 28%)" }}
                        />
                      )}
                    </IconButton>
                  </label>
                </>
              )}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
                Edit Student Profile
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: "white" }}>
                {(() => {
                  const childName = selectedStudent
                    ? [
                        selectedStudent.childFirstName,
                        selectedStudent.childMiddleName,
                        selectedStudent.childLastName,
                      ]
                        .filter(Boolean)
                        .join(" ")
                    : "";
                  return (
                    childName ||
                    `${selectedStudent?.firstName || ""} ${
                      selectedStudent?.lastName || ""
                    }`.trim()
                  );
                })()}
              </Typography>
            </Box>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseDialog}
            aria-label="close"
            sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, mt: 2 }}>
          {profileLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "300px",
              }}>
              <CircularProgress sx={{ color: "hsl(152, 65%, 28%)" }} />
            </Box>
          ) : (
            selectedStudent && (
              <Box>
                {/* Basic Information */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "hsl(152, 65%, 28%)",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}>
                  <Person /> Basic Information
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {/* Child Information */}
                  {(() => {
                    const childName = selectedStudent
                      ? [
                          selectedStudent.childFirstName,
                          selectedStudent.childMiddleName,
                          selectedStudent.childLastName,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : "";
                    return (
                      childName && (
                        <Grid item xs={12} sm={6}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 2,
                            }}>
                            <Person sx={{ color: "hsl(152, 65%, 28%)" }} />
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                Child Name
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {childName}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )
                    );
                  })()}

                  {selectedStudent.childSex && (
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}>
                        <Person sx={{ color: "hsl(152, 65%, 28%)" }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Gender
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {selectedStudent.childSex}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {(selectedStudent.childBirthMonth ||
                    selectedStudent.childBirthDay ||
                    selectedStudent.childBirthYear) && (
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                        }}>
                        <CalendarToday sx={{ color: "hsl(152, 65%, 28%)" }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Date of Birth
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {(() => {
                              const months = [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
                              ];
                              const monthName = selectedStudent.childBirthMonth
                                ? typeof selectedStudent.childBirthMonth ===
                                  "number"
                                  ? months[selectedStudent.childBirthMonth - 1]
                                  : selectedStudent.childBirthMonth
                                : "";
                              return `${monthName} ${
                                selectedStudent.childBirthDay || ""
                              }, ${selectedStudent.childBirthYear || ""}`
                                .trim()
                                .replace(/,\s*$/, "");
                            })()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {/* Parent Information */}
                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}>
                      <Person sx={{ color: "hsl(152, 65%, 28%)" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Parent Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {`${selectedStudent.firstName || ""} ${
                            selectedStudent.lastName || ""
                          }`.trim() || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}>
                      <Email sx={{ color: "hsl(152, 65%, 28%)" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Email Address
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedStudent.email || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}>
                      <Phone sx={{ color: "hsl(152, 65%, 28%)" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedStudent.phone || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {selectedStudent.address && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "start",
                          gap: 1,
                          mb: 2,
                        }}>
                        <School sx={{ color: "hsl(152, 65%, 28%)", mt: 0.5 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Address
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {selectedStudent.address}
                            {selectedStudent.barangay &&
                              `, ${selectedStudent.barangay}`}
                            {selectedStudent.municipality &&
                              `, ${selectedStudent.municipality}`}
                            {selectedStudent.province &&
                              `, ${selectedStudent.province}`}
                            {selectedStudent.region &&
                              `, ${selectedStudent.region}`}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>

                {/* Attendance Summary */}
                {attendanceData[selectedStudent.uid] && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: "hsl(152, 65%, 28%)",
                          mb: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}>
                        <CalendarToday /> Attendance Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={4}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: "center",
                              background: "rgba(31, 120, 80, 0.1)",
                            }}>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 700,
                                color: "hsl(152, 65%, 28%)",
                              }}>
                              {
                                attendanceData[selectedStudent.uid]
                                  .attendanceRate
                              }
                              %
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              Attendance Rate
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: "center",
                              background: "rgba(76, 175, 80, 0.1)",
                            }}>
                            <Typography
                              variant="h4"
                              sx={{ fontWeight: 700, color: "#4caf50" }}>
                              {attendanceData[selectedStudent.uid].presentDays}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              Present Days
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: "center",
                              background: "rgba(255, 152, 0, 0.1)",
                            }}>
                            <Typography
                              variant="h4"
                              sx={{ fontWeight: 700, color: "#ff9800" }}>
                              {attendanceData[selectedStudent.uid].totalDays}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary">
                              Total Days
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </>
                )}
              </Box>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Dialog */}
      <Dialog
        open={qrPreviewOpen}
        onClose={closeParentQRPreview}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            textAlign: "center",
          },
        }}>
        <DialogTitle
          sx={{
            background:
              qrPreviewType === "timeIn"
                ? "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
                : "linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "white" }}>
              {qrPreviewType === "timeIn" ? "Time In" : "Time Out"} QR Code
            </Typography>
            {qrPreviewParent && (
              <Typography variant="body2" sx={{ opacity: 0.9, color: "white" }}>
                {(() => {
                  const childName = [
                    qrPreviewParent.childFirstName,
                    qrPreviewParent.childMiddleName,
                    qrPreviewParent.childLastName,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    childName ||
                    `${qrPreviewParent.firstName} ${qrPreviewParent.lastName}`
                  );
                })()}
              </Typography>
            )}
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={closeParentQRPreview}
            aria-label="close"
            sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
          {qrPreviewSrc && (
            <>
              <Box
                sx={{
                  p: 2,
                  border:
                    qrPreviewType === "timeIn"
                      ? "4px solid #4caf50"
                      : "4px solid #ff9800",
                  borderRadius: 2,
                  mb: 3,
                  background: "white",
                }}>
                <img
                  src={qrPreviewSrc}
                  alt={`${
                    qrPreviewType === "timeIn" ? "Time In" : "Time Out"
                  } QR Code`}
                  style={{ width: 280, height: 280, display: "block" }}
                />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "center" }}>
                Present this QR code to the teacher to{" "}
                {qrPreviewType === "timeIn" ? "check in" : "check out"} your
                child.
              </Typography>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<Print />}
                  onClick={handlePrintQR}
                  sx={{
                    background:
                      qrPreviewType === "timeIn"
                        ? "linear-gradient(45deg, #4caf50, #66bb6a)"
                        : "linear-gradient(45deg, #ff9800, #ffb74d)",
                    color: "white",
                    "&:hover": {
                      background:
                        qrPreviewType === "timeIn"
                          ? "linear-gradient(45deg, #388e3c, #4caf50)"
                          : "linear-gradient(45deg, #f57c00, #ff9800)",
                    },
                  }}>
                  Print Both QR Codes
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}>
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}>
          <Delete sx={{ color: "white" }} />
          Confirm Delete Profile Picture
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText sx={{ fontSize: "1rem", color: "text.primary" }}>
            Are you sure you want to delete this profile picture? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            disabled={deletingPicture}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteProfilePicture}
            variant="contained"
            color="error"
            disabled={deletingPicture}
            startIcon={
              deletingPicture ? <CircularProgress size={16} /> : <Delete />
            }>
            {deletingPicture ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Modal */}
      <Dialog
        open={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}>
        <DialogTitle
          sx={{
            background: successMessage.includes("successfully")
              ? "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)"
              : "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}>
          {successMessage.includes("successfully") ? (
            <CameraAlt sx={{ color: "white" }} />
          ) : (
            <Delete sx={{ color: "white" }} />
          )}
          {successMessage.includes("successfully") ? "Success" : "Notice"}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText sx={{ fontSize: "1rem", color: "text.primary" }}>
            {successMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSuccessModalOpen(false)}
            variant="contained"
            color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsPage;
