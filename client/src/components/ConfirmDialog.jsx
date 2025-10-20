import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Warning } from '@mui/icons-material';

const ConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  const getColor = () => {
    switch (type) {
      case 'danger':
        return '#d32f2f';
      case 'info':
        return 'hsl(220, 60%, 25%)';
      default:
        return '#ed6c02';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: getColor() }} />
          <Typography variant="h6" sx={{ color: getColor() , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained"
          disabled={loading}
          sx={{ 
            backgroundColor: getColor(),
            '&:hover': {
              backgroundColor: getColor(),
              opacity: 0.9
            }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

