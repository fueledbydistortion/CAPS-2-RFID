import React, { useState } from 'react'
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography,
  Avatar,
  Paper,
  Collapse,
  Divider
} from '@mui/material'
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People,
  Schedule,
  Book,
  School,
  Person,
  ExitToApp,
  CheckCircle,
  Assessment,
  CalendarToday,
  EmojiEvents,
  BarChart,
  ExpandLess,
  ExpandMore,
  Message,
  Settings
} from '@mui/icons-material'
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import Swal from 'sweetalert2'
import logo from '../assets/logo.png'
import { useAuth } from '../contexts/AuthContext'
import { useAuthActions } from '../hooks/useAuthActions'

// Import content components
import DashboardContent from './DashboardContent'
import UsersContent from './UsersContent'
import SchedulesContent from './SchedulesContent'
import ClassScheduleContent from './ClassScheduleContent'
import SkillsContent from './SkillsContent'
import SkillDetailContent from './SkillDetailContent'
import SectionsContent from './SectionsContent'
import AttendanceContent from './AttendanceContent'
import ParentSchedulesContent from './ParentSchedulesContent'
import ParentSectionContent from './ParentSectionContent'
import MyStudentPage from './MyStudentPage'
import CalendarContent from './CalendarContent'
import BadgesPage from './BadgesPage'
import ReportsPage from './ReportsPage'
import NotificationSettingsPage from './NotificationSettingsPage'
import StudentsPage from './StudentsPage'
import MessagingPage from './MessagingPage'
import NotificationDropdown from '../components/NotificationDropdown'

const drawerWidth = 280

