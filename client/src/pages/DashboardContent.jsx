import { 
  Announcement,
  Assessment,
  Cake,
  CalendarToday,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Event,
  Info,
  Notifications,
  People,
  Refresh,
  Schedule,
  School,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Avatar, 
  Box,
  Button,
  Card, 
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import DetailedProgressDialog from "../components/DetailedProgressDialog";
import StartChatButton from "../components/StartChatButton";
import { useAuth } from "../contexts/AuthContext";
import { getAllAnnouncements } from "../utils/announcementService";
import { getAllAttendance } from "../utils/attendanceService";
import { getAllParentProgress } from "../utils/progressService";
import { getAllSchedules } from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { getAllSkills } from "../utils/skillService";
import { getAllUsers, getUserById } from "../utils/userService";

const DashboardContent = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parentDashboardLoading, setParentDashboardLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // New state for enhanced dashboard
  const [announcements, setAnnouncements] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [skills, setSkills] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState({
    showMiniCalendar: true,
    showAnnouncementsCarousel: true,
    showTodaySchedule: true,
    showUpcomingEvents: true,
    showProgressSnapshot: true,
  });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [progressData, setProgressData] = useState({
    sections: [],
    parentProgress: [],
    summary: {
      totalParents: 0,
      totalLessons: 0,
      averageProgress: 0,
      completedLessons: 0,
    },
  });
  
  // Real data state
  const [dashboardStats, setDashboardStats] = useState({
    totalChildren: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalSchedules: 0,
    totalSkills: 0,
    todayAttendance: {
      present: 0,
      late: 0,
      absent: 0,
      total: 0,
    },
    attendanceRate: 0,
  });
  
  // Attendance state
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fullUserData, setFullUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  
  // Notification states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (userProfile && userProfile.role === "parent") {
      // Load parent-specific data
      loadParentProgress();
      loadAttendanceData();
      loadAnnouncements();
      loadEvents();
    } else if (
      userProfile &&
      (userProfile.role === "admin" || userProfile.role === "teacher")
    ) {
      // Load same dashboard data for both admin and teacher
      loadDashboardStats();
      loadSkills();
      loadAttendanceData();
      loadParentProgress(); // Load progress data for charts
      loadAnnouncements();
      loadEvents();
    }
    
    // Load dashboard settings from localStorage
    const savedSettings = localStorage.getItem("dashboardSettings");
    if (savedSettings) {
      setDashboardSettings(JSON.parse(savedSettings));
    }
    
    // Set initial loading to false after user profile is loaded
    if (userProfile) {
      setInitialLoading(false);
    }
  }, [userProfile]);

  // Update current date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadParentProgress = async () => {
    setLoading(true);
    if (userProfile?.role === "parent") {
      setParentDashboardLoading(true);
    }
    try {
      let result;
      if (userProfile?.role === "teacher") {
        // For teachers, load progress for their assigned students only
        console.log("Loading parent progress for teacher:", userProfile.uid);
        result = await getAllParentProgress(userProfile.uid, "teacher");
      } else if (userProfile?.role === "parent") {
        // For parents, load progress for their own child only
        console.log("Loading progress for parent:", userProfile.uid);
        result = await getAllParentProgress(userProfile.uid, "parent");
      } else {
        // For admin, load progress for all students
        console.log("Loading parent progress for admin - all students");
        result = await getAllParentProgress(null, "admin");
      }
      
      console.log("Parent progress result:", result);
      if (result.success) {
        setProgressData(result.data);
        console.log("Progress data set:", result.data);
      } else {
        console.error("Error loading parent progress:", result.error);
        showSnackbar("Error loading parent progress: " + result.error, "error");
      }
    } catch (error) {
      console.error("Exception loading parent progress:", error);
      showSnackbar("Error loading parent progress: " + error.message, "error");
    } finally {
      setLoading(false);
      if (userProfile?.role === "parent") {
        setParentDashboardLoading(false);
      }
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

  const handleOpenDialog = async (studentData) => {
    setSelectedStudent(studentData);
    setLoadingUserData(true);
    setDialogOpen(true);
    
    try {
      // Fetch full user data from backend
      const result = await getUserById(studentData.studentId);
      if (result.success) {
        // Merge progress data with full user data
        const combinedData = {
          ...result.data,
          ...studentData,
          // Ensure we have the student-specific data
          studentName: studentData.studentName,
          studentEmail: studentData.studentEmail,
          averageProgress: studentData.averageProgress,
          completedLessons: studentData.completedLessons,
          totalLessons: studentData.totalLessons,
          sections: studentData.sections,
        };
        setFullUserData(combinedData);
      } else {
        console.error("Error fetching user data:", result.error);
        showSnackbar("Error loading user details: " + result.error, "error");
        // Fallback to progress data only
        setFullUserData(studentData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showSnackbar("Error loading user details: " + error.message, "error");
      // Fallback to progress data only
      setFullUserData(studentData);
    } finally {
      setLoadingUserData(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStudent(null);
    setFullUserData(null);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "success";
    if (percentage >= 75) return "info";
    if (percentage >= 50) return "warning";
    return "error";
  };

  const getProgressStatus = (percentage) => {
    if (percentage >= 100)
      return { status: "completed", color: "success", text: "Completed" };
    if (percentage >= 75)
      return { status: "almost_done", color: "info", text: "Almost Done" };
    if (percentage >= 50)
      return { status: "in_progress", color: "warning", text: "In Progress" };
    if (percentage > 0)
      return { status: "started", color: "info", text: "Started" };
    return { status: "not_started", color: "default", text: "Not Started" };
  };

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [usersResult, schedulesResult, skillsResult, attendanceResult] =
        await Promise.all([
        getAllUsers(),
        getAllSchedules(),
        getAllSkills(),
          getAllAttendance(),
        ]);

      if (usersResult.success) {
        const users = usersResult.data;
        const teachers = users.filter((user) => user.role === "teacher");
        const parents = users.filter((user) => user.role === "parent");
        const children = parents; // In this system, parents represent children

        // Calculate today's attendance
        const today = new Date().toISOString().split("T")[0];
        const todayAttendance = attendanceResult.success
          ? attendanceResult.data.filter((record) => record.date === today)
          : [];

        const attendanceStats = {
          present: todayAttendance.filter(
            (record) => record.status === "present"
          ).length,
          late: todayAttendance.filter((record) => record.status === "late")
            .length,
          absent: todayAttendance.filter((record) => record.status === "absent")
            .length,
          total: todayAttendance.length,
        };

        const attendanceRate =
          attendanceStats.total > 0
            ? Math.round(
                ((attendanceStats.present + attendanceStats.late) /
                  attendanceStats.total) *
                  100
              )
            : 0;

        setDashboardStats({
          totalChildren: children.length,
          totalTeachers: teachers.length,
          totalParents: parents.length,
          totalSchedules: schedulesResult.success
            ? schedulesResult.data.length
            : 0,
          totalSkills: skillsResult.success ? skillsResult.data.length : 0,
          todayAttendance: attendanceStats,
          attendanceRate,
        });
      } else {
        showSnackbar(
          "Error loading dashboard statistics: " + usersResult.error,
          "error"
        );
      }
    } catch (error) {
      showSnackbar(
        "Error loading dashboard statistics: " + error.message,
        "error"
      );
    } finally {
      setLoading(false);
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

  const loadAttendanceData = async () => {
    setAttendanceLoading(true);
    if (userProfile?.role === "parent") {
      setParentDashboardLoading(true);
    }
    try {
      const result = await getAllAttendance();
      if (result.success) {
        setAttendanceData(result.data);
      } else {
        showSnackbar("Error loading attendance data: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading attendance data: " + error.message, "error");
    } finally {
      setAttendanceLoading(false);
      if (userProfile?.role === "parent") {
        setParentDashboardLoading(false);
      }
    }
  };

  // Load announcements for carousel
  const loadAnnouncements = async () => {
    try {
      const result = await getAllAnnouncements();
      if (result.success) {
        setAnnouncements(result.data);
      }
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  // Load today's events and upcoming events
  const loadEvents = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const todayEventsList = [];
      const upcomingEventsList = [];

      // Get sections and skills for name mapping
      const sectionsResult = await getAllSections();
      const skillsResult = await getAllSkills();
      
      const sectionsMap = {};
      const skillsMap = {};
      
      if (sectionsResult.success) {
        setSections(sectionsResult.data);
        sectionsResult.data.forEach((section) => {
          sectionsMap[section.id] = section.name;
        });
      }
      
      if (skillsResult.success) {
        setSkills(skillsResult.data);
        skillsResult.data.forEach((skill) => {
          skillsMap[skill.id] = skill.name;
        });
      }

      // Get today's schedules
      const schedulesResult = await getAllSchedules();
      if (schedulesResult.success) {
        setSchedules(schedulesResult.data); // Store all schedules for calendar display

        const dayName = new Date().toLocaleDateString("en-US", {
          weekday: "long",
        });
        const todaySchedules = schedulesResult.data.filter(
          (schedule) => schedule.day === dayName
        );

        todaySchedules.forEach((schedule) => {
          const subjectName =
            skillsMap[schedule.subjectId] || schedule.subjectId;
          const sectionName =
            sectionsMap[schedule.sectionId] || schedule.sectionId;
          
          todayEventsList.push({
            id: schedule.id,
            type: "schedule",
            title: `Class: ${subjectName}`,
            time: `${schedule.timeIn} - ${schedule.timeOut}`,
            description: `Section: ${sectionName}`,
            icon: <Schedule />,
          });
        });
      }

      // Get today's announcements
      const announcementsResult = await getAllAnnouncements();
      if (announcementsResult.success) {
        const todayAnnouncements = announcementsResult.data.filter(
          (announcement) => announcement.date === today
        );
        
        todayAnnouncements.forEach((announcement) => {
          todayEventsList.push({
            id: announcement.id,
            type: "announcement",
            title: announcement.title,
            time: announcement.type,
            description: announcement.description,
            icon: <Announcement />,
          });
        });
      }

      // Get upcoming schedules for the next 7 days
      if (schedulesResult.success) {
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);
          const dateStr = futureDate.toISOString().split("T")[0];
          const dayName = futureDate.toLocaleDateString("en-US", {
            weekday: "long",
          });
          
          // Find schedules for this future day
          const futureSchedules = schedulesResult.data.filter(
            (schedule) => schedule.day === dayName
          );

          futureSchedules.forEach((schedule) => {
            const subjectName =
              skillsMap[schedule.subjectId] || schedule.subjectId;
            const sectionName =
              sectionsMap[schedule.sectionId] || schedule.sectionId;
            
            upcomingEventsList.push({
              id: `${schedule.id}-${dateStr}`,
              type: "schedule",
              title: `Class: ${subjectName}`,
              time: dateStr,
              description: `${sectionName} - ${schedule.timeIn} to ${schedule.timeOut}`,
              icon: <Schedule />,
            });
          });
        }
      }

      // Get upcoming announcements for the next 7 days
      if (announcementsResult.success) {
        for (let i = 1; i <= 7; i++) {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + i);
          const dateStr = futureDate.toISOString().split("T")[0];

          const futureAnnouncements = announcementsResult.data.filter(
            (announcement) => announcement.date === dateStr
          );

          futureAnnouncements.forEach((announcement) => {
            upcomingEventsList.push({
              id: `${announcement.id}-${dateStr}`,
              type: "announcement",
              title: announcement.title,
              time: dateStr,
              description: announcement.description,
              icon: <Announcement />,
            });
          });
        }
      }

      // Get student birthdays for the next 7 days
      try {
        const usersResult = await getAllUsers();
        if (usersResult.success) {
          const students = usersResult.data.filter(
            (user) => user.role === "parent"
          );
          
          for (let i = 1; i <= 7; i++) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + i);
            const dateStr = futureDate.toISOString().split("T")[0];
            const month = futureDate.getMonth() + 1;
            const day = futureDate.getDate();
            
            // Check for student birthdays (assuming birthday is stored as MM-DD format)
            students.forEach((student) => {
              if (student.birthday) {
                const birthdayParts = student.birthday.split("-");
                if (birthdayParts.length === 2) {
                  const birthMonth = parseInt(birthdayParts[0]);
                  const birthDay = parseInt(birthdayParts[1]);
                  
                  if (birthMonth === month && birthDay === day) {
                    const age =
                      futureDate.getFullYear() -
                      (student.birthYear || new Date().getFullYear() - 5);
                    upcomingEventsList.push({
                      id: `birthday-${student.id}-${dateStr}`,
                      type: "birthday",
                      title: `${
                        student.childName || student.firstName
                      }'s Birthday`,
                      time: dateStr,
                      description: `${
                        student.childName || student.firstName
                      } turns ${age} today!`,
                      icon: <Cake />,
                    });
                  }
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error loading student birthdays:", error);
      }

      // Sort upcoming events by date
      upcomingEventsList.sort((a, b) => new Date(a.time) - new Date(b.time));

      setTodayEvents(todayEventsList);
      setUpcomingEvents(upcomingEventsList);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  // Carousel navigation functions
  const nextAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => 
      prev === announcements.length - 1 ? 0 : prev + 1
    );
  };

  const prevAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => 
      prev === 0 ? announcements.length - 1 : prev - 1
    );
  };

  // Check if a date has events (schedules, announcements, upcoming events)
  const hasEventsOnDate = (date) => {
    const dateStr = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      date
    )
      .toISOString()
      .split("T")[0];
    const dayName = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      date
    ).toLocaleDateString("en-US", { weekday: "long" });
    
    // Check announcements
    const hasAnnouncement = announcements.some((ann) => ann.date === dateStr);
    
    // Check if it's today and has today's events
    const isToday = date === new Date().getDate();
    const hasTodayEvent = isToday && todayEvents.length > 0;
    
    // Check upcoming events
    const hasUpcomingEvent = upcomingEvents.some(
      (event) => event.time === dateStr
    );
    
    // Check if there are scheduled classes for this day of the week
    const hasScheduledClass = schedules.some(
      (schedule) => schedule.day === dayName
    );

    return (
      hasAnnouncement || hasTodayEvent || hasUpcomingEvent || hasScheduledClass
    );
  };

  // Dashboard edit functions
  const handleEditDashboard = () => {
    setIsEditMode(true);
    setEditDialogOpen(true);
  };

  const handleSaveDashboardSettings = () => {
    // Save dashboard settings to localStorage or backend
    localStorage.setItem(
      "dashboardSettings",
      JSON.stringify(dashboardSettings)
    );
    setIsEditMode(false);
    setEditDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditDialogOpen(false);
  };

  // Attendance chart functions
  const prepareAttendanceComparisonData = () => {
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
    };

    attendanceData.forEach((record) => {
      if (record.status === "present") statusCounts.present++;
      else if (record.status === "late") statusCounts.late++;
      else if (record.status === "absent") statusCounts.absent++;
    });

    return {
      labels: ["Present", "Late", "Absent"],
      datasets: [
        {
        data: [statusCounts.present, statusCounts.late, statusCounts.absent],
          backgroundColor: ["#4caf50", "#ff9800", "#f44336"],
          borderColor: ["#388e3c", "#f57c00", "#d32f2f"],
          borderWidth: 2,
        },
      ],
    };
  };

  const prepareWeeklyAttendanceData = () => {
    const weeklyData = {};

    attendanceData.forEach((record) => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { present: 0, late: 0, absent: 0 };
      }

      if (record.status === "present") weeklyData[weekKey].present++;
      else if (record.status === "late") weeklyData[weekKey].late++;
      else if (record.status === "absent") weeklyData[weekKey].absent++;
    });

    const weeks = Object.keys(weeklyData).sort();
    const presentData = weeks.map((week) => weeklyData[week].present);
    const lateData = weeks.map((week) => weeklyData[week].late);
    const absentData = weeks.map((week) => weeklyData[week].absent);

    return {
      labels: weeks.map((week) =>
        new Date(week).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      ),
      datasets: [
        {
          label: "Present",
          data: presentData,
          backgroundColor: "rgba(76, 175, 80, 0.6)",
          borderColor: "#4caf50",
          borderWidth: 2,
        },
        {
          label: "Late",
          data: lateData,
          backgroundColor: "rgba(255, 152, 0, 0.6)",
          borderColor: "#ff9800",
          borderWidth: 2,
        },
        {
          label: "Absent",
          data: absentData,
          backgroundColor: "rgba(244, 67, 54, 0.6)",
          borderColor: "#f44336",
          borderWidth: 2,
        },
      ],
    };
  };

  // Show initial loading screen for parent dashboard
  if (userProfile?.role === "parent" && initialLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
        }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress
            size={80}
            sx={{ color: "hsl(152, 65%, 28%)", mb: 3 }}
          />
          <Typography
            variant="h4"
            sx={{ color: "hsl(152, 65%, 28%)", fontWeight: 600, mb: 2 }}>
            Loading Your Dashboard
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              color: "text.secondary",
              mb: 1,
            }}>
            Welcome, {userProfile.firstName || "Parent"}!
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Please wait while we prepare your child's information...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Show admin dashboard content for admin users only */}
      {userProfile?.role !== "parent" && (
        <>
          {/* Welcome Section with Edit Button */}
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
                alignItems: "flex-start",
                mb: 2,
              }}>
              <Box sx={{ flex: 1 }}>
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
                  Welcome,{" "}
                  {userProfile?.firstName ||
                    (userProfile?.role === "teacher" ? "Teacher" : "Admin")}
                  !
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "hsl(220, 60%, 40%)",
                    fontSize: "0.95rem",
                    mb: 2,
                    fontWeight: 500,
                  }}>
                  {currentDateTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {currentDateTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "hsl(220, 60%, 25%)",
                    fontSize: "1.1rem",
                    lineHeight: 1.6,
                  }}>
                  {userProfile?.role === "teacher"
                    ? "Monitor and track the learning progress of all students in your assigned sections. View detailed progress reports and identify areas where additional support may be needed."
                    : "Manage your childcare operations, track child development, and generate comprehensive reports for Kapitbahayan Child Development Center."}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEditDashboard}
                sx={{
                  borderColor: "hsl(152, 65%, 28%)",
                  color: "hsl(152, 65%, 28%)",
                  "&:hover": {
                    borderColor: "hsl(152, 65%, 20%)",
                    backgroundColor: "rgba(31, 120, 80, 0.1)",
                  },
                }}>
                Edit Dashboard
              </Button>
            </Box>
          </Paper>

          {/* Dashboard Cards */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
            <Card
              sx={{
                flex: "1 1 250px",
                minWidth: "250px",
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
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: "auto",
                    mb: 2,
                    background: "linear-gradient(45deg, #4caf50, #8bc34a)",
                  }}>
                  <People sx={{ fontSize: "2rem" }} />
            </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#2e7d32",
                    mb: 1,
                  }}>
                  {loading ? "..." : dashboardStats.totalChildren}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#388e3c",
                  }}>
                  Enrolled Children
                </Typography>
          </CardContent>
        </Card>

            <Card
              sx={{
                flex: "1 1 250px",
                minWidth: "250px",
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
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: "auto",
                    mb: 2,
                    background: "linear-gradient(45deg, #ff9800, #ffc107)",
                  }}>
                  <School sx={{ fontSize: "2rem" }} />
            </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#f57c00",
                    mb: 1,
                  }}>
                  {loading ? "..." : dashboardStats.totalTeachers}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#ef6c00",
                  }}>
                  Teachers
                </Typography>
          </CardContent>
        </Card>

            <Card
              sx={{
                flex: "1 1 250px",
                minWidth: "250px",
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
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: "auto",
                    mb: 2,
                    background: "linear-gradient(45deg, #9c27b0, #e91e63)",
                  }}>
                  <Assessment sx={{ fontSize: "2rem" }} />
            </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#7b1fa2",
                    mb: 1,
                  }}>
                  {loading ? "..." : dashboardStats.totalSkills}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#6a1b9a",
                  }}>
                  Learning Skills
                </Typography>
          </CardContent>
        </Card>

        {/* New Attendance Rate Card */}
            <Card
              sx={{
                flex: "1 1 250px",
                minWidth: "250px",
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
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: "auto",
                    mb: 2,
                    background: "linear-gradient(45deg, #00bcd4, #26c6da)",
                  }}>
                  <CheckCircle sx={{ fontSize: "2rem" }} />
            </Avatar>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#00838f",
                    mb: 1,
                  }}>
                  {loading ? "..." : `${dashboardStats.attendanceRate}%`}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#006064",
                  }}>
                  Today's Attendance Rate
                </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Today's Attendance Section */}
          <Paper
            sx={{
        p: 4, 
        mb: 4,
        mt: 4,
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
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Event sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                  Today's Attendance Overview
                </Typography>
          </Box>
              <IconButton
                onClick={loadDashboardStats}
                disabled={loading}
                size="small">
            <Refresh />
          </IconButton>
        </Box>
        
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2,
              }}>
          {/* Present Students */}
              <Box
                sx={{
                  p: 3,
                  background: "rgba(76, 175, 80, 0.1)",
                  borderRadius: "12px",
                  textAlign: "center",
                }}>
                <CheckCircle
                  sx={{ color: "#4caf50", fontSize: "2rem", mb: 1 }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#2e7d32",
                    mb: 0.5,
                  }}>
              {dashboardStats.todayAttendance.present}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#388e3c",
                    fontWeight: 500,
                  }}>
              Present
            </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#388e3c", opacity: 0.8 }}>
              On time or within grace period
            </Typography>
          </Box>

          {/* Late Students */}
              <Box
                sx={{
                  p: 3,
                  background: "rgba(255, 152, 0, 0.1)",
                  borderRadius: "12px",
                  textAlign: "center",
                }}>
                <Warning sx={{ color: "#ff9800", fontSize: "2rem", mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#f57c00",
                    mb: 0.5,
                  }}>
              {dashboardStats.todayAttendance.late}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#ef6c00",
                    fontWeight: 500,
                  }}>
              Late
            </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#ef6c00", opacity: 0.8 }}>
              After grace period
            </Typography>
          </Box>

          {/* Absent Students */}
              <Box
                sx={{
                  p: 3,
                  background: "rgba(244, 67, 54, 0.1)",
                  borderRadius: "12px",
                  textAlign: "center",
                }}>
                <Info sx={{ color: "#f44336", fontSize: "2rem", mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "#c62828",
                    mb: 0.5,
                  }}>
              {dashboardStats.todayAttendance.absent}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "#d32f2f",
                    fontWeight: 500,
                  }}>
              Absent
            </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#d32f2f", opacity: 0.8 }}>
              No attendance record
            </Typography>
          </Box>

          {/* Total Attendance */}
              <Box
                sx={{
                  p: 3,
                  background: "rgba(31, 120, 80, 0.1)",
                  borderRadius: "12px",
                  textAlign: "center",
                }}>
                <People
                  sx={{ color: "hsl(152, 65%, 28%)", fontSize: "2rem", mb: 1 }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: 700,
                    color: "hsl(152, 65%, 28%)",
                    mb: 0.5,
                  }}>
              {dashboardStats.todayAttendance.total}
            </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    color: "hsl(220, 60%, 25%)",
                    fontWeight: 500,
                  }}>
              Total Records
            </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "hsl(220, 60%, 25%)", opacity: 0.8 }}>
              Students tracked today
            </Typography>
          </Box>
        </Box>
      </Paper>
        </>
      )}

      {/* Parent Dashboard - Only for Parents */}
      {userProfile?.role === "parent" && (
        <>
          {/* Welcome Section for Parents */}
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
                alignItems: "flex-start",
                justifyContent: "space-between",
                mb: 2,
              }}>
              <Box sx={{ flex: 1 }}>
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
                  Welcome, {userProfile.firstName || "Parent"}!
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "hsl(220, 60%, 40%)",
                    fontSize: "0.95rem",
                    mb: 2,
                    fontWeight: 500,
                  }}>
                  {currentDateTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {currentDateTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "hsl(220, 60%, 25%)",
                    fontSize: "1.1rem",
                    lineHeight: 1.6,
                  }}>
                  Track your child's progress and attendance. Stay updated with
                  their learning journey at Kapitbahayan Child Development
                  Center.
                </Typography>
              </Box>
              <IconButton 
                onClick={() => {
                  loadParentProgress();
                  loadAttendanceData();
                }} 
                disabled={parentDashboardLoading}
                size="small"
                sx={{ 
                  color: "hsl(152, 65%, 28%)",
                  "&:hover": { backgroundColor: "rgba(21, 101, 192, 0.1)" },
                }}>
                <Refresh />
              </IconButton>
            </Box>
          </Paper>

          {/* Quick Actions for Parents */}
          <Paper
            sx={{
              p: 3,
              mb: 4,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(15px)",
              border: "2px solid rgba(156, 39, 176, 0.2)",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(156, 39, 176, 0.15)",
            }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                color: "#7b1fa2",
                mb: 2,
              }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <StartChatButton 
                buttonText="Message Teacher" 
                variant="contained" 
                size="medium"
              />
            </Box>
          </Paper>

          {/* Today's Tasks/Requirements Due */}
          <Paper
            sx={{
              p: 3,
              mb: 4,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(15px)",
              border: "2px solid rgba(244, 67, 54, 0.2)",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(244, 67, 54, 0.15)",
            }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Warning sx={{ color: "#f44336", mr: 2, fontSize: 28 }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "#f44336",
                }}>
                Tasks Due Today
              </Typography>
            </Box>
            {todayEvents.filter(
              (event) =>
                event.type === "announcement" &&
                event.description?.toLowerCase().includes("deadline")
            ).length > 0 ? (
              <List>
                {todayEvents
                  .filter(
                    (event) =>
                      event.type === "announcement" &&
                      event.description?.toLowerCase().includes("deadline")
                  )
                  .map((task, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      px: 2,
                      py: 1.5,
                      mb: 1,
                        backgroundColor: "rgba(244, 67, 54, 0.05)",
                        borderRadius: "8px",
                        border: "1px solid rgba(244, 67, 54, 0.2)",
                      }}>
                    <ListItemIcon>
                        <CheckCircle sx={{ color: "#ff9800" }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 600, color: "#d32f2f" }}>
                          {task.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 3,
                  backgroundColor: "rgba(76, 175, 80, 0.05)",
                  borderRadius: "8px",
                }}>
                <CheckCircle sx={{ fontSize: 48, color: "#4caf50", mb: 1 }} />
                <Typography
                  variant="body1"
                  sx={{ color: "#2e7d32", fontWeight: 500 }}>
                  No tasks due today!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You're all caught up
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Enhanced Dashboard Section for Parents */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 3,
              mb: 4,
            }}>
            {/* Left Column: Announcements and Today's Schedule */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Announcements Carousel */}
              {announcements.length > 0 && (
                <Paper
                  sx={{
                    p: 3,
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
                      mb: 2,
                    }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                      }}>
                      <Announcement sx={{ mr: 1, verticalAlign: "middle" }} />
                      Announcements
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton onClick={prevAnnouncement} size="small">
                        <ChevronLeft />
                      </IconButton>
                      <IconButton onClick={nextAnnouncement} size="small">
                        <ChevronRight />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {announcements[currentAnnouncementIndex] && (
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(31, 120, 80, 0.05)",
                        borderRadius: "12px",
                        border: "1px solid rgba(31, 120, 80, 0.1)",
                      }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 600,
                          color: "hsl(152, 65%, 28%)",
                          mb: 1,
                        }}>
                        {announcements[currentAnnouncementIndex].title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "hsl(220, 60%, 25%)", mb: 1 }}>
                        {announcements[currentAnnouncementIndex].description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                        <Chip 
                          label={announcements[currentAnnouncementIndex].type} 
                          size="small" 
                          sx={{
                            backgroundColor: "hsl(152, 65%, 28%)",
                            color: "white",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}>
                          {announcements[currentAnnouncementIndex].date}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    {announcements.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor:
                            index === currentAnnouncementIndex
                              ? "hsl(152, 65%, 28%)"
                              : "rgba(31, 120, 80, 0.3)",
                          margin: "0 4px",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Today's Schedule */}
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Schedule sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                    Today's Schedule
                  </Typography>
                </Box>
                
                {todayEvents.length > 0 ? (
                  <List>
                    {todayEvents.map((event, index) => (
                      <ListItem key={event.id} sx={{ px: 0 }}>
                        <ListItemIcon>{event.icon}</ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary">
                                {event.time}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {event.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No events scheduled for today
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Right Column: Mini Calendar and Upcoming Events */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Mini Calendar */}
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarToday sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                    Calendar
                  </Typography>
                </Box>
                
                {/* Simple Calendar Grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 1,
                    mb: 2,
                  }}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      sx={{
                        textAlign: "center",
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                      }}>
                      {day}
                    </Typography>
                  ))}
                </Box>
                
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 1,
                  }}>
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6 + new Date().getDate();
                    const isCurrentMonth =
                      day > 0 &&
                      day <=
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          0
                        ).getDate();
                    const isToday = day === new Date().getDate();
                    const hasEvents = isCurrentMonth && hasEventsOnDate(day);
                    
                    return (
                      <Box
                        key={i}
                        sx={{
                          height: 32,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          backgroundColor: isToday
                            ? "hsl(152, 65%, 28%)"
                            : "transparent",
                          color: isToday
                            ? "white"
                            : isCurrentMonth
                            ? "text.primary"
                            : "text.disabled",
                          fontWeight: isToday ? 600 : 400,
                          fontSize: "0.875rem",
                          position: "relative",
                        }}>
                        {isCurrentMonth ? day : ""}
                        {hasEvents && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              backgroundColor: isToday
                                ? "white"
                                : "hsl(152, 65%, 28%)",
                              mt: 0.25,
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Upcoming Events */}
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Notifications sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                    Upcoming Events
                  </Typography>
                </Box>
                
                {upcomingEvents.length > 0 ? (
                  <List>
                    {upcomingEvents.slice(0, 5).map((event, index) => (
                      <ListItem key={event.id} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {event.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}>
                              {event.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {event.time}
                              </Typography>
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary">
                                {event.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming events
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>

          {/* Initial Loading State for Parent Dashboard */}
          {parentDashboardLoading &&
            !progressData.parentProgress.length &&
            !attendanceData.length && (
            <Box sx={{ mb: 4 }}>
              {/* Loading Skeleton for Progress Section */}
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
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <School sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                      Your Child's Learning Progress
                    </Typography>
                </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
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
                          fontWeight: 500,
                        }}>
                      Loading your child's progress...
                    </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          color: "text.secondary",
                          mt: 1,
                        }}>
                      Please wait while we fetch the latest data
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Loading Skeleton for Attendance Section */}
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
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <People sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                      Your Child's Attendance
                    </Typography>
                </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      py: 8,
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
                          fontWeight: 500,
                        }}>
                      Loading attendance records...
                    </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          color: "text.secondary",
                          mt: 1,
                        }}>
                      Please wait while we fetch the latest data
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Child's Progress Overview - Only show if not in initial loading */}
          {!(
            parentDashboardLoading &&
            !progressData.parentProgress.length &&
            !attendanceData.length
          ) && (
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
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <School sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                  Your Child's Learning Progress
                </Typography>
              </Box>

              {parentDashboardLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 8,
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
                        fontWeight: 500,
                      }}>
                      Loading your child's progress...
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        color: "text.secondary",
                        mt: 1,
                      }}>
                      Please wait while we fetch the latest data
                    </Typography>
                  </Box>
                </Box>
              ) : progressData &&
                progressData.parentProgress &&
                progressData.parentProgress.length > 0 ? (
              <Box>
                {/* Progress Summary */}
                {progressData.parentProgress.map((student, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 3,
                        p: 3,
                        background: "rgba(76, 175, 80, 0.05)",
                        border: "2px solid rgba(76, 175, 80, 0.2)",
                      }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 2,
                        }}>
                      <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 600,
                              color: "#2e7d32",
                            }}>
                          {student.studentName}
                        </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              color: "#388e3c",
                            }}>
                            {student.sections?.map((s) => s.name).join(", ") ||
                              "No sections assigned"}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${student.averageProgress}% Complete`}
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                      <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
                        <Box sx={{ textAlign: "center", flex: 1 }}>
                          <Typography
                            variant="h4"
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 700,
                              color: "#2e7d32",
                              mb: 1,
                            }}>
                          {student.totalLessons}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Lessons
                        </Typography>
                      </Box>
                        <Box sx={{ textAlign: "center", flex: 1 }}>
                          <Typography
                            variant="h4"
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 700,
                              color: "hsl(152, 65%, 28%)",
                              mb: 1,
                            }}>
                          {student.completedLessons}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Completed
                        </Typography>
                      </Box>
                        <Box sx={{ textAlign: "center", flex: 1 }}>
                          <Typography
                            variant="h4"
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 700,
                              color: "#ff9800",
                              mb: 1,
                            }}>
                          {student.totalLessons - student.completedLessons}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Remaining
                        </Typography>
                      </Box>
                    </Box>

                    {/* Progress Bar */}
                    <LinearProgress
                      variant="determinate"
                      value={student.averageProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                          backgroundColor: "rgba(76, 175, 80, 0.2)",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#4caf50",
                          },
                      }}
                    />
                  </Card>
                ))}
              </Box>
            ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <School
                    sx={{
                      fontSize: 64,
                      color: "rgba(31, 120, 80, 0.3)",
                      mb: 2,
                    }}
                  />
                <Typography variant="h6" color="text.secondary">
                  No progress data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Progress records will appear here as your child completes
                    lessons
                </Typography>
              </Box>
            )}
            </Paper>
          )}

          {/* Child's Attendance Overview - Only show if not in initial loading */}
          {!(
            parentDashboardLoading &&
            !progressData.parentProgress.length &&
            !attendanceData.length
          ) && (
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
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <People sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: "hsl(152, 65%, 28%)" }}>
                  Your Child's Attendance
                </Typography>
              </Box>

              {parentDashboardLoading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    py: 8,
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
                        fontWeight: 500,
                      }}>
                      Loading attendance records...
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        color: "text.secondary",
                        mt: 1,
                      }}>
                      Please wait while we fetch the latest data
                    </Typography>
                  </Box>
                </Box>
              ) : attendanceData && attendanceData.length > 0 ? (
              <Box>
                {/* Attendance Summary */}
                  <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                    <Box
                      sx={{
                    flex: 1, 
                        textAlign: "center",
                        p: 3,
                        background: "rgba(76, 175, 80, 0.1)",
                        borderRadius: "12px",
                        border: "2px solid rgba(76, 175, 80, 0.2)",
                      }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 700,
                          color: "#2e7d32",
                          mb: 1,
                        }}>
                        {
                          attendanceData.filter((a) => a.status === "present")
                            .length
                        }
                    </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          color: "#388e3c",
                          fontWeight: 500,
                        }}>
                      Present
                    </Typography>
                  </Box>
                    <Box
                      sx={{
                    flex: 1, 
                        textAlign: "center",
                        p: 3,
                        background: "rgba(255, 152, 0, 0.1)",
                        borderRadius: "12px",
                        border: "2px solid rgba(255, 152, 0, 0.2)",
                      }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 700,
                          color: "#f57c00",
                          mb: 1,
                        }}>
                        {
                          attendanceData.filter((a) => a.status === "late")
                            .length
                        }
                    </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          color: "#ef6c00",
                          fontWeight: 500,
                        }}>
                      Late
                    </Typography>
                  </Box>
                    <Box
                      sx={{
                    flex: 1, 
                        textAlign: "center",
                        p: 3,
                        background: "rgba(244, 67, 54, 0.1)",
                        borderRadius: "12px",
                        border: "2px solid rgba(244, 67, 54, 0.2)",
                      }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 700,
                          color: "#c62828",
                          mb: 1,
                        }}>
                        {
                          attendanceData.filter((a) => a.status === "absent")
                            .length
                        }
                    </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          color: "#d32f2f",
                          fontWeight: 500,
                        }}>
                      Absent
                    </Typography>
                  </Box>
                </Box>

                {/* Recent Attendance Records */}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                  Recent Attendance Records
                </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{ background: "rgba(255, 255, 255, 0.8)" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
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
                            Time In
                          </TableCell>
                          <TableCell
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 600,
                            }}>
                            Time Out
                          </TableCell>
                          <TableCell
                            sx={{
                              fontFamily: "Plus Jakarta Sans, sans-serif",
                              fontWeight: 600,
                            }}>
                            Status
                          </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceData.slice(0, 10).map((record, index) => (
                        <TableRow key={index}>
                          <TableCell>{record.date}</TableCell>
                            <TableCell>{record.timeIn || "-"}</TableCell>
                            <TableCell>{record.timeOut || "-"}</TableCell>
                          <TableCell>
                            <Chip
                              label={record.status}
                                color={
                                  record.status === "present"
                                    ? "success"
                                    : record.status === "late"
                                    ? "warning"
                                    : "error"
                                }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <People
                    sx={{
                      fontSize: 64,
                      color: "rgba(31, 120, 80, 0.3)",
                      mb: 2,
                    }}
                  />
                <Typography variant="h6" color="text.secondary">
                  No attendance records available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Attendance records will appear here once your child starts
                    attending
                </Typography>
              </Box>
            )}
            </Paper>
          )}
        </>
      )}

      {/* Parent Progress Section - For Admin and Teachers */}
      {(userProfile?.role === "teacher" || userProfile?.role === "admin") && (
        <>
          {/* Enhanced Dashboard Section for Teachers */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 3,
              mb: 4,
            }}>
            {/* Left Column: Announcements and Today's Schedule */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Announcements Carousel */}
              {announcements.length > 0 && (
                <Paper
                  sx={{
                    p: 3,
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
                      mb: 2,
                    }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                      }}>
                      <Announcement sx={{ mr: 1, verticalAlign: "middle" }} />
                      Announcements
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton onClick={prevAnnouncement} size="small">
                        <ChevronLeft />
                      </IconButton>
                      <IconButton onClick={nextAnnouncement} size="small">
                        <ChevronRight />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {announcements[currentAnnouncementIndex] && (
                    <Box
                      sx={{
                        p: 2,
                        backgroundColor: "rgba(31, 120, 80, 0.05)",
                        borderRadius: "12px",
                        border: "1px solid rgba(31, 120, 80, 0.1)",
                      }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 600,
                          color: "hsl(152, 65%, 28%)",
                          mb: 1,
                        }}>
                        {announcements[currentAnnouncementIndex].title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "hsl(220, 60%, 25%)", mb: 1 }}>
                        {announcements[currentAnnouncementIndex].description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                        <Chip 
                          label={announcements[currentAnnouncementIndex].type} 
                          size="small" 
                          sx={{
                            backgroundColor: "hsl(152, 65%, 28%)",
                            color: "white",
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}>
                          {announcements[currentAnnouncementIndex].date}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    {announcements.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor:
                            index === currentAnnouncementIndex
                              ? "hsl(152, 65%, 28%)"
                              : "rgba(31, 120, 80, 0.3)",
                          margin: "0 4px",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              )}

              {/* Today's Schedule */}
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Schedule sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                    Today's Schedule
                  </Typography>
                </Box>
                
                {todayEvents.length > 0 ? (
                  <List>
                    {todayEvents.map((event, index) => (
                      <ListItem key={event.id} sx={{ px: 0 }}>
                        <ListItemIcon>{event.icon}</ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary">
                                {event.time}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {event.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No events scheduled for today
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>

            {/* Right Column: Mini Calendar and Upcoming Events */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Mini Calendar */}
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarToday sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                    Calendar
                  </Typography>
                </Box>
                
                {/* Simple Calendar Grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 1,
                    mb: 2,
                  }}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <Typography
                      key={index}
                      variant="caption"
                      sx={{
                        textAlign: "center",
                        fontWeight: 600,
                        color: "hsl(152, 65%, 28%)",
                      }}>
                      {day}
                    </Typography>
                  ))}
                </Box>
                
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 1,
                  }}>
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 6 + new Date().getDate();
                    const isCurrentMonth =
                      day > 0 &&
                      day <=
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          0
                        ).getDate();
                    const isToday = day === new Date().getDate();
                    const hasEvents = isCurrentMonth && hasEventsOnDate(day);
                    
                    return (
                      <Box
                        key={i}
                        sx={{
                          height: 32,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          backgroundColor: isToday
                            ? "hsl(152, 65%, 28%)"
                            : "transparent",
                          color: isToday
                            ? "white"
                            : isCurrentMonth
                            ? "text.primary"
                            : "text.disabled",
                          fontWeight: isToday ? 600 : 400,
                          fontSize: "0.875rem",
                          position: "relative",
                        }}>
                        {isCurrentMonth ? day : ""}
                        {hasEvents && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              backgroundColor: isToday
                                ? "white"
                                : "hsl(152, 65%, 28%)",
                              mt: 0.25,
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              {/* Upcoming Events */}
              <Paper
                sx={{
                  p: 3,
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(15px)",
                  border: "2px solid rgba(31, 120, 80, 0.2)",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
                }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Notifications sx={{ color: "hsl(152, 65%, 28%)", mr: 2 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 600,
                      color: "hsl(152, 65%, 28%)",
                    }}>
                    Upcoming Events
                  </Typography>
                </Box>
                
                {upcomingEvents.length > 0 ? (
                  <List>
                    {upcomingEvents.slice(0, 5).map((event, index) => (
                      <ListItem key={event.id} sx={{ px: 0, py: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {event.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}>
                              {event.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {event.time}
                              </Typography>
                              <Typography
                                variant="caption"
                                display="block"
                                color="text.secondary">
                                {event.description}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: "center", py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No upcoming events
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </>
      )}

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

      {/* Detailed Progress Dialog */}
      <DetailedProgressDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        studentData={fullUserData}
        loading={loadingUserData}
      />

      {/* Dashboard Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCancelEdit}
        maxWidth="sm"
        fullWidth>
        <DialogTitle
          sx={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            color: "hsl(152, 65%, 28%)",
          }}>
          Customize Dashboard
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose which sections to display on your dashboard. You can always
            change these settings later.
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={dashboardSettings.showMiniCalendar}
                  onChange={(e) =>
                    setDashboardSettings((prev) => ({
                      ...prev,
                      showMiniCalendar: e.target.checked,
                    }))
                  }
                />
              }
              label="Show Mini Calendar"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dashboardSettings.showAnnouncementsCarousel}
                  onChange={(e) =>
                    setDashboardSettings((prev) => ({
                      ...prev,
                      showAnnouncementsCarousel: e.target.checked,
                    }))
                  }
                />
              }
              label="Show Announcements Carousel"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dashboardSettings.showTodaySchedule}
                  onChange={(e) =>
                    setDashboardSettings((prev) => ({
                      ...prev,
                      showTodaySchedule: e.target.checked,
                    }))
                  }
                />
              }
              label="Show Today's Schedule"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dashboardSettings.showUpcomingEvents}
                  onChange={(e) =>
                    setDashboardSettings((prev) => ({
                      ...prev,
                      showUpcomingEvents: e.target.checked,
                    }))
                  }
                />
              }
              label="Show Upcoming Events"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={dashboardSettings.showProgressSnapshot}
                  onChange={(e) =>
                    setDashboardSettings((prev) => ({
                      ...prev,
                      showProgressSnapshot: e.target.checked,
                    }))
                  }
                />
              }
              label="Show Progress Snapshot"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancel</Button>
          <Button
            onClick={handleSaveDashboardSettings}
            variant="contained"
            sx={{
              background:
                "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              "&:hover": {
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 20%), hsl(145, 60%, 30%))",
              },
            }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardContent;
