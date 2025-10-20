import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CameraAlt,
  QrCode
} from '@mui/icons-material';
import jsQR from 'jsqr';
import { calculateAttendanceStatus, formatAttendanceMessage } from '../utils/attendanceUtils';

const QRScannerDialog = ({ open, onClose, onScan }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setQrError('');
      setScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Start QR detection once video is loaded
        videoRef.current.onloadedmetadata = () => {
          startQRDetection();
        };
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
    setIsDetecting(false);
    setQrError('');
  };

  const startQRDetection = () => {
    // Start automatic QR code detection
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        detectQRCode();
      }
    }, 250); // Check every 250ms to reduce CPU usage
  };

  const detectQRCode = () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;

    setIsDetecting(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for QR detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Use jsQR to detect QR codes
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        // QR code detected!
        console.log('QR Code detected:', code.data);
        
        try {
          // Try to parse the QR code data as JSON
          const qrData = JSON.parse(code.data);
          
          // Accept schedule or parent QR codes
          if ((qrData.type === 'schedule' && qrData.id) || (qrData.type === 'parent' && (qrData.parentId || qrData.parentID))) {
            onScan(code.data);
            stopCamera();
            onClose();
            return;
          } else {
            console.warn('Invalid QR code type:', qrData.type);
            setQrError('Invalid QR code. Please scan a valid QR for schedules or parents.');
            setTimeout(() => setQrError(''), 3000); // Clear error after 3 seconds
          }
        } catch (parseError) {
          console.warn('Failed to parse QR code data as JSON:', code.data);
          setQrError('Invalid QR code format.');
          setTimeout(() => setQrError(''), 3000); // Clear error after 3 seconds
        }
      }
      
      setIsDetecting(false);

    } catch (err) {
      console.error('QR detection error:', err);
      setIsDetecting(false);
    }
  };


  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth fullScreen>
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" alignItems="center">
          <QrCode sx={{ mr: 2, fontSize: '2rem' }} />
          <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
            Scan QR Code
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {qrError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {qrError}
          </Alert>
        )}
        
        <Box 
          sx={{ 
            position: 'relative',
            width: '100%',
            height: '70vh',
            minHeight: '500px',
            backgroundColor: '#f5f5f5',
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {scanning ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Hidden canvas for QR detection */}
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />
              {isDetecting && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: 2,
                    p: 2
                  }}
                >
                  <CircularProgress size={40} sx={{ color: 'hsl(145, 60%, 40%)', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'white' }}>
                    Detecting QR Code...
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Box textAlign="center">
              <CameraAlt sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Camera not available
              </Typography>
            </Box>
          )}
          
          {/* QR Code overlay frame */}
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              border: '3px solid hsl(145, 60%, 40%)',
              borderRadius: 3,
              boxShadow: '0 0 20px rgba(31, 120, 80, 0.5)',
              animation: scanning ? 'pulse 2s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 20px rgba(31, 120, 80, 0.5)',
                  borderColor: 'hsl(145, 60%, 40%)'
                },
                '50%': {
                  boxShadow: '0 0 30px rgba(31, 120, 80, 0.8)',
                  borderColor: 'hsl(145, 60%, 40%)'
                },
                '100%': {
                  boxShadow: '0 0 20px rgba(31, 120, 80, 0.5)',
                  borderColor: 'hsl(145, 60%, 40%)'
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-6px',
                left: '-6px',
                right: '-6px',
                bottom: '-6px',
                border: '3px solid rgba(31, 120, 80, 0.3)',
                borderRadius: 3,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '-10px',
                left: '-10px',
                right: '-10px',
                bottom: '-10px',
                border: '2px solid rgba(31, 120, 80, 0.1)',
                borderRadius: 4,
              }
            }}
          />
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3, textAlign: 'center', fontSize: '1.1rem' }}>
          Position the QR code within the frame - it will be detected automatically
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', opacity: 0.8 }}>
          Make sure the QR code is clearly visible and well-lit
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button 
          onClick={handleClose}
          size="large"
          variant="outlined"
          sx={{ 
            minWidth: '150px',
            py: 1.5,
            fontSize: '1.1rem'
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QRScannerDialog;