function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [openGroups, setOpenGroups] = useState({
    management: false,
    academic: false,
    communication: false
  })
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, userProfile } = useAuth()
  const { logout } = useAuthActions()

  // Get current active menu based on route
  const getActiveMenu = () => {
    if (location.pathname === '/dashboard') return 'Dashboard'
    if (location.pathname === '/dashboard/users') return 'Users'
    if (location.pathname === '/dashboard/students') return 'Students'
    if (location.pathname === '/dashboard/my-student') return 'My Student'
    if (location.pathname === '/dashboard/schedules') return 'Schedules'
    if (location.pathname === '/dashboard/parent-schedules') return 'My Schedules'
    if (location.pathname === '/dashboard/parent-content') return 'Learning Content'
    if (location.pathname === '/dashboard/skills') return 'Lessons'
    if (location.pathname === '/dashboard/sections') return 'Sections'
    if (location.pathname === '/dashboard/attendance') return 'Attendance'
    if (location.pathname === '/dashboard/calendar') return 'Calendar'
    if (location.pathname === '/dashboard/badges') return 'Badges'
    if (location.pathname === '/dashboard/reports') return 'Reports'
    if (location.pathname === '/dashboard/messaging') return 'Messaging'
    if (location.pathname === '/dashboard/notification-settings') return 'Notification Settings'
    return 'Dashboard'
  }

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Smart Child Care Dashboard'
    if (location.pathname === '/dashboard/users') return 'Smart Child Care - Users Module'
    if (location.pathname === '/dashboard/students') return 'Smart Child Care - Students Module'
    if (location.pathname === '/dashboard/my-student') return 'Smart Child Care - My Student'
    if (location.pathname === '/dashboard/schedules') return 'Smart Child Care - Schedules Module'
    if (location.pathname === '/dashboard/parent-schedules') return 'Smart Child Care - My Schedules'
    if (location.pathname === '/dashboard/parent-content') return 'Smart Child Care - Learning Content'
    if (location.pathname === '/dashboard/skills') return 'Smart Child Care - Lessons Module'
    if (location.pathname === '/dashboard/sections') return 'Smart Child Care - Sections Module'
    if (location.pathname === '/dashboard/attendance') return 'Smart Child Care - Attendance Module'
    if (location.pathname === '/dashboard/calendar') {
      return userProfile?.role === 'parent' 
        ? 'Smart Child Care - My Child\'s Calendar' 
        : 'Smart Child Care - Calendar Module'
    }
    if (location.pathname === '/dashboard/badges') return 'Smart Child Care - Badges Module'
    if (location.pathname === '/dashboard/reports') return 'Smart Child Care - Reports Module'
    if (location.pathname === '/dashboard/messaging') return 'Smart Child Care - Messaging Module'
    if (location.pathname === '/dashboard/notification-settings') return 'Smart Child Care - Notification Settings'
    return 'Smart Child Care Dashboard'
  }

  const activeMenu = getActiveMenu()

  const handleDrawerClose = () => {
    setIsClosing(true)
    setMobileOpen(false)
  }

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false)
  }

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen)
    }
  }

  const handleLogout = async () => {
    // Close mobile sidebar when logout is clicked
    setMobileOpen(false)
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of the system",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'hsl(152, 65%, 28%)',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel',
      background: 'rgba(255, 255, 255, 0.95)',
      backdrop: 'rgba(0, 0, 0, 0.4)',
      customClass: {
        popup: 'swal2-custom-popup',
        confirmButton: 'swal2-custom-confirm',
        cancelButton: 'swal2-custom-cancel'
      }
    })

    if (result.isConfirmed) {
      const logoutResult = await logout()
      
      if (!logoutResult.success) {
        Swal.fire({
          title: 'Logout Error',
          text: logoutResult.error || 'Failed to logout. Please try again.',
          icon: 'error',
          background: 'rgba(255, 255, 255, 0.95)',
          backdrop: 'rgba(0, 0, 0, 0.4)'
        })
      }
    }
  }

  const handleMenuClick = (menuText) => {
    // Close mobile sidebar when menu item is clicked
    setMobileOpen(false)
    
    switch (menuText) {
      case 'Dashboard':
        navigate('/dashboard')
        break
      case 'Users':
        navigate('/dashboard/users')
        break
      case 'Students':
        navigate('/dashboard/students')
        break
      case 'Schedules':
        navigate('/dashboard/schedules')
        break
      case 'My Student':
        navigate('/dashboard/my-student')
        break
      case 'My Schedules':
        navigate('/dashboard/parent-schedules')
        break
      case 'Learning Content':
        navigate('/dashboard/parent-content')
        break
      case 'Lessons':
        navigate('/dashboard/skills')
        break
      case 'Sections':
        navigate('/dashboard/sections')
        break
      case 'Attendance':
        navigate('/dashboard/attendance')
        break
      case 'Calendar':
        navigate('/dashboard/calendar')
        break
      case 'Badges':
        navigate('/dashboard/badges')
        break
      case 'Reports':
        navigate('/dashboard/reports')
        break
      case 'Messaging':
        navigate('/dashboard/messaging')
        break
      case 'Notification Settings':
        navigate('/dashboard/notification-settings')
        break
      default:
        navigate('/dashboard')
    }
  }

  const handleGroupToggle = (group) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  // Define all menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { text: 'Dashboard', icon: <DashboardIcon />, active: activeMenu === 'Dashboard' }
    ];

    if (userProfile?.role === 'parent') {
      return [
        ...baseItems,
        { text: 'My Student', icon: <Person />, active: activeMenu === 'My Student' },
        { text: 'My Schedules', icon: <Schedule />, active: activeMenu === 'My Schedules' },
        { text: 'Calendar', icon: <CalendarToday />, active: activeMenu === 'Calendar' },
        { text: 'Learning Content', icon: <Book />, active: activeMenu === 'Learning Content' },
        { text: 'Messaging', icon: <Message />, active: activeMenu === 'Messaging' },
        { text: 'Badges', icon: <EmojiEvents />, active: activeMenu === 'Badges' },
        { text: 'Notification Settings', icon: <Settings />, active: activeMenu === 'Notification Settings' }
      ];
    } else {
      // Reorganized menu items in requested order: Dashboard, Users, Students, Sections, Schedules, Calendar, Attendance, Skills, Messaging, Reports
      const menuGroups = {
        main: [
          { text: 'Dashboard', icon: <DashboardIcon />, active: activeMenu === 'Dashboard' }
        ],
        management: [
          { text: 'Users', icon: <People />, active: activeMenu === 'Users' },
          { text: 'Students', icon: <Person />, active: activeMenu === 'Students' },
          { text: 'Sections', icon: <School />, active: activeMenu === 'Sections' }
        ],
        academic: [
          { text: 'Schedules', icon: <Schedule />, active: activeMenu === 'Schedules' },
          { text: 'Calendar', icon: <CalendarToday />, active: activeMenu === 'Calendar' },
          { text: 'Attendance', icon: <CheckCircle />, active: activeMenu === 'Attendance' },
          { text: 'Lessons', icon: <Book />, active: activeMenu === 'Lessons' }
        ],
        communication: [
          { text: 'Messaging', icon: <Message />, active: activeMenu === 'Messaging' },
          { text: 'Reports', icon: <BarChart />, active: activeMenu === 'Reports' },
          { text: 'Notification Settings', icon: <Settings />, active: activeMenu === 'Notification Settings' }
        ]
      };

      // Both admin and teacher get the same menu items
      // Only filter out Students and Reports for other roles
      if (userProfile?.role !== 'admin' && userProfile?.role !== 'teacher') {
        menuGroups.management = menuGroups.management.filter(item => item.text !== 'Students');
        menuGroups.communication = menuGroups.communication.filter(item => item.text !== 'Reports');
      }

      return menuGroups;
    }
  };

  const allMenuItems = getMenuItems()

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!userProfile) return allMenuItems

    // Both admin and teacher get exactly the same menu structure
    if (userProfile.role === 'teacher' || userProfile.role === 'admin') {
      return allMenuItems
    }

    // For other roles (parent, etc.), show appropriate items
    return allMenuItems
  }

  const menuItems = getFilteredMenuItems()

  // Component for unauthorized access
  const UnauthorizedAccess = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '50vh',
      textAlign: 'center'
    }}>
      <Typography variant="h4" sx={{ color: 'hsl(152, 65%, 28%)', mb: 2, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}>
        Access Denied
      </Typography>
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        You don't have permission to access this page.
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Please contact your administrator if you believe this is an error.
      </Typography>
    </Box>
  )

  // Check if user can access a specific route
  const canAccessRoute = (routePath) => {
    if (!userProfile) return true // Allow access while loading

    // My Student page is only for parents
    if (routePath === '/my-student' && userProfile.role !== 'parent') {
      return false
    }

    // Badges page is only for parents
    if (routePath === '/badges' && userProfile.role !== 'parent') {
      return false
    }

    // Reports page is for both admin and teacher
    if (routePath === '/reports' && userProfile.role !== 'admin' && userProfile.role !== 'teacher') {
      return false
    }

    // Students page is for both admin and teacher
    if (routePath === '/students' && userProfile.role !== 'admin' && userProfile.role !== 'teacher') {
      return false
    }

    // Calendar is accessible to all roles (admin, teacher, parent)
    if (routePath === '/calendar') {
      return true
    }

    // All other routes are accessible to both admin and teacher
    // Restrictions are handled within individual components
    return true
  }

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(180deg, hsl(152, 65%, 28%) 0%, hsl(145, 60%, 40%) 100%)',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* Logo and Title Section */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)'
      }}>
        <Box
          component="img"
          src={logo}
          alt="Smart Child Care Logo"
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 2,
            objectFit: 'contain',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            background: 'white',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            color: 'white',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            mb: 0.5
          }}
        >
          Smart Child Care
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            display: 'block',
            fontSize: '0.875rem',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 500
          }}
        >
          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Admin Dashboard'}
        </Typography>
        {userProfile && (
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'block',
              fontSize: '0.8rem',
              textTransform: 'capitalize',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 500
            }}
          >
            {userProfile.role}
          </Typography>
        )}
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ 
        flexGrow: 1, 
        py: 2, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100%'
      }}>
        <List sx={{ pb: 2, width: '100%', maxWidth: '100%' }}>
          {userProfile?.role === 'parent' ? (
            // Parent menu (flat structure)
            menuItems.map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5, mx: 1, width: '100%' }}>
                <ListItemButton
                  onClick={() => handleMenuClick(item.text)}
                  sx={{
                    backgroundColor: item.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                    color: 'white',
                    py: 1.5,
                    px: 2,
                    borderRadius: '12px',
                    width: '100%',
                    minWidth: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: 'white'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'white',
                    minWidth: 40
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      color: 'white',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      '& .MuiTypography-root': {
                        color: 'white',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '1rem',
                        fontWeight: item.active ? 600 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            // Admin/Teacher menu (grouped structure)
            <>
              {/* Main Items */}
              {menuItems.main?.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5, mx: 1, width: '100%' }}>
                  <ListItemButton
                    onClick={() => handleMenuClick(item.text)}
                    sx={{
                      backgroundColor: item.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      color: 'white',
                      py: 1.5,
                      px: 2,
                      borderRadius: '12px',
                      width: '100%',
                      minWidth: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: 'white'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: 'white',
                      minWidth: 40
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      sx={{ 
                        color: 'white',
                        '& .MuiTypography-root': {
                          color: 'white',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: '1rem',
                          fontWeight: item.active ? 600 : 500
                        }
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}

              {/* Management Group */}
              {menuItems.management && menuItems.management.length > 0 && (
                <>
                  <Divider sx={{ my: 2, mx: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                  <ListItem disablePadding sx={{ mx: 1, width: '100%' }}>
                    <ListItemButton
                      onClick={() => handleGroupToggle('management')}
                      sx={{
                        color: 'white',
                        py: 1,
                        px: 2,
                        borderRadius: '12px',
                        width: '100%',
                        minWidth: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ListItemText 
                        primary="Management" 
                        sx={{ 
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          '& .MuiTypography-root': {
                            color: 'white',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }} 
                      />
                      {openGroups.management ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={openGroups.management} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {menuItems.management.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5, mx: 1, width: '100%' }}>
                          <ListItemButton
                            onClick={() => handleMenuClick(item.text)}
                            sx={{
                              backgroundColor: item.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                              color: 'white',
                              py: 1.2,
                              px: 3,
                              borderRadius: '10px',
                              ml: 2,
                              width: '100%',
                              minWidth: 0,
                              maxWidth: 'calc(100% - 16px)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                color: 'white'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <ListItemIcon sx={{ 
                              color: 'white',
                              minWidth: 35
                            }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text} 
                              sx={{ 
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                '& .MuiTypography-root': {
                                  color: 'white',
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: '0.95rem',
                                  fontWeight: item.active ? 600 : 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }} 
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              )}

              {/* Academic Group */}
              {menuItems.academic && menuItems.academic.length > 0 && (
                <>
                  <Divider sx={{ my: 2, mx: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                  <ListItem disablePadding sx={{ mx: 1, width: '100%' }}>
                    <ListItemButton
                      onClick={() => handleGroupToggle('academic')}
                      sx={{
                        color: 'white',
                        py: 1,
                        px: 2,
                        borderRadius: '12px',
                        width: '100%',
                        minWidth: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ListItemText 
                        primary="Academic" 
                        sx={{ 
                          color: 'white',
                          '& .MuiTypography-root': {
                            color: 'white',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }
                        }} 
                      />
                      {openGroups.academic ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={openGroups.academic} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {menuItems.academic.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5, mx: 1, width: '100%' }}>
                          <ListItemButton
                            onClick={() => handleMenuClick(item.text)}
                            sx={{
                              backgroundColor: item.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                              color: 'white',
                              py: 1.2,
                              px: 3,
                              borderRadius: '10px',
                              ml: 2,
                              width: '100%',
                              minWidth: 0,
                              maxWidth: 'calc(100% - 16px)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                color: 'white'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <ListItemIcon sx={{ 
                              color: 'white',
                              minWidth: 35
                            }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text} 
                              sx={{ 
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                '& .MuiTypography-root': {
                                  color: 'white',
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: '0.95rem',
                                  fontWeight: item.active ? 600 : 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }} 
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              )}

              {/* Communication Group */}
              {menuItems.communication && menuItems.communication.length > 0 && (
                <>
                  <Divider sx={{ my: 2, mx: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
                  <ListItem disablePadding sx={{ mx: 1 }}>
                    <ListItemButton
                      onClick={() => handleGroupToggle('communication')}
                      sx={{
                        color: 'white',
                        py: 1,
                        px: 2,
                        borderRadius: '12px',
                        width: '100%',
                        minWidth: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ListItemText 
                        primary="Communication" 
                        sx={{ 
                          color: 'white',
                          '& .MuiTypography-root': {
                            color: 'white',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }
                        }} 
                      />
                      {openGroups.communication ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={openGroups.communication} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {menuItems.communication.map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5, mx: 1, width: '100%' }}>
                          <ListItemButton
                            onClick={() => handleMenuClick(item.text)}
                            sx={{
                              backgroundColor: item.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                              color: 'white',
                              py: 1.2,
                              px: 3,
                              borderRadius: '10px',
                              ml: 2,
                              width: '100%',
                              minWidth: 0,
                              maxWidth: 'calc(100% - 16px)',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                color: 'white'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <ListItemIcon sx={{ 
                              color: 'white',
                              minWidth: 35
                            }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text} 
                              sx={{ 
                                color: 'white',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                '& .MuiTypography-root': {
                                  color: 'white',
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: '0.95rem',
                                  fontWeight: item.active ? 600 : 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }
                              }} 
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              )}
            </>
          )}
        </List>
      </Box>

      {/* Logout Section */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)', mt: 'auto' }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            color: 'white',
            py: 1.5,
            px: 2,
            borderRadius: '12px',
            backgroundColor: 'hsl(38, 92%, 50%)',
            '&:hover': {
              backgroundColor: 'hsl(38, 92%, 45%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            sx={{ 
              color: 'white',
              '& .MuiTypography-root': {
                color: 'white',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '1rem',
                fontWeight: 600
              }
            }} 
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  const container = window !== undefined ? () => window.document.body : undefined

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          borderBottom: '2px solid rgba(31, 120, 80, 0.2)',
          boxShadow: '0 4px 20px rgba(31, 120, 80, 0.15)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="primary"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                color: 'hsl(152, 65%, 28%)'
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{
                fontWeight: 700,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Notification Dropdown */}
            <NotificationDropdown onUnreadCountChange={setUnreadNotifications} />

            {/* User Avatar */}
            <Avatar
              sx={{
                background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                cursor: 'pointer'
              }}
            >
              {userProfile ? (
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {userProfile.firstName ? userProfile.firstName.charAt(0).toUpperCase() : 'U'}
                </Typography>
              ) : (
                <Person />
              )}
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="dashboard navigation"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'linear-gradient(180deg, hsl(152, 65%, 28%) 0%, hsl(145, 60%, 40%) 100%)',
              borderRadius: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            },
          }}
          slotProps={{
            root: {
              keepMounted: true,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: 'linear-gradient(180deg, hsl(152, 65%, 28%) 0%, hsl(145, 60%, 40%) 100%)',
              borderRadius: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: 'hsl(210, 20%, 98%)',
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        
        {/* Nested Routes for Dashboard Content */}
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="/users" element={canAccessRoute('/users') ? <UsersContent /> : <UnauthorizedAccess />} />
          <Route path="/students" element={canAccessRoute('/students') ? <StudentsPage /> : <UnauthorizedAccess />} />
          <Route path="/my-student" element={canAccessRoute('/my-student') ? <MyStudentPage /> : <UnauthorizedAccess />} />
          <Route path="/schedules" element={<ClassScheduleContent />} />
          <Route path="/calendar" element={<CalendarContent />} />
          <Route path="/parent-schedules" element={<ParentSchedulesContent />} />
          <Route path="/parent-content" element={<ParentSectionContent />} />
          <Route path="/skills" element={canAccessRoute('/skills') ? <SkillsContent /> : <UnauthorizedAccess />} />
          <Route path="/skill-detail" element={canAccessRoute('/skills') ? <SkillDetailContent /> : <UnauthorizedAccess />} />
          <Route path="/sections" element={canAccessRoute('/sections') ? <SectionsContent /> : <UnauthorizedAccess />} />
          <Route path="/attendance" element={<AttendanceContent />} />
          <Route path="/badges" element={canAccessRoute('/badges') ? <BadgesPage /> : <UnauthorizedAccess />} />
          <Route path="/reports" element={canAccessRoute('/reports') ? <ReportsPage /> : <UnauthorizedAccess />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/notification-settings" element={<NotificationSettingsPage />} />
        </Routes>

      </Box>
    </Box>
  )
}

export default Dashboard
