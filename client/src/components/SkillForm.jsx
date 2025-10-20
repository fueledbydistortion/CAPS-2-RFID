import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { skillSchema } from '../validation/schema';

const SkillForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  skillData = null, 
  loading = false 
}) => {
  const initialValues = {
    name: skillData?.name || '',
    code: skillData?.code || '',
    description: skillData?.description || ''
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    await onSubmit(values);
    setSubmitting(false);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(15px)',
          border: '2px solid rgba(31, 120, 80, 0.2)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(31, 120, 80, 0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))', 
        backgroundClip: 'text', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
        fontSize: '1.5rem'
      }}>
        {skillData ? 'Edit Skill' : 'Add New Skill'}
      </DialogTitle>
      
      <Formik
        initialValues={initialValues}
        validationSchema={skillSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Topic Name */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <Field name="name">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Skill Name"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': {
                                borderColor: 'hsl(152, 65%, 28%)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'hsl(152, 65%, 28%)',
                              },
                            },
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <Field name="code">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Skill Code"
                          placeholder="e.g., MATH101"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': {
                                borderColor: 'hsl(152, 65%, 28%)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'hsl(152, 65%, 28%)',
                              },
                            },
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>


                {/* Description */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                    <Field name="description">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Description"
                          multiline
                          rows={3}
                          placeholder="Enter skill description..."
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': {
                                borderColor: 'hsl(152, 65%, 28%)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'hsl(152, 65%, 28%)',
                              },
                            },
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>
                
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={onClose} 
                disabled={loading || isSubmitting}
                sx={{ 
                  borderRadius: '12px',
                  px: 3,
                  py: 1
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting}
                sx={{ 
                  background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))',
                  }
                }}
              >
                {(loading || isSubmitting) ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  skillData ? 'Update Skill' : 'Create Skill'
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default SkillForm;

