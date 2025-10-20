import { 
  Add,
  CheckCircle,
  Delete,
  Download,
  Edit,
  Error as ErrorIcon,
  Print,
  Refresh,
  Search,
  Upload,
  VpnKey,
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
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
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
import * as XLSX from "xlsx";
import ChangePasswordDialog from "../components/ChangePasswordDialog";
import ChatIconButton from "../components/ChatIconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import UserForm from "../components/UserForm";
import { useAuth } from "../contexts/AuthContext";
import { generateQRCode } from "../utils/qrService";
import { 
  bulkImportParents,
  createUser, 
  deleteUserById, 
  getAllUsers,
  subscribeToAllUsers,
  updateUser,
} from "../utils/userService";

const UsersContent = () => {
  const { userProfile } = useAuth();
  const [userTab, setUserTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Dialog states
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  
  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Cache for generated parent QR codes to avoid recomputing each render
  const [parentQrCache, setParentQrCache] = useState({});

  // Parent QR preview modal state
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [qrPreviewSrc, setQrPreviewSrc] = useState("");
  const [qrPreviewType, setQrPreviewType] = useState("timeIn");
  const [qrPreviewParent, setQrPreviewParent] = useState(null);

  // Excel import states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showImportResults, setShowImportResults] = useState(false);

  // Role mapping
  const roleLabels = {
    teacher: "Teachers",
    parent: "Parents",
    admin: "Admins",
  };

  // Get available roles based on user permissions
  const getAvailableRoles = () => {
    if (userProfile && userProfile.role === "teacher") {
      // Teachers can only manage parents
      return ["parent"];
    }
    return Object.keys(roleLabels);
  };

  const roles = getAvailableRoles();

  // Load users when component mounts or tab changes
  useEffect(() => {
    loadUsers();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToAllUsers((result) => {
      if (result.success) {
        setUsers(result.data);
      } else {
        showSnackbar("Error loading users: " + result.error, "error");
      }
    });

    return () => unsubscribe();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(
        (user) =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        showSnackbar("Error loading users: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading users: " + error.message, "error");
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

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setConfirmDialogOpen(true);
  };

  const handleChangePassword = (user) => {
    setChangingPasswordUser(user);
    setChangePasswordDialogOpen(true);
  };

  const handleChangePasswordSubmit = async (uid, newPassword) => {
    setLoading(true);
    try {
      const result = await updateUser(uid, { password: newPassword });
      if (result.success) {
        showSnackbar("Password changed successfully!");
        setChangePasswordDialogOpen(false);
        setChangingPasswordUser(null);
      } else {
        showSnackbar("Error changing password: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUserFormSubmit = async (formData) => {
    setLoading(true);
    try {
      let result;
      if (editingUser) {
        // Update existing user
        result = await updateUser(editingUser.uid, formData);
        if (result.success) {
          showSnackbar("User updated successfully!");
          setUserFormOpen(false);
        } else {
          showSnackbar("Error updating user: " + result.error, "error");
        }
      } else {
        // Create new user
        result = await createUser(formData);
        if (result.success) {
          showSnackbar("User created successfully!");
          setUserFormOpen(false);
        } else {
          showSnackbar("Error creating user: " + result.error, "error");
        }
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    
    setLoading(true);
    try {
      const result = await deleteUserById(deletingUser.uid);
      if (result.success) {
        showSnackbar("User deleted successfully!");
        setConfirmDialogOpen(false);
        setDeletingUser(null);
      } else {
        showSnackbar("Error deleting user: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUsers = () => {
    const currentRole = roles[userTab];
    return filteredUsers.filter((user) => user.role === currentRole);
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

  // Excel import handlers
  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportedData([]);
    setImportResults(null);
    setShowImportResults(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map the Excel columns to our data structure
        const mappedData = jsonData.map((row) => {
          const mappedRow = {
            firstName: row["User's First Name"] || row["firstName"] || "",
            middleName: row["User's Middle Name"] || row["middleName"] || "",
            lastName: row["User's Last Name"] || row["lastName"] || "",
            suffix: row["Suffix"] || row["suffix"] || "",
            email: row["User's Email"] || row["email"] || "",
            phone:
              row["User's Phone"] ||
              row["User's Phone Number"] ||
              row["phone"] ||
              "",
            password: row["User's Password"] || row["password"] || "",
            confirmPassword:
              row["User's Confirm Password"] || row["confirmPassword"] || "",
            childFirstName:
              row["Child's First Name"] || row["childFirstName"] || "",
            childMiddleName:
              row["Child's Middle Name"] || row["childMiddleName"] || "",
            childLastName:
              row["Child's Last Name"] || row["childLastName"] || "",
            childSex: row["Child's Sex"] || row["childSex"] || "",
            childBirthMonth:
              row["Student's Birth Month"] || row["childBirthMonth"] || "",
            childBirthDay:
              row["Student's Birth Day"] || row["childBirthDay"] || "",
            childBirthYear:
              row["Student's Birth Year"] || row["childBirthYear"] || "",
            address: row["Address (Street)"] || row["address"] || "",
            barangay: row["Barangay"] || row["barangay"] || "",
            municipality: row["Municipality"] || row["municipality"] || "",
            province: row["Province"] || row["province"] || "",
            region: row["Region"] || row["region"] || "",
            childHandedness:
              row["Child Handedness"] || row["childHandedness"] || "",
            isStudying:
              row["Is the child presently studying?"] ||
              row["isStudying"] ||
              "",
            schoolName: row["If Yes, School Name?"] || row["schoolName"] || "",
            numberOfSiblings:
              row["Child's Number of Siblings"] ||
              row["numberOfSiblings"] ||
              "",
            birthOrder: row["Child's Birth Order"] || row["birthOrder"] || "",
            fatherFirstName:
              row["Father's First Name"] || row["fatherFirstName"] || "",
            fatherMiddleName:
              row["Father's Middle Name"] || row["fatherMiddleName"] || "",
            fatherLastName:
              row["Father's Last Name"] || row["fatherLastName"] || "",
            fatherAge: row["Father's Age"] || row["fatherAge"] || "",
            fatherOccupation:
              row["Father's Occupation"] || row["fatherOccupation"] || "",
            fatherEducation:
              row["Father's Educational Attainment"] ||
              row["fatherEducation"] ||
              "",
            motherFirstName:
              row["Mother's First Name"] || row["motherFirstName"] || "",
            motherMiddleName:
              row["Mother's Middle Name"] || row["motherMiddleName"] || "",
            motherLastName:
              row["Mother's Last Name"] || row["motherLastName"] || "",
            motherAge: row["Mother's Age"] || row["motherAge"] || "",
            motherOccupation:
              row["Mother's Occupation"] || row["motherOccupation"] || "",
            motherEducation:
              row["Mother's Educational Attainment"] ||
              row["motherEducation"] ||
              "",
          };
        
          return mappedRow;
        });

        setImportedData(mappedData);
        showSnackbar(
          `Successfully loaded ${mappedData.length} records from Excel`,
          "success"
        );
      } catch (error) {
        showSnackbar("Error reading Excel file: " + error.message, "error");
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset the file input
    event.target.value = "";
  };

  const handleImportSubmit = async () => {
    if (importedData.length === 0) {
      showSnackbar("No data to import", "warning");
      return;
    }

    setImportLoading(true);
    try {
      const result = await bulkImportParents(importedData);
      if (result.success) {
        setImportResults(result.data);
        setShowImportResults(true);
        showSnackbar(
          `Import completed: ${result.data.successCount} successful, ${result.data.failedCount} failed`,
          result.data.failedCount > 0 ? "warning" : "success"
        );
      } else {
        showSnackbar("Error importing parents: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error: " + error.message, "error");
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create an empty template with sample data for parents
    const templateData = [
      {
        "User's First Name": "Juan",
        "User's Middle Name": "Santos",
        "User's Last Name": "Dela Cruz",
        Suffix: "Jr.",
        "User's Email": "juan.delacruz@email.com",
        "User's Phone": "09171234567",
        "User's Password": "Password123",
        "Child's First Name": "Maria",
        "Child's Middle Name": "Santos",
        "Child's Last Name": "Dela Cruz",
        "Child's Sex": "Female",
        "Student's Birth Month": "5",
        "Student's Birth Day": "15",
        "Student's Birth Year": "2020",
        "Address (Street)": "123 Main Street",
        Barangay: "Kapitbahayan",
        Municipality: "Navotas",
        Province: "Metro Manila",
        Region: "NCR",
        "Child Handedness": "Right",
        "Is the child presently studying?": "Yes",
        "If Yes, School Name?": "Little Stars Daycare",
        "Child's Number of Siblings": "1",
        "Child's Birth Order": "2",
        "Father's First Name": "Pedro",
        "Father's Middle Name": "Martinez",
        "Father's Last Name": "Dela Cruz",
        "Father's Age": "35",
        "Father's Occupation": "Engineer",
        "Father's Educational Attainment": "College Graduate",
        "Mother's First Name": "Ana",
        "Mother's Middle Name": "Garcia",
        "Mother's Last Name": "Santos",
        "Mother's Age": "32",
        "Mother's Occupation": "Teacher",
        "Mother's Educational Attainment": "College Graduate",
      },
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parent Import Template");
    
    // Auto-size columns
    const maxWidth = 25;
    const cols = Object.keys(templateData[0]).map(() => ({ wch: maxWidth }));
    worksheet["!cols"] = cols;
    
    // Generate filename
    const filename = "Parent_Import_Template.xlsx";
    
    // Download file
    XLSX.writeFile(workbook, filename);
    showSnackbar(
      "Template downloaded successfully! Fill in the data and import.",
      "success"
    );
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportedData([]);
    setImportResults(null);
    setShowImportResults(false);
  };

  const handleDownloadUsers = (role) => {
    const currentUsers = getCurrentUsers();
    if (currentUsers.length === 0) {
      showSnackbar("No users to download", "warning");
      return;
    }

    let exportData = [];
    
    // Format data based on role
    if (role === "parent") {
      // Include all parent and child information
      exportData = currentUsers.map((user) => {
        // Build full parent name
        const parentName = [user.firstName, user.middleName, user.lastName]
          .filter(Boolean)
          .join(" ");
        
        // Build full child name
        const childName = [
          user.childFirstName,
          user.childMiddleName,
          user.childLastName,
        ]
          .filter(Boolean)
          .join(" ");
        
        return {
          "Parent Name": parentName || "",
          "Child Name": childName || "",
          "User's First Name": user.firstName || "",
          "User's Middle Name": user.middleName || "",
          "User's Last Name": user.lastName || "",
          Suffix: user.suffix || "",
          "User's Email": user.email || "",
          "User's Phone": user.phone || "",
          "User's Password": user.password || "",
          Role: user.role || "",
          "Child's First Name": user.childFirstName || "",
          "Child's Middle Name": user.childMiddleName || "",
          "Child's Last Name": user.childLastName || "",
          "Child's Sex": user.childSex || "",
          "Birth Month": user.childBirthMonth || "",
          "Birth Day": user.childBirthDay || "",
          "Birth Year": user.childBirthYear || "",
          Address: user.address || "",
          Barangay: user.barangay || "",
          Municipality: user.municipality || "",
          Province: user.province || "",
          Region: user.region || "",
          "Child Handedness": user.childHandedness || "",
          "Is Studying": user.isStudying || "",
          "School Name": user.schoolName || "",
          "Number of Siblings": user.numberOfSiblings || "",
          "Birth Order": user.birthOrder || "",
          "Father's First Name": user.fatherFirstName || "",
          "Father's Middle Name": user.fatherMiddleName || "",
          "Father's Last Name": user.fatherLastName || "",
          "Father's Age": user.fatherAge || "",
          "Father's Occupation": user.fatherOccupation || "",
          "Father's Education": user.fatherEducation || "",
          "Mother's First Name": user.motherFirstName || "",
          "Mother's Middle Name": user.motherMiddleName || "",
          "Mother's Last Name": user.motherLastName || "",
          "Mother's Age": user.motherAge || "",
          "Mother's Occupation": user.motherOccupation || "",
          "Mother's Education": user.motherEducation || "",
          "Created At": user.createdAt || "",
          "Last Login": user.lastLogin || "",
        };
      });
    } else {
      // For teachers and admins - basic information only
      exportData = currentUsers.map((user) => ({
        "First Name": user.firstName || "",
        "Middle Name": user.middleName || "",
        "Last Name": user.lastName || "",
        Suffix: user.suffix || "",
        Email: user.email || "",
        Phone: user.phone || "",
        Password: user.password || "",
        Role: user.role || "",
        "Created At": user.createdAt || "",
        "Last Login": user.lastLogin || "",
      }));
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, roleLabels[role]);
    
    // Auto-size columns
    const maxWidth = 20;
    const cols = Object.keys(exportData[0] || {}).map(() => ({
      wch: maxWidth,
    }));
    worksheet["!cols"] = cols;
    
    // Generate filename with date
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `${roleLabels[role]}_${dateStr}.xlsx`;
    
    // Download file
    XLSX.writeFile(workbook, filename);
    showSnackbar(
      `Downloaded ${currentUsers.length} ${roleLabels[role].toLowerCase()}`,
      "success"
    );
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
              User Management
            </Typography>
            {userProfile && userProfile.role === "teacher" && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                You can add and manage parents only.
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search users..."
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
            <Tooltip title="Refresh">
              <IconButton onClick={loadUsers} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Tabs
          value={userTab}
          onChange={(e, newValue) => setUserTab(newValue)}
          sx={{ mb: 3 }}>
          {roles.map((role, index) => (
            <Tab key={role} label={roleLabels[role]} />
          ))}
        </Tabs>

        {roles.map(
          (role, index) =>
          userTab === index && (
            <Box key={role}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                  {roleLabels[role]} ({getCurrentUsers().length})
                </Typography>
                {/* Show Add button for non-teachers or for teachers when managing parents */}
                  {(!userProfile ||
                    userProfile.role !== "teacher" ||
                    role === "parent") && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                    {/* Show Download button for all tabs */}
                    <Button 
                      variant="outlined" 
                      startIcon={<Download />} 
                      onClick={() => handleDownloadUsers(role)}
                      disabled={getCurrentUsers().length === 0}
                      sx={{ 
                          borderColor: "hsl(152, 65%, 28%)",
                          color: "hsl(152, 65%, 28%)",
                          "&:hover": {
                            borderColor: "#0d47a1",
                            backgroundColor: "rgba(21, 101, 192, 0.04)",
                          },
                        }}>
                      Download Excel
                    </Button>
                    {/* Show Import and Template buttons only for parents tab */}
                      {role === "parent" && (
                      <>
                        <Button 
                          variant="outlined" 
                          startIcon={<Download />} 
                          onClick={handleDownloadTemplate}
                          sx={{ 
                              borderColor: "hsl(152, 65%, 28%)",
                              color: "hsl(152, 65%, 28%)",
                              "&:hover": {
                                borderColor: "#0d47a1",
                                backgroundColor: "rgba(21, 101, 192, 0.04)",
                              },
                            }}>
                          Download Template
                        </Button>
                        <Button 
                          variant="outlined" 
                          startIcon={<Upload />} 
                          onClick={handleImportClick}
                          sx={{ 
                              borderColor: "hsl(152, 65%, 28%)",
                              color: "hsl(152, 65%, 28%)",
                              "&:hover": {
                                borderColor: "#0d47a1",
                                backgroundColor: "rgba(21, 101, 192, 0.04)",
                              },
                            }}>
                          Import Excel
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="contained" 
                      startIcon={<Add />} 
                      onClick={handleAddUser}
                        sx={{
                          background:
                            "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                        }}>
                      Add {roleLabels[role].slice(0, -1)}
                    </Button>
                  </Box>
                )}
              </Box>
              
              {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
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
                            Email
                          </TableCell>
                          <TableCell
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 600,
                            }}>
                            Phone
                          </TableCell>
                          {((userProfile && userProfile.role === "admin") ||
                            (userProfile &&
                              userProfile.role === "teacher")) && (
                            <TableCell
                              sx={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                                fontWeight: 600,
                              }}>
                              Password
                            </TableCell>
                          )}
                          <TableCell
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 600,
                            }}>
                            Role
                          </TableCell>
                          {roles[userTab] === "parent" && (
                            <TableCell
                              sx={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                                fontWeight: 600,
                              }}
                              align="center">
                              RFID
                            </TableCell>
                          )}
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
                      {getCurrentUsers().length === 0 ? (
                        <TableRow>
                            <TableCell
                              colSpan={
                                (userProfile && userProfile.role === "admin") ||
                                (userProfile && userProfile.role === "teacher")
                                  ? roles[userTab] === "parent"
                                    ? 7
                                    : 6
                                  : roles[userTab] === "parent"
                                  ? 6
                                  : 5
                              }
                              align="center"
                              sx={{
                                fontFamily: "Plus Jakarta Sans, sans-serif",
                              }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}>
                              No {roleLabels[role].toLowerCase()} found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        getCurrentUsers().map((user) => (
                          <TableRow key={user.uid}>
                              <TableCell
                                sx={{
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}>
                                {user.firstName} {user.lastName}
                                {user.suffix ? ` ${user.suffix}` : ""}
                            </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}>
                                {user.email}
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily: "Plus Jakarta Sans, sans-serif",
                                }}>
                                {user.phone || "-"}
                              </TableCell>
                            {/* Show Password cell only for admin users */}
                              {((userProfile && userProfile.role === "admin") ||
                                (userProfile &&
                                  userProfile.role === "teacher")) && (
                                <TableCell
                                  sx={{
                                    fontFamily: "Plus Jakarta Sans, sans-serif",
                                  }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                      fontFamily:
                                        "Plus Jakarta Sans, sans-serif",
                                      color: "#ff6f00",
                                    fontWeight: 600,
                                      letterSpacing: "0.5px",
                                      fontSize: "0.9rem",
                                    }}>
                                    {user.password || "••••••••"}
                                </Typography>
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip 
                                  label={
                                    user.role.charAt(0).toUpperCase() +
                                    user.role.slice(1)
                                  }
                                color="primary"
                                size="small"
                              />
                            </TableCell>
                              {roles[userTab] === "parent" && (
                              <TableCell align="center">
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontFamily:
                                        "Plus Jakarta Sans, sans-serif",
                                      fontWeight: 600,
                                    }}>
                                    {user.childRFID || "-"}
                                  </Typography>
                              </TableCell>
                            )}
                            <TableCell>
                              {/* Chat button - teachers can message parents, parents can message teachers */}
                                {userProfile &&
                                  ((userProfile.role === "teacher" &&
                                    user.role === "parent") ||
                                    (userProfile.role === "parent" &&
                                      user.role === "teacher")) && (
                                <ChatIconButton 
                                  targetUser={{
                                    id: user.uid,
                                    name: `${user.firstName} ${user.lastName}`,
                                        role: user.role,
                                  }}
                                />
                              )}
                              {/* Show edit button for all users that teachers can manage, but only show delete for non-teachers */}
                                {(!userProfile ||
                                  userProfile.role !== "teacher" ||
                                  user.role === "parent") && (
                                <Tooltip title="Edit">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                      onClick={() => handleEditUser(user)}>
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* Change Password button - for admins and teachers managing their users */}
                                {(!userProfile ||
                                  userProfile.role !== "teacher" ||
                                  user.role === "parent") && (
                                <Tooltip title="Change Password">
                                  <IconButton 
                                    size="small" 
                                    color="secondary"
                                      onClick={() =>
                                        handleChangePassword(user)
                                      }>
                                    <VpnKey />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {/* Only show delete button for non-teachers */}
                                {(!userProfile ||
                                  userProfile.role !== "teacher") && (
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                      onClick={() => handleDeleteUser(user)}>
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )
        )}
      </Paper>

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onClose={() => setUserFormOpen(false)}
        onSubmit={handleUserFormSubmit}
        userData={editingUser}
        loading={loading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.firstName} ${deletingUser?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={loading}
        type="danger"
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        onSubmit={handleChangePasswordSubmit}
        user={changingPasswordUser}
        loading={loading}
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

      {/* Excel Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="md"
        fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}>
          <Upload />
          Import Parents from Excel
        </DialogTitle>
        <DialogContent dividers>
          {!showImportResults ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Instructions */}
              <Alert severity="info">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Instructions:</strong>
                </Typography>
                <Typography variant="body2" component="div">
                  1. Download the Excel template below
                  <br />
                  2. Fill in the parent information (First Name, Last Name,
                  Email, and Password are required)
                  <br />
                  3. Upload the completed Excel file
                  <br />
                  4. Review the data and click Import
                </Typography>
              </Alert>

              {/* Download Template Button */}
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
                sx={{ alignSelf: "flex-start" }}>
                Download Excel Template
              </Button>

              {/* File Upload */}
              <Box>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  id="excel-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="excel-file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<Upload />}
                    sx={{
                      background:
                        "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                    }}>
                    Upload Excel File
                  </Button>
                </label>
              </Box>

              {/* Preview of imported data */}
              {importedData.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: 600 }}>
                    Preview: {importedData.length} record(s) loaded
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <strong>Parent Name</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Email</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Phone</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Password</strong>
                          </TableCell>
                          <TableCell>
                            <strong>Child Name</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importedData.map((parent, index) => {
                          const parentName =
                            [
                              parent.firstName,
                              parent.middleName,
                              parent.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "-";
                          const childName =
                            [
                              parent.childFirstName,
                              parent.childMiddleName,
                              parent.childLastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "-";
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{parentName}</TableCell>
                              <TableCell>{parent.email || "-"}</TableCell>
                              <TableCell>{parent.phone || "-"}</TableCell>
                              <TableCell>{parent.password || "-"}</TableCell>
                              <TableCell>{childName}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Import Results */}
              <Alert
                severity={
                  importResults.failedCount > 0 ? "warning" : "success"
                }>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Import completed: {importResults.successCount} successful,{" "}
                  {importResults.failedCount} failed
                </Typography>
              </Alert>

              {/* Successful imports */}
              {importResults.successCount > 0 && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}>
                    <CheckCircle color="success" />
                    Successfully Imported ({importResults.successCount})
                  </Typography>
                  <List
                    sx={{
                      maxHeight: 200,
                      overflow: "auto",
                      bgcolor: "background.paper",
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                    }}>
                    {importResults.successfulImports.map((parent, index) => {
                      const parentName =
                        [parent.firstName, parent.middleName, parent.lastName]
                          .filter(Boolean)
                          .join(" ") || "N/A";
                      const childName = [
                        parent.childFirstName,
                        parent.childMiddleName,
                        parent.childLastName,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      
                      return (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={parentName}
                              secondary={
                                <>
                                  {parent.email}
                                  {childName && (
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      sx={{
                                        display: "block",
                                        fontFamily:
                                          "Plus Jakarta Sans, sans-serif",
                                        color: "text.secondary",
                                      }}>
                                      Child: {childName}
                                    </Typography>
                                  )}
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{
                                      display: "block",
                                      fontFamily:
                                        "Plus Jakarta Sans, sans-serif",
                                      color: "success.main",
                                      fontWeight: 600,
                                    }}>
                                    Password: {parent.password}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          {index <
                            importResults.successfulImports.length - 1 && (
                            <Divider />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </List>
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Important:</strong> Make sure to save the
                      passwords above. Parents will need these credentials to
                      log in.
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Failed imports */}
              {importResults.failedCount > 0 && (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}>
                    <ErrorIcon color="error" />
                    Failed Imports ({importResults.failedCount})
                  </Typography>
                  <List
                    sx={{
                      maxHeight: 200,
                      overflow: "auto",
                      bgcolor: "background.paper",
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                    }}>
                    {importResults.failedImports.map((item, index) => {
                      const parentName =
                        [
                          item.data.firstName,
                          item.data.middleName,
                          item.data.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "N/A";
                      const childName = [
                        item.data.childFirstName,
                        item.data.childMiddleName,
                        item.data.childLastName,
                      ]
                        .filter(Boolean)
                        .join(" ");
                      
                      return (
                        <React.Fragment key={index}>
                          <ListItem>
                            <ListItemText
                              primary={parentName}
                              secondary={
                                <>
                                  {item.data.email || "No email"}
                                  {childName && (
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      sx={{
                                        display: "block",
                                        fontFamily:
                                          "Plus Jakarta Sans, sans-serif",
                                        color: "text.secondary",
                                      }}>
                                      Child: {childName}
                                    </Typography>
                                  )}
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{
                                      display: "block",
                                      fontFamily:
                                        "Plus Jakarta Sans, sans-serif",
                                      color: "error.main",
                                    }}>
                                    Error: {item.error}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          {index < importResults.failedImports.length - 1 && (
                            <Divider />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseImportDialog}>
            {showImportResults ? "Close" : "Cancel"}
          </Button>
          {!showImportResults && (
            <Button
              onClick={handleImportSubmit}
              variant="contained"
              disabled={importedData.length === 0 || importLoading}
              startIcon={
                importLoading ? <CircularProgress size={20} /> : <Upload />
              }
              sx={{
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              }}>
              {importLoading ? "Importing..." : "Import"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersContent;
