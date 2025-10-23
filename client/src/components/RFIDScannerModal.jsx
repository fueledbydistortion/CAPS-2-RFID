import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Error as ErrorIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
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
import { getUsersForRFID } from "../utils/userService";

const RFIDScannerModal = ({ open, onClose, onScanSuccess }) => {
  const [rfidValue, setRfidValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleClose = () => {
    setRfidValue("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleScanRFID = async () => {
    if (!rfidValue.trim()) {
      setError("Please enter an RFID value");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log("🔍 Starting RFID scan process...");
      console.log("📱 RFID Value:", rfidValue);

      // Get users and schedules for validation
      console.log("📡 Loading users and schedules...");
      const [usersResult, schedulesResult] = await Promise.all([
        getUsersForRFID(),
        getAllSchedules(),
      ]);

      console.log("👥 Users Result:", usersResult);
      console.log("📅 Schedules Result:", schedulesResult);

      if (!usersResult.success || !schedulesResult.success) {
        console.error("❌ Data loading failed:");
        console.error(
          "Users success:",
          usersResult.success,
          "Error:",
          usersResult.error
        );
        console.error(
          "Schedules success:",
          schedulesResult.success,
          "Error:",
          schedulesResult.error
        );
        throw new Error("Failed to load user or schedule data");
      }

      const users = usersResult.data;
      const schedules = schedulesResult.data;

      console.log("✅ Data loaded successfully:");
      console.log("👥 Users count:", users?.length || 0);
      console.log("📅 Schedules count:", schedules?.length || 0);
      console.log("👥 Users data:", users);
      console.log("📅 Schedules data:", schedules);

      // Find user by RFID
      console.log("🔍 Looking for user with RFID:", rfidValue);
      console.log(
        "🔍 Available RFID values in users:",
        users.map((u) => ({
          uid: u.uid,
          childRFID: u.childRFID,
          name: u.firstName + " " + u.lastName,
        }))
      );

      const user = users.find(
        (u) => (u.childRFID || "").trim() === rfidValue.trim()
      );

      console.log(
        "👤 User found:",
        user
          ? {
              uid: user.uid,
              name: user.firstName + " " + user.lastName,
              childRFID: user.childRFID,
            }
          : "No user found"
      );

      if (!user) {
        throw new Error("No registered user found for this RFID");
      }

      // Find the relevant schedule for today
      const currentDay = getCurrentDay();
      console.log("📅 Current day:", currentDay);
      console.log(
        "📅 Available schedule days:",
        schedules.map((s) => ({
          id: s.id,
          day: s.day,
          timeInStart: s.timeInStart,
          timeOutStart: s.timeOutStart,
        }))
      );

      const relevantSchedule = schedules.find((s) => s.day === currentDay);

      console.log(
        "📅 Relevant schedule found:",
        relevantSchedule
          ? {
              id: relevantSchedule.id,
              day: relevantSchedule.day,
              timeInStart: relevantSchedule.timeInStart,
              timeOutStart: relevantSchedule.timeOutStart,
            }
          : "No schedule found"
      );

      if (!relevantSchedule) {
        throw new Error(`No schedule found for ${currentDay}`);
      }

      // Determine attendance type based on current time and schedule
      console.log("⏰ Determining attendance type...");
      const attendanceInfo = determineAttendanceType(
        relevantSchedule,
        currentDay
      );

      console.log("⏰ Attendance info:", attendanceInfo);

      if (attendanceInfo.type === "outside") {
        throw new Error(attendanceInfo.message);
      }

      const attendanceType = attendanceInfo.type;
      const parentId = user.uid;
      const qrDataString = JSON.stringify({
        type: "parent",
        parentId,
        attendanceType,
      });

      console.log("📝 Attendance details:", {
        attendanceType,
        parentId,
        qrDataString,
      });

      // Process attendance
      console.log("📤 Processing attendance...");
      const result = await markAttendanceViaQR(
        qrDataString,
        parentId,
        attendanceType
      );

      console.log("📤 Attendance result:", result);

      if (result.success) {
        // Calculate attendance status
        const currentTime = new Date().toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        });

        const scheduledTime =
          attendanceType === "timeIn"
            ? relevantSchedule.timeInStart
            : relevantSchedule.timeOutStart;

        const statusResult = calculateAttendanceStatus(
          scheduledTime,
          currentTime
        );
        const message = formatAttendanceMessage(statusResult, attendanceType);

        setSuccess(`Attendance recorded successfully! ${message}`);

        // Call success callback
        onScanSuccess({
          success: true,
          message: `Attendance recorded successfully! ${message}`,
          data: result.data,
        });

        // Clear form after success
        setTimeout(() => {
          setRfidValue("");
          setSuccess("");
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to record attendance");
      }
    } catch (error) {
      console.error("❌ Error processing RFID:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error details:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
      });
      setError(error.message);
      onScanSuccess({
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleScanRFID();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        },
      }}>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <QrCodeIcon sx={{ mr: 1, color: "hsl(152, 65%, 28%)" }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              color: "hsl(152, 65%, 28%)",
            }}>
            Scan RFID Card
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}>
          Place the RFID card on the reader or manually enter the RFID value
          below.
        </Typography>

        <TextField
          fullWidth
          label="RFID Value"
          value={rfidValue}
          onChange={(e) => setRfidValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <QrCodeIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            },
            "& .MuiInputLabel-root": {
              fontFamily: "Plus Jakarta Sans, sans-serif",
            },
          }}
          placeholder="Enter RFID value..."
        />

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              borderRadius: "12px",
            }}
            icon={<ErrorIcon />}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mt: 2,
              fontFamily: "Plus Jakarta Sans, sans-serif",
              borderRadius: "12px",
            }}
            icon={<CheckCircleIcon />}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 500,
          }}>
          Cancel
        </Button>
        <Button
          onClick={handleScanRFID}
          variant="contained"
          disabled={loading || !rfidValue.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
          sx={{
            background:
              "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
            borderRadius: "12px",
            px: 3,
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            "&:hover": {
              background:
                "linear-gradient(45deg, hsl(152, 65%, 25%), hsl(145, 60%, 35%))",
            },
          }}>
          {loading ? "Processing..." : "Scan RFID"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RFIDScannerModal;
