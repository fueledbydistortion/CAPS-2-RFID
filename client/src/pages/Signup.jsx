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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material'
import { 
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Business,
  Phone,
  QrCode
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { signupSchema } from '../validation/schema'
import { useAuthActions } from '../hooks/useAuthActions'

function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup } = useAuthActions()

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    const result = await signup(values)
    
    if (!result.success) {
      // Handle registration error
      let errorMessage = 'Registration failed. Please try again.'
      
      if (result.error) {
        switch (result.error) {
          case 'Firebase: Error (auth/email-already-in-use).':
            errorMessage = 'An account with this email already exists. Please use a different email or try signing in.'
            break
          case 'Firebase: Error (auth/invalid-email).':
            errorMessage = 'Please enter a valid email address.'
            break
          case 'Firebase: Error (auth/weak-password).':
            errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).'
            break
          case 'Firebase: Error (auth/operation-not-allowed).':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.'
            break
          default:
            errorMessage = result.error
        }
      }
      
      setStatus(errorMessage)
    }
    
    setSubmitting(false)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 25%, #90caf9 50%, #64b5f6 100%)',
        color: 'white',
        py: 4,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }} data-aos="fade-down" data-aos-delay="200">
          <QrCode
            sx={{
              fontSize: '4rem',
              color: '#2196f3',
              mb: 2,
              filter: 'drop-shadow(2px 2px 4px rgba(33, 150, 243, 0.3))'
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(45deg, #1565c0, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Join SmartChildcare
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#1976d2',
              opacity: 0.9
            }}
          >
            Create your account to start managing childcare operations
          </Typography>
        </Box>

        {/* Signup Form */}
        <Paper
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '20px',
            p: 4,
            boxShadow: '0 8px 32px rgba(33, 150, 243, 0.2)'
          }}
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              organization: '',
              role: '',
              password: '',
              confirmPassword: ''
            }}
            validationSchema={signupSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, isSubmitting, status, setFieldValue }) => (
              <Form>
                {/* Status Messages */}
                {status && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {status}
                  </Alert>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                  }}
                >
                  {/* First Name and Last Name Row */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 3
                    }}
                  >
                    <Field name="firstName">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="First Name"
                          error={meta.touched && meta.error}
                          helperText={meta.touched && meta.error}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: '#1565c0',
                              '& fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2196f3',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                              '&.Mui-focused': {
                                color: '#2196f3',
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              color: '#f44336',
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person sx={{ color: 'rgba(33, 150, 243, 0.7)' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                    
                    <Field name="lastName">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Last Name"
                          error={meta.touched && meta.error}
                          helperText={meta.touched && meta.error}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: '#1565c0',
                              '& fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2196f3',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                              '&.Mui-focused': {
                                color: '#2196f3',
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              color: '#f44336',
                            },
                          }}
                        />
                      )}
                    </Field>
                  </Box>

                  {/* Email */}
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
                          '& .MuiOutlinedInput-root': {
                            color: '#1565c0',
                            '& fieldset': {
                              borderColor: 'rgba(33, 150, 243, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(33, 150, 243, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2196f3',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(33, 150, 243, 0.7)',
                            '&.Mui-focused': {
                              color: '#2196f3',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#f44336',
                          },
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email sx={{ color: 'rgba(33, 150, 243, 0.7)' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  </Field>

                  {/* Phone and Organization Row */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 3
                    }}
                  >
                    <Field name="phone">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone Number"
                          placeholder="e.g., 09171234567"
                          error={meta.touched && meta.error}
                          helperText={
                            meta.touched && meta.error 
                              ? meta.error 
                              : "Enter numbers only (no spaces, dashes, or special characters)"
                          }
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: '#1565c0',
                              '& fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2196f3',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                              '& .Mui-focused': {
                                color: '#2196f3',
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              color: meta.touched && meta.error ? '#f44336' : 'rgba(33, 150, 243, 0.7)',
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone sx={{ color: 'rgba(33, 150, 243, 0.7)' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                    
                    <Field name="organization">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Organization"
                          error={meta.touched && meta.error}
                          helperText={meta.touched && meta.error}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: '#1565c0',
                              '& fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2196f3',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                              '&.Mui-focused': {
                                color: '#2196f3',
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              color: '#f44336',
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business sx={{ color: 'rgba(33, 150, 243, 0.7)' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </Box>

                  {/* Role */}
                  <Field name="role">
                    {({ field, meta }) => (
                      <FormControl fullWidth error={meta.touched && meta.error}>
                        <InputLabel sx={{ color: 'rgba(33, 150, 243, 0.7)' }}>
                          Role
                        </InputLabel>
                        <Select
                          {...field}
                          sx={{
                            color: '#1565c0',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(33, 150, 243, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(33, 150, 243, 0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#2196f3',
                            },
                            '& .MuiSvgIcon-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                            },
                          }}
                        >
                          <MenuItem value="admin">Administrator</MenuItem>
                          <MenuItem value="teacher">Teacher</MenuItem>
                          <MenuItem value="staff">Staff Member</MenuItem>
                          <MenuItem value="parent">Parent/Guardian</MenuItem>
                        </Select>
                        {meta.touched && meta.error && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#f44336', mt: 1, display: 'block' }}
                          >
                            {meta.error}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  </Field>

                  {/* Password and Confirm Password Row */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 3
                    }}
                  >
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
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: '#1565c0',
                              '& fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2196f3',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                              '&.Mui-focused': {
                                color: '#2196f3',
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              color: '#f44336',
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: 'rgba(33, 150, 243, 0.7)' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                  sx={{ color: 'rgba(33, 150, 243, 0.7)' }}
                                >
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                    
                    <Field name="confirmPassword">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Confirm Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          error={meta.touched && meta.error}
                          helperText={meta.touched && meta.error}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              color: '#1565c0',
                              '& fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(33, 150, 243, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#2196f3',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(33, 150, 243, 0.7)',
                              '&.Mui-focused': {
                                color: '#2196f3',
                              },
                            },
                            '& .MuiFormHelperText-root': {
                              color: '#f44336',
                            },
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: 'rgba(33, 150, 243, 0.7)' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  edge="end"
                                  sx={{ color: 'rgba(33, 150, 243, 0.7)' }}
                                >
                                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    background: 'linear-gradient(45deg, #2196f3, #00bcd4)',
                    color: 'white',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: '25px',
                    boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                    transition: 'all 0.3s ease',
                    mt: 4,
                    mb: 3,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 30px rgba(33, 150, 243, 0.6)'
                    },
                    '&:disabled': {
                      opacity: 0.7,
                      transform: 'none'
                    }
                  }}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Link
                    component={RouterLink}
                    to="/login"
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
                    Already have an account? Sign in
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>

        {/* Additional Info */}
        <Box sx={{ textAlign: 'center', mt: 4 }} data-aos="fade-up" data-aos-delay="400">
          <Typography
            variant="body2"
            sx={{
              color: '#1976d2',
              opacity: 0.8,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Join thousands of childcare professionals using SmartChildcare to streamline 
            operations, enhance child development tracking, and improve communication with families.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default Signup
