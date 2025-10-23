import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  QrCode as QrCodeIcon,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RFIDScannerModal from "../components/RFIDScannerModal";
import { getKioskSessionByToken } from "../utils/kioskService";

const KioskPage = () => {
  const { sessionId } = useParams();
  const [kioskSession, setKioskSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rfidModalOpen, setRfidModalOpen] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadKioskSession();
    }
  }, [sessionId]);

  const loadKioskSession = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getKioskSessionByToken(sessionId);
      if (result.success) {
        setKioskSession(result.data);
      } else {
        setError(result.error || "Failed to load kiosk session");
      }
    } catch (error) {
      console.error("Error loading kiosk session:", error);
      setError("Failed to load kiosk session");
    } finally {
      setLoading(false);
    }
  };

  const handleRFIDScanSuccess = (result) => {
    setRfidModalOpen(false);
    // Show success message and auto-close modal after a delay
    setTimeout(() => {
      setRfidModalOpen(true);
    }, 2000);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(31, 120, 80, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
          }}>
          <CircularProgress
            size={80}
            sx={{ color: "hsl(152, 65%, 28%)", mb: 3 }}
          />
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              color: "hsl(152, 65%, 28%)",
              mb: 2,
            }}>
            Loading Kiosk Session
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Please wait while we verify your kiosk session...
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(244, 67, 54, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(244, 67, 54, 0.2)",
          }}>
          <ErrorIcon sx={{ fontSize: 80, color: "#f44336", mb: 3 }} />
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              color: "#f44336",
              mb: 2,
            }}>
            Kiosk Session Error
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={loadKioskSession}
            sx={{
              background:
                "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
            }}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!kioskSession) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(15px)",
            border: "2px solid rgba(244, 67, 54, 0.2)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(244, 67, 54, 0.2)",
          }}>
          <ErrorIcon sx={{ fontSize: 80, color: "#f44336", mb: 3 }} />
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Plus Jakarta Sans, sans-serif",
              fontWeight: 600,
              color: "#f44336",
              mb: 2,
            }}>
            Kiosk Session Not Found
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            The kiosk session you're looking for doesn't exist or has expired.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: "#4caf50", mb: 3 }} />

        <Typography
          variant="h4"
          sx={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 700,
            color: "hsl(152, 65%, 28%)",
            mb: 2,
          }}>
          Smart Child Care
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            color: "hsl(220, 60%, 25%)",
            mb: 3,
          }}>
          Attendance Kiosk
        </Typography>

        <Alert
          severity="info"
          sx={{
            mb: 4,
            fontFamily: "Plus Jakarta Sans, sans-serif",
            borderRadius: "12px",
            textAlign: "left",
          }}>
          <Typography variant="body2">
            <strong>Active Session:</strong> {kioskSession.scheduleName}
          </Typography>
          <Typography variant="body2">
            <strong>Expires:</strong>{" "}
            {new Date(kioskSession.expiresAt).toLocaleString()}
          </Typography>
        </Alert>

        <Typography
          variant="h6"
          sx={{
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            color: "hsl(220, 60%, 25%)",
            mb: 3,
          }}>
          Scan your RFID card to mark attendance
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<QrCodeIcon />}
          onClick={() => setRfidModalOpen(true)}
          sx={{
            background:
              "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
            borderRadius: "25px",
            px: 6,
            py: 2,
            fontSize: "1.2rem",
            fontFamily: "Plus Jakarta Sans, sans-serif",
            fontWeight: 600,
            "&:hover": {
              background:
                "linear-gradient(45deg, hsl(152, 65%, 25%), hsl(145, 60%, 35%))",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 25px rgba(31, 120, 80, 0.4)",
            },
            transition: "all 0.3s ease",
          }}>
          Scan RFID Card
        </Button>

        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            mt: 3,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}>
          Place your RFID card on the reader or click the button above to
          manually enter your RFID
        </Typography>
      </Paper>

      {/* RFID Scanner Modal */}
      <RFIDScannerModal
        open={rfidModalOpen}
        onClose={() => setRfidModalOpen(false)}
        onScanSuccess={handleRFIDScanSuccess}
        kioskSession={kioskSession}
      />
    </Container>
  );
};

export default KioskPage;
