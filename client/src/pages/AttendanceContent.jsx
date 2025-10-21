import {
  CalendarMonth,
  Download,
  History,
  PictureAsPdf,
  QrCode,
  Schedule,
  Search,
  TableChart,
  Today,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import QRScannerDialog from "../components/QRScannerDialog";
import RFIDSuccessModal from "../components/RFIDSuccessModal";
import { useAuth } from "../contexts/AuthContext";
import { getAllAttendance } from "../utils/attendanceService";
import {
  determineAttendanceType,
  getCurrentDay,
} from "../utils/attendanceTimeUtils";
import {
  calculateAttendanceStatus,
  formatAttendanceMessage,
} from "../utils/attendanceUtils";
import { markAttendanceViaQR } from "../utils/parentScheduleService";
import { getAllSchedules } from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { formatTo12Hour } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

const AttendanceContent = () => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [tabValue, setTabValue] = useState(0); // 0 = Today's Attendance, 1 = Attendance History
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  // Filter states
  const [dateFilter, setDateFilter] = useState("today"); // today, week, month, year, custom
  const [sectionFilter, setSectionFilter] = useState("all"); // all, sectionId
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
  });

  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // RFID Success Modal states
  const [rfidModalOpen, setRfidModalOpen] = useState(false);
  const [rfidModalData, setRfidModalData] = useState(null);

  // Load initial data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load attendance data when filters change
  useEffect(() => {
    if (students.length > 0 && sections.length > 0 && schedules.length > 0) {
      loadAttendanceData();
    }
  }, [dateFilter, sectionFilter, customStartDate, customEndDate, tabValue]);

  // Filter records when search term changes
  useEffect(() => {
    filterRecords();
  }, [searchTerm, attendanceRecords, students, sections, schedules]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersResult, sectionsResult, schedulesResult] = await Promise.all([
        getAllUsers(),
        getAllSections(),
        getAllSchedules(),
      ]);

      if (usersResult.success) {
        setStudents(usersResult.data);
      } else {
        showSnackbar("Error loading students: " + usersResult.error, "error");
      }

      if (sectionsResult.success) {
        setSections(sectionsResult.data);
      } else {
        showSnackbar(
          "Error loading sections: " + sectionsResult.error,
          "error"
        );
      }

      if (schedulesResult.success) {
        setSchedules(schedulesResult.data);
      } else {
        showSnackbar(
          "Error loading schedules: " + schedulesResult.error,
          "error"
        );
      }

      // Load attendance data after getting initial data
      if (
        usersResult.success &&
        sectionsResult.success &&
        schedulesResult.success
      ) {
        await loadAttendanceData();
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      showSnackbar("Error loading data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const filters = {};

      // Apply date filters
      const today = new Date().toISOString().split("T")[0];

      if (dateFilter === "today" && tabValue === 0) {
        filters.date = today;
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.startDate = weekAgo.toISOString().split("T")[0];
        filters.endDate = today;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.startDate = monthAgo.toISOString().split("T")[0];
        filters.endDate = today;
      } else if (dateFilter === "year") {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        filters.startDate = `${lastYear}-01-01`; // January 1 of last year
        filters.endDate = `${lastYear}-12-31`; // December 31 of last year
      } else if (dateFilter === "custom" && customStartDate) {
        filters.date = customStartDate;
      }

      // Apply section filter
      if (sectionFilter !== "all") {
        filters.sectionId = sectionFilter;
      }

      const attendanceResult = await getAllAttendance(filters);

      if (attendanceResult.success) {
        setAttendanceRecords(attendanceResult.data);
        calculateStats(attendanceResult.data);
      } else {
        showSnackbar(
          "Error loading attendance records: " + attendanceResult.error,
          "error"
        );
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
      showSnackbar("Error loading data: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records) => {
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
    };
    setStats(stats);
  };

  const filterRecords = () => {
    let filtered;

    if (searchTerm.trim()) {
      filtered = attendanceRecords.filter((record) => {
        const studentName = getStudentName(record.studentId).toLowerCase();
        const sectionName = getSectionNameByScheduleId(
          record.scheduleId
        ).toLowerCase();
        const date = new Date(record.date).toLocaleDateString().toLowerCase();

        return (
          studentName.includes(searchTerm.toLowerCase()) ||
          sectionName.includes(searchTerm.toLowerCase()) ||
          date.includes(searchTerm.toLowerCase())
        );
      });
    } else {
      filtered = attendanceRecords;
    }

    // Sort records in descending order (most recent first)
    // First by date (newest first), then by time (latest time first)
    const sortedFiltered = filtered.sort((a, b) => {
      // Compare dates first
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime(); // DESC by date
      }

      // If same date, sort by time (latest time first)
      const timeA = a.timeIn || a.timeOut || "00:00";
      const timeB = b.timeIn || b.timeOut || "00:00";

      return timeB.localeCompare(timeA); // DESC by time
    });

    setFilteredRecords(sortedFiltered);
  };

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.uid === studentId);
    return student
      ? `${student.firstName} ${student.lastName}`
      : "Unknown Student";
  };

  const getScheduleById = (scheduleId) => {
    return schedules.find((s) => s.id === scheduleId);
  };

  const getSectionByScheduleId = (scheduleId) => {
    const schedule = getScheduleById(scheduleId);
    if (schedule) {
      return sections.find((s) => s.id === schedule.sectionId);
    }
    return null;
  };

  const getSectionNameByScheduleId = (scheduleId) => {
    const section = getSectionByScheduleId(scheduleId);
    return section ? section.name : "Unknown Section";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "success";
      case "late":
        return "warning";
      case "absent":
        return "error";
      default:
        return "default";
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

  const handleCloseRfidModal = () => {
    console.log("🔍 AttendanceContent Debug - handleCloseRfidModal called");
    setRfidModalOpen(false);
    setRfidModalData(null);

    // After the success modal closes, automatically open the RFID scanner again
    setTimeout(() => {
      console.log("🔍 AttendanceContent Debug - Auto-restarting RFID scanner");
      handleOpenScanner(); // This will open the "Scan RFID" dialog
    }, 500); // Small delay for smooth transition
  };

  const handleRefresh = () => {
    loadAttendanceData();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      // Reset to today's filter when switching to Today's Attendance tab
      setDateFilter("today");
    } else {
      // Default to week view for history
      if (dateFilter === "today") {
        setDateFilter("week");
      }
    }
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleExportClose = () => {
    setExportDialogOpen(false);
  };

  const getExportData = (records, selectedSectionFilter) => {
    let exportRecords = records;

    // Filter by section if specified
    if (selectedSectionFilter !== "all") {
      exportRecords = records.filter((record) => {
        const schedule = getScheduleById(record.scheduleId);
        return schedule && schedule.sectionId === selectedSectionFilter;
      });
    }

    return exportRecords.map((record) => ({
      Date: new Date(record.date).toLocaleDateString(),
      Student: getStudentName(record.studentId),
      Section: getSectionNameByScheduleId(record.scheduleId),
      Status: record.status || "Not marked",
      "Time In": formatTo12Hour(record.timeIn) || "-",
      "Time Out": formatTo12Hour(record.timeOut) || "-",
      Notes: record.notes || "-",
    }));
  };

  const exportToExcel = (selectedSectionFilter = "all") => {
    try {
      const exportData = getExportData(filteredRecords, selectedSectionFilter);

      if (exportData.length === 0) {
        showSnackbar("No data to export", "warning");
        return;
      }

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();

      const sectionName =
        selectedSectionFilter === "all"
          ? "All Daycare Centers"
          : sections.find((s) => s.id === selectedSectionFilter)?.name ||
            "Unknown";

      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      // Auto-size columns
      const maxWidth = exportData.reduce(
        (w, r) => Math.max(w, r.Student?.length || 0),
        10
      );
      worksheet["!cols"] = [
        { wch: 12 }, // Date
        { wch: maxWidth }, // Student
        { wch: 15 }, // Section
        { wch: 12 }, // Status
        { wch: 12 }, // Time In
        { wch: 12 }, // Time Out
        { wch: 20 }, // Notes
      ];

      // Generate file name with date and section
      const dateRange =
        dateFilter === "today"
          ? new Date().toISOString().split("T")[0]
          : customStartDate || "all";

      const fileName = `Attendance_${sectionName.replace(
        /\s+/g,
        "_"
      )}_${dateRange}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showSnackbar(
        `Attendance exported successfully: ${sectionName}`,
        "success"
      );
    } catch (error) {
      showSnackbar("Error exporting to Excel: " + error.message, "error");
    }
  };

  const exportToPDF = (selectedSectionFilter = "all") => {
    try {
      const exportData = getExportData(filteredRecords, selectedSectionFilter);

      if (exportData.length === 0) {
        showSnackbar("No data to export", "warning");
        return;
      }

      const doc = new jsPDF();

      const sectionName =
        selectedSectionFilter === "all"
          ? "All Daycare Centers"
          : sections.find((s) => s.id === selectedSectionFilter)?.name ||
            "Unknown";

      // Title
      doc.setFontSize(18);
      doc.setTextColor(21, 101, 192);
      doc.text(`Attendance Records - ${sectionName}`, 14, 22);

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${exportData.length}`, 14, 36);
      doc.text(`Date Filter: ${dateFilter}`, 14, 42);

      // Prepare table data
      const tableData = exportData.map((record) => [
        record.Date,
        record.Student,
        record.Section,
        record.Status,
        record["Time In"],
        record["Time Out"],
      ]);

      // Generate table
      autoTable(doc, {
        startY: 48,
        head: [["Date", "Student", "Section", "Status", "Time In", "Time Out"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [21, 101, 192], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 48, left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 },
      });

      // Save PDF
      const dateRange =
        dateFilter === "today"
          ? new Date().toISOString().split("T")[0]
          : customStartDate || "all";

      const fileName = `Attendance_${sectionName.replace(
        /\s+/g,
        "_"
      )}_${dateRange}.pdf`;
      doc.save(fileName);

      showSnackbar(
        `Attendance exported successfully: ${sectionName}`,
        "success"
      );
    } catch (error) {
      showSnackbar("Error exporting to PDF: " + error.message, "error");
    }
  };

  const handleExport = () => {
    if (sectionFilter === "all") {
      // Export all sections as separate files
      if (exportFormat === "excel" || exportFormat === "both") {
        exportToExcel("all");
        sections.forEach((section) => {
          setTimeout(() => exportToExcel(section.id), 500);
        });
      }
      if (exportFormat === "pdf" || exportFormat === "both") {
        setTimeout(
          () => {
            exportToPDF("all");
            sections.forEach((section) => {
              setTimeout(() => exportToPDF(section.id), 500);
            });
          },
          exportFormat === "both" ? 1000 : 0
        );
      }
    } else {
      // Export specific section
      if (exportFormat === "excel") {
        exportToExcel(sectionFilter);
      } else if (exportFormat === "pdf") {
        exportToPDF(sectionFilter);
      } else if (exportFormat === "both") {
        exportToExcel(sectionFilter);
        setTimeout(() => exportToPDF(sectionFilter), 500);
      }
    }
    handleExportClose();
  };

  // RFID Scan handlers
  const handleOpenScanner = async (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const { value: rfid } = await Swal.fire({
      title: "Scan RFID",
      input: "text",
      inputLabel: "Place the card on the reader",
      inputPlaceholder: "RFID value...",
      inputAttributes: { autocapitalize: "off", autocomplete: "off" },
      showCancelButton: true,
      confirmButtonText: "Scan",
      confirmButtonColor: "#4caf50",
      cancelButtonColor: "#d33",
      allowOutsideClick: false,
      didOpen: () => {
        const input = Swal.getInput();
        if (input) input.focus();
      },
      preConfirm: (value) => {
        if (!value || !value.trim()) {
          Swal.showValidationMessage("Please scan an RFID value");
        }
        return value?.trim();
      },
    });

    if (!rfid) return;

    // Automatically determine attendance type based on current time and schedule
    await handleScanRFID(rfid);
  };

  const handleScanRFID = async (rfidValue) => {
    try {
      // Match RFID against registered users (parents with child info)
      const parent = students.find(
        (s) => (s.childRFID || "").trim() === rfidValue.trim()
      );
      if (!parent) {
        await Swal.fire({
          icon: "error",
          title: "RFID Not Found",
          text: "No registered user found for this RFID.",
          confirmButtonColor: "#d33",
        });
        return;
      }

      // Find the relevant schedule for today
      const currentDay = getCurrentDay();
      const relevantSchedule = schedules.find(
        (schedule) => schedule.day === currentDay
      );

      if (!relevantSchedule) {
        await Swal.fire({
          icon: "warning",
          title: "No Schedule Today",
          text: `No schedule found for ${currentDay}. Please check the schedule settings.`,
          confirmButtonColor: "#ff9800",
        });
        return;
      }

      // Determine attendance type based on current time and schedule
      const attendanceInfo = determineAttendanceType(
        relevantSchedule,
        currentDay
      );

      if (attendanceInfo.type === "outside") {
        await Swal.fire({
          icon: "warning",
          title: "Outside Attendance Hours",
          text: attendanceInfo.message,
          confirmButtonColor: "#ff9800",
        });
        return;
      }

      const attendanceType = attendanceInfo.type;
      const parentId = parent.uid;
      const qrDataString = JSON.stringify({
        type: "parent",
        parentId,
        attendanceType,
      });

      // Process attendance
      const result = await markAttendanceViaQR(
        qrDataString,
        parentId,
        attendanceType
      );

      if (result.success) {
        // Calculate attendance status based on actual time vs scheduled time
        const currentTime = new Date().toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        });

        // Get the scheduled time based on attendance type
        const scheduledTime =
          attendanceType === "timeIn"
            ? relevantSchedule.timeInStart
            : relevantSchedule.timeOutStart;

        const statusResult = calculateAttendanceStatus(
          scheduledTime,
          currentTime
        );
        const status = statusResult.status;
        const message = formatAttendanceMessage(statusResult, attendanceType);

        // Prepare data for the success modal
        const modalData = {
          child: result.data?.child || {
            firstName: parent.childFirstName || "Unknown",
            lastName: parent.childLastName || "Student",
          },
          parent: {
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
          },
          schedule: {
            sectionName: getSectionNameByScheduleId(relevantSchedule.sectionId),
            timeInStart: relevantSchedule.timeInStart,
            timeInEnd: relevantSchedule.timeInEnd,
            timeOutStart: relevantSchedule.timeOutStart,
            timeOutEnd: relevantSchedule.timeOutEnd,
          },
          attendance: result.attendance,
        };

        // Show success modal
        const modalDataToShow = {
          ...modalData,
          attendanceType,
          status,
          message,
        };

        console.log(
          "🔍 AttendanceContent Debug - Setting modal data:",
          modalDataToShow
        );
        console.log("🔍 AttendanceContent Debug - Status:", status);
        console.log(
          "🔍 AttendanceContent Debug - AttendanceType:",
          attendanceType
        );

        setRfidModalData(modalDataToShow);
        setRfidModalOpen(true);

        // Refresh attendance data to show updated records
        await loadAttendanceData();
      } else {
        await Swal.fire({
          icon: "error",
          title: "Attendance Failed",
          text: result.error || "Failed to record attendance.",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      console.error("Error processing RFID:", error);
      await Swal.fire({
        icon: "error",
        title: "RFID Scan Failed",
        text: "The RFID could not be processed. Please try again.",
        confirmButtonColor: "#d33",
      });
    }
  };

  if (loading && students.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 4,
          mb: 4,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            Attendance Management
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            {userProfile &&
              (userProfile.role === "teacher" ||
                userProfile.role === "admin") && (
                <Button
                  variant="outlined"
                  startIcon={<QrCode />}
                  onClick={handleOpenScanner}
                  sx={{
                    borderRadius: "12px",
                    px: 2,
                    py: 1,
                  }}>
                  Scan RFID
                </Button>
              )}
            <Button
              startIcon={<Download />}
              onClick={handleExportClick}
              variant="contained"
              disabled={filteredRecords.length === 0}
              sx={{
                borderRadius: "12px",
                px: 3,
                py: 1,
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              }}>
              Export
            </Button>
            <Button
              startIcon={<Schedule />}
              onClick={handleRefresh}
              variant="outlined"
              sx={{
                borderRadius: "12px",
                px: 2,
                py: 1,
              }}>
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: "12px",
                border: "2px solid rgba(21, 101, 192, 0.2)",
              }}>
              <CardContent
                sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Records
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "primary.main" }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: "12px",
                border: "2px solid rgba(76, 175, 80, 0.2)",
              }}>
              <CardContent
                sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Present
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "success.main" }}>
                  {stats.present}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: "12px",
                border: "2px solid rgba(255, 152, 0, 0.2)",
              }}>
              <CardContent
                sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Late
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "warning.main" }}>
                  {stats.late}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: "1 1 calc(25% - 12px)", minWidth: "200px" }}>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                borderRadius: "12px",
                border: "2px solid rgba(244, 67, 54, 0.2)",
              }}>
              <CardContent
                sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Absent
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "error.main" }}>
                  {stats.absent}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Tabs */}
        <Box
          sx={{
            display: "flex",
            mb: 3,
            borderBottom: 1,
            borderColor: "divider",
          }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ width: "100%" }}>
            <Tab
              icon={<Today />}
              iconPosition="start"
              label="Today's Attendance"
              sx={{ fontWeight: 600 }}
            />
            <Tab
              icon={<History />}
              iconPosition="start"
              label="Attendance History"
              sx={{ fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        {/* Filters - Only show for Attendance History tab */}
        {tabValue === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
            {/* Date Picker Filter */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flex: "1 1 300px",
                  minWidth: "250px",
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.03)",
                  borderRadius: "12px",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.05)",
                    border: "1px solid rgba(31, 120, 80, 0.3)",
                  },
                }}
                onClick={() =>
                  document.getElementById("date-picker-input").showPicker()
                }>
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.75rem", lineHeight: 1 }}>
                    Taking attendance for
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: "text.primary" }}>
                    {dateFilter === "today"
                      ? new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : dateFilter === "custom" && customStartDate
                      ? new Date(customStartDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Select Date"}
                  </Typography>
                </Box>
                <TextField
                  id="date-picker-input"
                  type="date"
                  value={
                    dateFilter === "today"
                      ? new Date().toISOString().split("T")[0]
                      : dateFilter === "custom"
                      ? customStartDate
                      : ""
                  }
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setDateFilter("custom");
                    setCustomStartDate(selectedDate);
                  }}
                  sx={{
                    opacity: 0,
                    position: "absolute",
                    pointerEvents: "none",
                    width: 0,
                    height: 0,
                  }}
                />
                <CalendarMonth sx={{ color: "primary.main", ml: 1 }} />
              </Box>

              <Box sx={{ flex: "1 1 300px", minWidth: "200px" }}>
                <FormControl fullWidth>
                  <InputLabel>Section Filter</InputLabel>
                  <Select
                    value={sectionFilter}
                    label="Section Filter"
                    onChange={(e) => setSectionFilter(e.target.value)}
                    sx={{ borderRadius: "12px" }}>
                    <MenuItem value="all">All Daycare Centers</MenuItem>
                    {sections.map((section) => (
                      <MenuItem key={section.id} value={section.id}>
                        {section.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Quick Date Filters */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button
                variant={dateFilter === "today" ? "contained" : "outlined"}
                size="small"
                onClick={() => setDateFilter("today")}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}>
                Today
              </Button>
              <Button
                variant={dateFilter === "week" ? "contained" : "outlined"}
                size="small"
                onClick={() => setDateFilter("week")}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}>
                Last Week
              </Button>
              <Button
                variant={dateFilter === "month" ? "contained" : "outlined"}
                size="small"
                onClick={() => setDateFilter("month")}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}>
                Last Month
              </Button>
              <Button
                variant={dateFilter === "year" ? "contained" : "outlined"}
                size="small"
                onClick={() => setDateFilter("year")}
                sx={{
                  borderRadius: "20px",
                  textTransform: "none",
                  fontSize: "0.875rem",
                }}>
                Last Year
              </Button>
            </Box>

            {/* Full Width Search Bar */}
            <Box sx={{ display: "flex", width: "100%" }}>
              <TextField
                fullWidth
                placeholder="Search by student, section, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(255, 255, 255, 1)",
                    },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Content based on tab */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}>
            <CircularProgress />
          </Box>
        ) : filteredRecords.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {tabValue === 0
                ? "No attendance records for today"
                : "No attendance records found"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0
                ? "Attendance records will appear here once students check in through their schedules."
                : "Try adjusting your filters or date range."}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {/* Attendance Records Table */}
            <TableContainer
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
              }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(31, 120, 80, 0.05)" }}>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Date
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Student
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Section
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Time In
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                      }}>
                      Time Out
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {new Date(record.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {getStudentName(record.studentId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {getSectionNameByScheduleId(record.scheduleId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{
                            color:
                              record.status === "present"
                                ? "success.main"
                                : record.status === "late"
                                ? "warning.main"
                                : record.status === "absent"
                                ? "error.main"
                                : "text.secondary",
                          }}>
                          {record.status || "Not marked"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTo12Hour(record.timeIn) || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTo12Hour(record.timeOut) || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={handleExportClose}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Export Attendance Records
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current Filters:
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                mb: 3,
                p: 2,
                bgcolor: "rgba(0,0,0,0.03)",
                borderRadius: 2,
              }}>
              <Typography variant="body2">
                <strong>Date:</strong>{" "}
                {dateFilter === "today"
                  ? "Today"
                  : dateFilter === "custom"
                  ? customStartDate
                    ? new Date(customStartDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select Date"
                  : dateFilter}
              </Typography>
              <Typography variant="body2">
                <strong>Section:</strong>{" "}
                {sectionFilter === "all"
                  ? "All Daycare Centers"
                  : sections.find((s) => s.id === sectionFilter)?.name ||
                    "Unknown"}
              </Typography>
              <Typography variant="body2">
                <strong>Records:</strong> {filteredRecords.length}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <FormControl component="fieldset">
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 600 }}>
                Select Export Format:
              </Typography>
              <RadioGroup
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}>
                <FormControlLabel
                  value="excel"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TableChart fontSize="small" />
                      <span>Excel (.xlsx)</span>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="pdf"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PictureAsPdf fontSize="small" />
                      <span>PDF (.pdf)</span>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="both"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Download fontSize="small" />
                      <span>Both Formats</span>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            {sectionFilter === "all" && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Exporting "All Daycare Centers" will create separate files for
                each section plus one combined file.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            px: 3,
            pb: 2,
          }}>
          <Button onClick={handleExportClose}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={filteredRecords.length === 0}
            sx={{
              background:
                "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
            }}>
            Export
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

      {/* Legacy QR dialog kept for compatibility, route scans to RFID handler */}
      <QRScannerDialog
        open={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={(value) => handleScanRFID(value, "timeIn")}
      />

      {/* RFID Success Modal */}
      <RFIDSuccessModal
        open={rfidModalOpen}
        onClose={handleCloseRfidModal}
        attendanceData={rfidModalData}
        attendanceType={rfidModalData?.attendanceType}
        status={rfidModalData?.status}
        message={rfidModalData?.message}
      />
    </Box>
  );
};

export default AttendanceContent;
