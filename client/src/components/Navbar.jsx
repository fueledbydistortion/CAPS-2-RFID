import {
  ContactMail,
  Home,
  Info,
  Menu as MenuIcon,
  Person,
  QrCode,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";
import RFIDScannerModal from "./RFIDScannerModal";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rfidModalOpen, setRfidModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const { userProfile } = useAuth();

  const handleStartAttendance = () => {
    // Check if user is teacher or admin
   setRfidModalOpen(true);
  };

  const navItems = [
    { text: "Home", path: "/", icon: <Home /> },
    { text: "About", path: "/about", icon: <Info /> },
    { text: "Contact", path: "/contact", icon: <ContactMail /> },
    {
      text: "Start Attendance",
      path: null,
      icon: <QrCode />,
      onClick: handleStartAttendance,
    },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleRFIDScanSuccess = (result) => {
    setRfidModalOpen(false);
    setSnackbar({
      open: true,
      message: result.message || "Attendance recorded successfully!",
      severity: result.success ? "success" : "error",
    });
  };

  const drawer = (
    <Box sx={{ width: 250, pt: 2 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            mx: "auto",
            mb: 2,
            background:
              "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
            boxShadow: "0 4px 20px rgba(31, 120, 80, 0.4)",
          }}>
          <img
            src={logo}
            alt="Smart Child Care Logo"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </Avatar>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontFamily: "Plus Jakarta Sans, sans-serif",
            color: "hsl(152, 65%, 28%)",
            background:
              "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
          Smart Child Care
        </Typography>
      </Box>

      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.text}
            component={item.path ? Link : "div"}
            to={item.path}
            onClick={
              item.onClick || (item.path ? handleDrawerToggle : undefined)
            }
            sx={{
              color: isActive(item.path)
                ? "hsl(152, 65%, 28%)"
                : "hsl(220, 60%, 25%)",
              backgroundColor: isActive(item.path)
                ? "rgba(31, 120, 80, 0.1)"
                : "transparent",
              borderRadius: "12px",
              mx: 1,
              mb: 1,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "rgba(31, 120, 80, 0.1)",
                color: "hsl(152, 65%, 28%)",
              },
              transition: "all 0.3s ease",
            }}>
            <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
              {item.icon}
            </Box>
            <ListItemText
              primary={item.text}
              sx={{
                fontWeight: isActive(item.path) ? 600 : 400,
                "& .MuiTypography-root": {
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                },
              }}
            />
          </ListItem>
        ))}

        <Box sx={{ mt: 2, px: 2 }}>
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            fullWidth
            startIcon={<Person />}
            sx={{
              mb: 2,
              color: "hsl(152, 65%, 28%)",
              borderColor: "hsl(152, 65%, 28%)",
              borderRadius: "25px",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              "&:hover": {
                borderColor: "hsl(220, 60%, 25%)",
                backgroundColor: "rgba(31, 120, 80, 0.1)",
              },
            }}>
            Login
          </Button>

          {/* <Button
            component={Link}
            to="/signup"
            variant="contained"
            fullWidth
            startIcon={<Lock />}
            sx={{
              background: 'linear-gradient(45deg, #2196f3, #00bcd4)',
              borderRadius: '25px',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976d2, #0097a7)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
              }
            }}
          >
            Sign Up
          </Button> */}
        </Box>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          borderBottom: "2px solid rgba(31, 120, 80, 0.2)",
          boxShadow: "0 4px 20px rgba(31, 120, 80, 0.15)",
        }}
        data-aos="fade-down"
        data-aos-delay="100">
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                width: 45,
                height: 45,
                mr: 2,
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                boxShadow: "0 4px 15px rgba(31, 120, 80, 0.4)",
              }}>
              <img
                src={logo}
                alt="Smart Child Care Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: "Plus Jakarta Sans, sans-serif",
                background:
                  "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: { xs: "none", sm: "block" },
              }}>
              Smart Child Care
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  component={item.path ? Link : "button"}
                  to={item.path}
                  onClick={item.onClick}
                  startIcon={item.icon}
                  sx={{
                    color: isActive(item.path)
                      ? "hsl(152, 65%, 28%)"
                      : "hsl(220, 60%, 25%)",
                    backgroundColor: isActive(item.path)
                      ? "rgba(31, 120, 80, 0.1)"
                      : "transparent",
                    borderRadius: "20px",
                    px: 3,
                    py: 1,
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    fontWeight: isActive(item.path) ? 600 : 500,
                    "&:hover": {
                      backgroundColor: "rgba(31, 120, 80, 0.1)",
                      color: "hsl(152, 65%, 28%)",
                      transform: "translateY(-2px)",
                    },
                    transition: "all 0.3s ease",
                  }}>
                  {item.text}
                </Button>
              ))}

              <Button
                component={Link}
                to="/login"
                variant="outlined"
                startIcon={<Person />}
                sx={{
                  color: "hsl(152, 65%, 28%)",
                  borderColor: "hsl(152, 65%, 28%)",
                  borderRadius: "25px",
                  px: 3,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "hsl(220, 60%, 25%)",
                    backgroundColor: "rgba(31, 120, 80, 0.1)",
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}>
                Login
              </Button>

              {/* <Button
                component={Link}
                to="/signup"
                variant="contained"
                startIcon={<Lock />}
                sx={{
                  background: 'linear-gradient(45deg, #2196f3, #00bcd4)',
                  borderRadius: '25px',
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2, #0097a7)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Sign Up
              </Button> */}
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="primary"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                color: "hsl(152, 65%, 28%)",
                "&:hover": {
                  backgroundColor: "rgba(31, 120, 80, 0.1)",
                },
              }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 250,
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(15px)",
            borderRight: "2px solid rgba(31, 120, 80, 0.2)",
          },
        }}>
        {drawer}
      </Drawer>

      {/* RFID Scanner Modal */}
      <RFIDScannerModal
        open={rfidModalOpen}
        onClose={() => setRfidModalOpen(false)}
        onScanSuccess={handleRFIDScanSuccess}
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
          sx={{ width: "100%", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;
