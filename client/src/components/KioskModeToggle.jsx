import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  TouchApp as KioskIcon,
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useKiosk } from "../contexts/KioskContext";
import { getAllSchedules } from "../utils/scheduleService";

const KioskModeToggle = () => {
  const { userProfile } = useAuth();
  const {
    kioskMode,
    kioskSession,
    loading,
    enableKioskMode,
    disableKioskMode,
    getKioskUrl,
  } = useKiosk();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Only show for teachers and admins
  if (
    !userProfile ||
    (userProfile.role !== "teacher" && userProfile.role !== "admin")
  ) {
    return null;
  }

  const handleToggleClick = () => {
    if (kioskMode) {
      handleDisableKiosk();
    } else {
      setDialogOpen(true);
      loadSchedules();
    }
  };

  const loadSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const result = await getAllSchedules();
      if (result.success) {
        setSchedules(result.data);
      } else {
        showSnackbar("Error loading schedules: " + result.error, "error");
      }
    } catch (error) {
      showSnackbar("Error loading schedules: " + error.message, "error");
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleEnableKiosk = async () => {
    if (!selectedSchedule) {
      showSnackbar("Please select a schedule", "warning");
      return;
    }

    const result = await enableKioskMode(selectedSchedule);
    if (result.success) {
      setDialogOpen(false);
      showSnackbar("Kiosk mode enabled successfully!", "success");
    } else {
      showSnackbar("Error enabling kiosk mode: " + result.error, "error");
    }
  };

  const handleDisableKiosk = async () => {
    const result = await disableKioskMode();
    if (result.success) {
      showSnackbar("Kiosk mode disabled successfully!", "success");
    } else {
      showSnackbar("Error disabling kiosk mode: " + result.error, "error");
    }
  };

  const handleCopyUrl = () => {
    const url = getKioskUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      showSnackbar("Kiosk URL copied to clipboard!", "success");
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

  const getScheduleName = (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    return schedule
      ? `${schedule.day} - ${schedule.sectionName}`
      : "Unknown Schedule";
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title={kioskMode ? "Disable Kiosk Mode" : "Enable Kiosk Mode"}>
          <Button
            variant={kioskMode ? "contained" : "outlined"}
            startIcon={<KioskIcon />}
            onClick={handleToggleClick}
            disabled={loading}
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1,
              background: kioskMode
                ? "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))"
                : "transparent",
              borderColor: "hsl(152, 65%, 28%)",
              color: kioskMode ? "white" : "hsl(152, 65%, 28%)",
              "&:hover": {
                backgroundColor: kioskMode
                  ? "linear-gradient(45deg, hsl(152, 65%, 25%), hsl(145, 60%, 35%))"
                  : "rgba(31, 120, 80, 0.1)",
                borderColor: "hsl(152, 65%, 28%)",
              },
            }}>
            {loading ? (
              <CircularProgress size={20} />
            ) : kioskMode ? (
              "Kiosk Active"
            ) : (
              "Enable Kiosk"
            )}
          </Button>
        </Tooltip>

        {kioskMode && kioskSession && (
          <Chip
            icon={<CheckCircleIcon />}
            label={`Active - ${getScheduleName(kioskSession.scheduleId)}`}
            color="success"
            variant="outlined"
            sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          />
        )}
      </Box>

      {/* Enable Kiosk Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <KioskIcon sx={{ mr: 1, color: "hsl(152, 65%, 28%)" }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
              }}>
              Enable Kiosk Mode
            </Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Select a schedule to enable kiosk mode. Students will be able to
            scan their RFID cards to mark attendance for this schedule.
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Schedule</InputLabel>
            <Select
              value={selectedSchedule}
              label="Select Schedule"
              onChange={(e) => setSelectedSchedule(e.target.value)}
              disabled={loadingSchedules}
              sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {schedules.map((schedule) => (
                <MenuItem key={schedule.id} value={schedule.id}>
                  {schedule.day} - {schedule.sectionName} (
                  {schedule.timeInStart} - {schedule.timeOutEnd})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert
            severity="info"
            sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            <Typography variant="body2">
              <strong>Kiosk Mode Features:</strong>
              <br />• Students can scan RFID cards to mark attendance
              <br />• Session automatically expires after 2 hours
              <br />• Only one kiosk session can be active at a time
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEnableKiosk}
            variant="contained"
            disabled={!selectedSchedule || loading}
            sx={{
              background:
                "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
            }}>
            {loading ? <CircularProgress size={20} /> : "Enable Kiosk Mode"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kiosk URL Dialog */}
      {kioskMode && kioskSession && (
        <Dialog
          open={false} // This will be controlled by a separate state if needed
          onClose={() => {}}
          maxWidth="sm"
          fullWidth>
          <DialogTitle>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
              }}>
              Kiosk Mode Active
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography
              variant="body2"
              sx={{ mb: 2, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Share this URL with students to access the kiosk:
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                bgcolor: "rgba(0,0,0,0.05)",
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}>
              <Typography
                variant="body2"
                sx={{ flex: 1, wordBreak: "break-all" }}>
                {getKioskUrl()}
              </Typography>
              <IconButton onClick={handleCopyUrl} size="small">
                <CopyIcon />
              </IconButton>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Snackbar */}
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
};

export default KioskModeToggle;
