import React, { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import { 
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  QrCode
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { loginSchema } from '../validation/schema'
import { useAuthActions } from '../hooks/useAuthActions'
import { getApiUrl } from '../config/api'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [isResetLoading, setIsResetLoading] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1 = email input, 2 = code + new password
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)
  const { login } = useAuthActions()

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    const result = await login(values.email, values.password)
    
    if (!result.success) {
      // Handle login error
      let errorMessage = 'Login failed. Please try again.'
      
      if (result.error) {
        // Check for Firebase error codes
        if (result.error.includes('auth/user-not-found')) {
          errorMessage = 'No account found with this email address.'
        } else if (result.error.includes('auth/wrong-password') || result.error.includes('auth/invalid-credential')) {
          errorMessage = 'Incorrect password. Please try again.'
        } else if (result.error.includes('auth/invalid-email')) {
          errorMessage = 'Please enter a valid email address.'
        } else if (result.error.includes('auth/too-many-requests')) {
          errorMessage = 'Too many failed attempts. Please try again later.'
        } else if (result.error.includes('auth/user-disabled')) {
          errorMessage = 'This account has been disabled. Please contact support.'
        } else if (result.error.includes('auth/network-request-failed')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (result.error.includes('auth/weak-password')) {
          errorMessage = 'Password is too weak. Please choose a stronger password.'
        } else if (result.error.includes('auth/email-already-in-use')) {
          errorMessage = 'An account with this email already exists.'
        } else {
          errorMessage = 'Login failed. Please try again.'
        }
      }
      
      setStatus(errorMessage)
    }
    
    setSubmitting(false)
  }

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetMessage('Please enter your email address.')
      return
    }

    setIsResetLoading(true)
    setResetMessage('')

    try {
      const response = await fetch(getApiUrl('password-reset/send-reset-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      })

      const data = await response.json()

      if (data.success) {
        if (data.resetCode) {
          // Email service unavailable, show code directly
          setResetMessage(`Password reset code generated: ${data.resetCode} (Email service unavailable - this is for testing only). The code will expire in ${data.expiresIn} minutes.`)
        } else {
          // Email sent successfully
          setResetMessage(`Password reset code sent to your email address! The code will expire in ${data.expiresIn} minutes.`)
        }
        setResetStep(2) // Move to step 2
      } else {
        setResetMessage(data.error || 'Failed to send reset code. Please try again.')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setResetMessage('Failed to send reset code. Please check your email address and try again.')
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleVerifyResetCode = async () => {
    if (!resetCode || !newPassword || !confirmPassword) {
      setResetMessage('Please fill in all fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetMessage('Passwords do not match.')
      return
    }

    if (newPassword.length < 6) {
      setResetMessage('Password must be at least 6 characters long.')
      return
    }

    setIsResetLoading(true)
    setResetMessage('')

    try {
      const response = await fetch(getApiUrl('password-reset/verify-reset-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: resetEmail, 
          code: resetCode, 
          newPassword: newPassword 
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResetMessage('Password updated successfully! You can now log in with your new password.')
        setTimeout(() => {
          handleCloseForgotPassword()
        }, 2000)
      } else {
        setResetMessage(data.error || 'Failed to update password. Please check your code and try again.')
      }
    } catch (error) {
      console.error('Password update error:', error)
      setResetMessage('Failed to update password. Please try again.')
    } finally {
      setIsResetLoading(false)
    }
  }

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false)
    setResetEmail('')
    setResetMessage('')
    setResetStep(1)
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(210, 20%, 98%) 0%, hsl(152, 50%, 95%) 50%, hsl(145, 45%, 90%) 100%)',
        color: 'white',
        py: 4,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }} data-aos="fade-down" data-aos-delay="200">
          <QrCode
            sx={{
              fontSize: '4rem',
              color: '#001f3f',
              mb: 2,
              filter: 'drop-shadow(2px 2px 4px rgba(0, 31, 63, 0.3))'
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(45deg, #001f3f, #003366)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#001f3f',
              opacity: 0.9
            }}
          >
            Sign in to your SmartChildcare account
          </Typography>
        </Box>

        {/* Login Form */}
        <Paper
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(0, 31, 63, 0.2)',
            borderRadius: '20px',
            p: 4,
            boxShadow: '0 8px 32px rgba(0, 31, 63, 0.2)'
          }}
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <Formik
            initialValues={{
              email: '',
              password: ''
            }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting, status }) => (
              <Form>
                {/* Status Messages */}
                {status && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {status}
                  </Alert>
                )}

                <Field name="email">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={meta.touched && meta.error}
                      helperText={meta.touched && meta.error}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          color: '#001f3f',
                          '& fieldset': {
                            borderColor: 'rgba(0, 31, 63, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(0, 31, 63, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#001f3f',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 31, 63, 0.7)',
                          '&.Mui-focused': {
                            color: '#001f3f',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#f44336',
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: 'rgba(0, 31, 63, 0.7)' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Field>

                <Field name="password">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      error={meta.touched && meta.error}
                      helperText={meta.touched && meta.error}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          color: '#001f3f',
                          '& fieldset': {
                            borderColor: 'rgba(0, 31, 63, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(0, 31, 63, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#001f3f',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 31, 63, 0.7)',
                          '&.Mui-focused': {
                            color: '#001f3f',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: '#f44336',
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ color: 'rgba(0, 31, 63, 0.7)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: 'rgba(0, 31, 63, 0.7)' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Field>

                {/* Terms and Conditions Checkbox */}
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      sx={{
                        color: 'rgba(0, 31, 63, 0.7)',
                        '&.Mui-checked': {
                          color: '#001f3f',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#001f3f' }}>
                      I have read and agree to the{' '}
                      <Link
                        component="button"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setTermsDialogOpen(true)
                        }}
                        sx={{
                          color: '#003366',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          font: 'inherit',
                          '&:hover': {
                            color: '#001f3f'
                          }
                        }}
                      >
                        Terms and Conditions
                      </Link>
                    </Typography>
                  }
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || !acceptedTerms}
                  sx={{
                    background: 'linear-gradient(45deg, #001f3f, #003366)',
                    color: 'white',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '25px',
                    boxShadow: '0 6px 20px rgba(0, 31, 63, 0.4)',
                    transition: 'all 0.3s ease',
                    mb: 3,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 30px rgba(0, 31, 63, 0.6)'
                    },
                    '&:disabled': {
                      opacity: 0.7,
                      transform: 'none'
                    }
                  }}
                >
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Link
                    component={RouterLink}
                    to="/signup"
                    sx={{
                      color: '#2196f3',
                      textDecoration: 'none',
                      fontSize: '1rem',
                      '&:hover': {
                        color: '#00bcd4',
                        textDecoration: 'underline'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Don't have an account? Sign up
                  </Link>
                </Box> */}

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    sx={{
                      color: '#003366',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#001f3f'
                      },
                      transition: 'color 0.3s ease'
                    }}
                  >
                    Forgot your password?
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>

        {/* Forgot Password Dialog */}
        <Dialog 
          open={forgotPasswordOpen} 
          onClose={handleCloseForgotPassword}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 600,
            color: '#001f3f'
          }}>
            {resetStep === 1 ? 'Reset Password' : 'Enter Verification Code'}
          </DialogTitle>
          <DialogContent>
            {resetStep === 1 ? (
              <>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Enter your email address and we'll send a verification code to your email.
            </Typography>
                
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#001f3f' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }
                  }}
                />
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Enter the 6-digit verification code sent to your email and your new password.
                </Typography>
                
                <TextField
                  fullWidth
                  label="Verification Code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  margin="normal"
                  variant="outlined"
                  placeholder="123456"
                  inputProps={{ maxLength: 6 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    },
                    '& .MuiInputLabel-root': {
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }
                  }}
                />
              </>
            )}

            {resetMessage && (
              <Alert 
                severity={resetMessage.includes('successfully') || resetMessage.includes('sent') ? 'success' : 'error'} 
                sx={{ mt: 2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {resetMessage}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={handleCloseForgotPassword}
              sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Cancel
            </Button>
            {resetStep === 1 ? (
              <Button 
                onClick={handleForgotPassword}
                variant="contained"
                disabled={isResetLoading}
                sx={{ 
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'linear-gradient(45deg, #001f3f, #003366)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #003366, #001f3f)',
                  }
                }}
              >
                {isResetLoading ? 'Sending...' : 'Send Code'}
              </Button>
            ) : (
              <Button 
                onClick={handleVerifyResetCode}
                variant="contained"
                disabled={isResetLoading}
                sx={{ 
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  background: 'linear-gradient(45deg, #001f3f, #003366)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #003366, #001f3f)',
                  }
                }}
              >
                {isResetLoading ? 'Updating...' : 'Update Password'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Terms and Conditions Dialog */}
        <Dialog
          open={termsDialogOpen}
          onClose={() => setTermsDialogOpen(false)}
          maxWidth="md"
          fullWidth
          scroll="paper"
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 600,
            color: '#001f3f',
            borderBottom: '2px solid rgba(0, 31, 63, 0.1)',
            pb: 2
          }}>
            Terms and Conditions
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              By accessing and using the SmartChildcare website, you acknowledge and agree to the following Terms and Conditions:
            </Typography>

            <Box component="ol" sx={{ pl: 2, '& li': { mb: 2, color: '#001f3f', lineHeight: 1.8 } }}>
              <li>
                <Typography variant="body2">
                  This website is a student project developed by 4th-year students for the exclusive use of Kapitbahayan Daycare in Navotas City.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  All information you provide will be used solely for daycare management and handled according to our Privacy Policy.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Your data will not be shared or sold outside the project scope, except as required by law or for academic evaluation.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  The website is provided "as is" as a non-commercial, educational project and may have limitations.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  You are responsible for keeping your account credentials secure.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  You agree to use the website only for legitimate daycare activities. Any misuse may result in loss of access.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  For more information, please read our full{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setTermsDialogOpen(false)
                      setPrivacyDialogOpen(true)
                    }}
                    sx={{
                      color: '#003366',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      font: 'inherit',
                      '&:hover': {
                        color: '#001f3f'
                      }
                    }}
                  >
                    Privacy Policy
                  </Link>
                  {' '}and Terms of Service.
                </Typography>
              </li>
            </Box>

            <Alert severity="info" sx={{ mt: 3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                By checking the box, you confirm that you have read, understood, and agree to these Terms and Conditions.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid rgba(0, 31, 63, 0.1)' }}>
            <Button 
              onClick={() => setTermsDialogOpen(false)}
              sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setAcceptedTerms(true)
                setTermsDialogOpen(false)
              }}
              variant="contained"
              sx={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'linear-gradient(45deg, #001f3f, #003366)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #003366, #001f3f)',
                }
              }}
            >
              I Accept
            </Button>
          </DialogActions>
        </Dialog>

        {/* Privacy Policy Dialog */}
        <Dialog
          open={privacyDialogOpen}
          onClose={() => setPrivacyDialogOpen(false)}
          maxWidth="md"
          fullWidth
          scroll="paper"
        >
          <DialogTitle sx={{ 
            textAlign: 'center', 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 600,
            color: '#001f3f',
            borderBottom: '2px solid rgba(0, 31, 63, 0.1)',
            pb: 2
          }}>
            Privacy Policy
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              SmartChildcare Privacy Policy
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
              1. Information We Collect
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              We collect personal information necessary for daycare management, including parent/guardian information, 
              child information, attendance records, and communication logs. This information is collected solely for 
              the purpose of managing daycare operations at Kapitbahayan Daycare in Navotas City.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
              2. How We Use Your Information
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              Your information is used exclusively for daycare management purposes, including attendance tracking, 
              communication with parents/guardians, and academic evaluation of this student project. We do not sell 
              or share your data with third parties outside the project scope.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
              3. Data Security
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              We implement appropriate security measures to protect your personal information. However, as this is 
              an educational project, we cannot guarantee absolute security. You are responsible for maintaining 
              the confidentiality of your account credentials.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
              4. Data Retention
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              Your data will be retained for the duration of the project and for academic evaluation purposes. 
              After the completion of the academic requirements, data may be archived or deleted in accordance 
              with the daycare's policies and applicable laws.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
              5. Your Rights
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              You have the right to access, correct, or request deletion of your personal information. 
              For any privacy-related concerns, please contact the daycare administration or project supervisors.
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
              6. Educational Project Notice
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
              This website is a student project developed for educational purposes. While we strive to maintain 
              high standards of data protection, users should be aware that this is a non-commercial, academic project.
            </Typography>

            <Alert severity="info" sx={{ mt: 3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <Typography variant="body2">
                For questions or concerns about this Privacy Policy, please contact the daycare administration.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid rgba(0, 31, 63, 0.1)' }}>
            <Button 
              onClick={() => {
                setPrivacyDialogOpen(false)
                setTermsDialogOpen(true)
              }}
              sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              Back to Terms
            </Button>
            <Button 
              onClick={() => setPrivacyDialogOpen(false)}
              variant="contained"
              sx={{ 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: 'linear-gradient(45deg, #001f3f, #003366)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #003366, #001f3f)',
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  )
}

export default Login
