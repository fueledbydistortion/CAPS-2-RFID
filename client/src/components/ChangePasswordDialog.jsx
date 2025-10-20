import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as yup from 'yup';

// Validation schema for change password
const changePasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
});

const ChangePasswordDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  user,
  loading = false 
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    await onSubmit(user.uid, values.newPassword);
    setSubmitting(false);
    resetForm();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Change Password - {user?.firstName} {user?.lastName}
      </DialogTitle>
      <Formik
        initialValues={{
          newPassword: '',
          confirmPassword: ''
        }}
        validationSchema={changePasswordSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, errors, touched }) => (
          <Form>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert severity="info">
                  Set a new password for this user. Make sure to inform the user of their new password.
                </Alert>

                <Field name="newPassword">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="New Password"
                      type={showNewPassword ? "text" : "password"}
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              edge="end"
                              tabIndex={-1}
                            >
                              {showNewPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </Field>

                <Field name="confirmPassword">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirm New Password"
                      type={showConfirmPassword ? "text" : "password"}
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </Field>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={loading || isSubmitting}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading || isSubmitting || Object.keys(errors).length > 0}
                sx={{ background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))' }}
              >
                {(loading || isSubmitting) ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ChangePasswordDialog;

