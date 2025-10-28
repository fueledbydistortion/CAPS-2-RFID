import { CloudUpload, Delete, FilePresent } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import { uploadFile } from "../utils/fileService";
import { assignmentSchema } from "../validation/schema";

const AssignmentForm = ({
  open,
  onClose,
  onSubmit,
  assignmentData = null,
  loading = false,
}) => {
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Get minimum date (today) for due date selection
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const initialValues = {
    title: assignmentData?.title || "",
    description: assignmentData?.description || "",
    dueDate: assignmentData?.dueDate
      ? new Date(assignmentData.dueDate).toISOString().split("T")[0]
      : getMinDate(),
    instructions: assignmentData?.instructions || "",
  };

  useEffect(() => {
    if (assignmentData) {
      setAttachments(assignmentData.attachments || []);
    } else {
      setAttachments([]);
    }
  }, [assignmentData, open]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadFile(file, "assignments");
        if (result.success) {
          return {
            id: result.data.id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.data.url,
            path: result.data.path,
          };
        }
        throw new Error(result.error);
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files: " + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = (fileId) => {
    setAttachments((prev) => prev.filter((file) => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const submissionData = {
      ...values,
      attachments,
      dueDate: new Date(values.dueDate).toISOString(),
    };
    await onSubmit(submissionData);
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
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(15px)",
          border: "2px solid rgba(31, 120, 80, 0.2)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
        },
      }}>
      <DialogTitle
        sx={{
          background:
            "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: 700,
          fontSize: "1.5rem",
        }}>
        {assignmentData ? "Edit Assignment" : "Add New Assignment"}
      </DialogTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={assignmentSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}>
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Assignment Title */}
                <Field name="title">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Assignment Title"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          "&:hover fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                        },
                      }}
                    />
                  )}
                </Field>

                {/* Description */}
                <Field name="description">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description (Optional)"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      multiline
                      rows={3}
                      placeholder="Enter assignment description..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          "&:hover fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                        },
                      }}
                    />
                  )}
                </Field>

                {/* Points removed for letter-only grading */}

                {/* Due Date */}
                <Field name="dueDate">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Due Date"
                      type="date"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      required
                      inputProps={{
                        min: getMinDate(),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          "&:hover fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                        },
                      }}
                    />
                  )}
                </Field>

                {/* Instructions */}
                <Field name="instructions">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Instructions (Optional)"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      multiline
                      rows={4}
                      placeholder="Enter detailed instructions for the assignment..."
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          "&:hover fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "hsl(152, 65%, 28%)",
                          },
                        },
                      }}
                    />
                  )}
                </Field>

                {/* File Upload Section */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: "hsl(152, 65%, 28%)",
                      fontWeight: 600,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 700,
                    }}>
                    Assignment Materials
                  </Typography>

                  {/* Upload Button */}
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept="*/*"
                      style={{ display: "none" }}
                      id="file-upload"
                      multiple
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={uploadingFiles}
                        sx={{
                          borderRadius: "12px",
                          borderColor: "hsl(152, 65%, 28%)",
                          color: "hsl(152, 65%, 28%)",
                          "&:hover": {
                            borderColor: "#0d47a1",
                            backgroundColor: "rgba(21, 101, 192, 0.04)",
                          },
                        }}>
                        {uploadingFiles ? "Uploading..." : "Upload Files"}
                      </Button>
                    </label>
                  </Box>

                  {/* Upload Progress */}
                  {uploadingFiles && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress />
                      <Typography variant="caption" color="text.secondary">
                        Uploading files...
                      </Typography>
                    </Box>
                  )}

                  {/* File List */}
                  {attachments.length > 0 && (
                    <List
                      sx={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        p: 1,
                      }}>
                      {attachments.map((file) => (
                        <ListItem key={file.id} sx={{ py: 1 }}>
                          <FilePresent
                            sx={{ mr: 2, color: "hsl(152, 65%, 28%)" }}
                          />
                          <ListItemText
                            primary={file.name}
                            secondary={`${formatFileSize(file.size)}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveFile(file.id)}
                              size="small"
                              sx={{ color: "#f44336" }}>
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button
                onClick={onClose}
                disabled={loading || isSubmitting}
                sx={{
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting}
                sx={{
                  background:
                    "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                  borderRadius: "12px",
                  px: 3,
                  py: 1,
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #0d47a1, hsl(220, 60%, 25%))",
                  },
                }}>
                {loading || isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : assignmentData ? (
                  "Update Assignment"
                ) : (
                  "Create Assignment"
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default AssignmentForm;
