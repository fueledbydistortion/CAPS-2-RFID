import { Delete } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
  addStudentToSection,
  removeStudentFromSection,
} from "../utils/sectionService";
import { getAllUsers } from "../utils/userService";
import { sectionSchema } from "../validation/schema";

const SectionForm = ({
  open,
  onClose,
  onSubmit,
  sectionData = null,
  loading = false,
}) => {
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const initialValues = {
    name: sectionData?.name || "",
    capacity: sectionData?.capacity || 0,
    teacherId: sectionData?.teacherId || "",
  };

  // Load teachers and students when form opens
  useEffect(() => {
    if (open) {
      loadTeachers();
      loadStudents();
    }
  }, [open]);

  useEffect(() => {
    if (sectionData) {
      setAssignedStudents(sectionData.assignedStudents || []);
    } else {
      setAssignedStudents([]);
    }
  }, [sectionData, open]);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        // Filter only teachers
        const teacherUsers = result.data.filter(
          (user) => user.role === "teacher"
        );
        setTeachers(teacherUsers);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const result = await getAllUsers();
      if (result.success) {
        // Filter only parent users (show all parents, but prioritize those with child info)
        const allParents = result.data.filter((user) => user.role === "parent");
        const parentUsers = allParents.sort((a, b) => {
          // Parents with child info first, then those without
          const aHasChild =
            (a.childFirstName || a.childMiddleName || a.childLastName) &&
            (a.childFirstName?.trim() ||
              a.childMiddleName?.trim() ||
              a.childLastName?.trim());
          const bHasChild =
            (b.childFirstName || b.childMiddleName || b.childLastName) &&
            (b.childFirstName?.trim() ||
              b.childMiddleName?.trim() ||
              b.childLastName?.trim());
          return bHasChild - aHasChild;
        });
        setStudents(parentUsers);
      }
    } catch (error) {
      console.error("Error loading parents:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudent = async () => {
    if (selectedStudent && !assignedStudents.includes(selectedStudent.uid)) {
      // If editing existing section, use backend API
      if (sectionData) {
        try {
          const result = await addStudentToSection(
            sectionData.id,
            selectedStudent.uid
          );
          if (result.success) {
            setAssignedStudents((prev) => [...prev, selectedStudent.uid]);
            setSelectedStudent(null);
          } else {
            console.error("Error adding student:", result.error);
            // Still update UI for better UX, but show error
            setAssignedStudents((prev) => [...prev, selectedStudent.uid]);
            setSelectedStudent(null);
          }
        } catch (error) {
          console.error("Error adding student:", error);
          // Still update UI for better UX
          setAssignedStudents((prev) => [...prev, selectedStudent.uid]);
          setSelectedStudent(null);
        }
      } else {
        // For new sections, just update local state
        setAssignedStudents((prev) => [...prev, selectedStudent.uid]);
        setSelectedStudent(null);
      }
    }
  };

  const handleRemoveStudent = async (studentId) => {
    // If editing existing section, use backend API
    if (sectionData) {
      try {
        const result = await removeStudentFromSection(
          sectionData.id,
          studentId
        );
        if (result.success) {
          setAssignedStudents((prev) => prev.filter((id) => id !== studentId));
        } else {
          console.error("Error removing student:", result.error);
          // Still update UI for better UX
          setAssignedStudents((prev) => prev.filter((id) => id !== studentId));
        }
      } catch (error) {
        console.error("Error removing student:", error);
        // Still update UI for better UX
        setAssignedStudents((prev) => prev.filter((id) => id !== studentId));
      }
    } else {
      // For new sections, just update local state
      setAssignedStudents((prev) => prev.filter((id) => id !== studentId));
    }
  };

  const handleSelectAllStudents = async () => {
    const availableStudents = getAvailableStudents();
    const studentIds = availableStudents.map((student) => student.uid);

    // If editing existing section, add each student via backend API
    if (sectionData) {
      for (const studentId of studentIds) {
        try {
          const result = await addStudentToSection(sectionData.id, studentId);
          if (result.success) {
            setAssignedStudents((prev) => [...prev, studentId]);
          }
        } catch (error) {
          console.error("Error adding student:", error);
        }
      }
    } else {
      // For new sections, just update state
      setAssignedStudents((prev) => [...new Set([...prev, ...studentIds])]);
    }
  };

  const getAssignedStudentsData = () => {
    return assignedStudents
      .map((studentId) => {
        const student = students.find((s) => s.uid === studentId);
        return student ? { uid: studentId, ...student } : null;
      })
      .filter(Boolean);
  };

  const getAvailableStudents = () => {
    return students.filter(
      (student) => !assignedStudents.includes(student.uid)
    );
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    const submissionData = {
      ...values,
      assignedStudents: assignedStudents,
    };
    await onSubmit(submissionData);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {sectionData ? "Edit Section" : "Add New Section"}
      </DialogTitle>
      <Formik
        initialValues={initialValues}
        validationSchema={sectionSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}>
        {({ values, errors, touched, isSubmitting, setFieldValue }) => (
          <Form>
            <DialogContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                    <Field name="name">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Daycare Level"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          required
                        />
                      )}
                    </Field>
                  </Box>
                  <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                    <Field name="capacity">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Capacity"
                          type="number"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          inputProps={{ min: 0 }}
                        />
                      )}
                    </Field>
                  </Box>
                  <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                    <Field name="teacherId">
                      {({ field, meta }) => (
                        <FormControl
                          fullWidth
                          required
                          error={meta.touched && Boolean(meta.error)}>
                          <InputLabel>Assign Teacher *</InputLabel>
                          <Select
                            {...field}
                            label="Assign Teacher *"
                            disabled={loadingTeachers}>
                            <MenuItem value="">
                              <em>Select a teacher</em>
                            </MenuItem>
                            {teachers.map((teacher) => (
                              <MenuItem key={teacher.uid} value={teacher.uid}>
                                {teacher.firstName} {teacher.lastName}
                              </MenuItem>
                            ))}
                          </Select>
                          {meta.touched && meta.error && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 0.5, ml: 1.75 }}>
                              {meta.error}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    </Field>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "hsl(152, 65%, 28%)",
                      fontWeight: 600,
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                    }}>
                    Assigned Parents ({assignedStudents.length})
                  </Typography>

                  {/* Add Student Section */}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                    }}>
                    <Autocomplete
                      options={getAvailableStudents()}
                      getOptionLabel={(option) => {
                        const childName = [
                          option.childFirstName,
                          option.childMiddleName,
                          option.childLastName,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        if (childName && childName.trim() !== "") {
                          return `${option.firstName} ${option.lastName} - Child: ${childName}`;
                        } else {
                          return `${option.firstName} ${option.lastName} (No child info)`;
                        }
                      }}
                      value={selectedStudent}
                      onChange={(event, newValue) =>
                        setSelectedStudent(newValue)
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search and select parent (with child)"
                          size="small"
                          sx={{ minWidth: 450, maxWidth: 600 }}
                        />
                      )}
                      renderOption={(props, option) => {
                        const childName = [
                          option.childFirstName,
                          option.childMiddleName,
                          option.childLastName,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <Box component="li" {...props}>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}>
                                {childName && childName.trim() !== ""
                                  ? `${option.firstName} ${option.lastName} - Child: ${childName}`
                                  : `${option.firstName} ${option.lastName} (No child info)`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary">
                                {option.email}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      disabled={loadingStudents}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddStudent}
                      disabled={!selectedStudent || loadingStudents}
                      size="small"
                      sx={{
                        background:
                          "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                      }}>
                      Add User
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleSelectAllStudents}
                      disabled={
                        getAvailableStudents().length === 0 || loadingStudents
                      }
                      size="small"
                      sx={{
                        borderColor: "hsl(152, 65%, 28%)",
                        color: "hsl(152, 65%, 28%)",
                        "&:hover": {
                          borderColor: "hsl(152, 60%, 25%)",
                          backgroundColor: "rgba(31, 120, 80, 0.05)",
                        },
                      }}>
                      Select All
                    </Button>
                  </Box>

                  {/* Students Table */}
                  {loadingStudents ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <TableContainer
                      sx={{ border: "1px solid #e0e0e0", borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Parent Name</TableCell>
                            <TableCell>Child Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getAssignedStudentsData().length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography
                                  variant="body2"
                                  color="text.secondary">
                                  No parents assigned to this section
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            getAssignedStudentsData().map((parent) => (
                              <TableRow key={parent.uid}>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}>
                                    {parent.firstName} {parent.lastName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 500,
                                      fontFamily:
                                        "Plus Jakarta Sans, sans-serif",
                                      color: "hsl(152, 65%, 28%)",
                                    }}>
                                    {parent.childName &&
                                    parent.childName.trim() !== ""
                                      ? parent.childName
                                      : "No child info"}
                                  </Typography>
                                </TableCell>
                                <TableCell>{parent.email}</TableCell>
                                <TableCell>{parent.phone || "-"}</TableCell>
                                <TableCell>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveStudent(parent.uid)
                                    }>
                                    <Delete />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} disabled={loading || isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || isSubmitting}
                sx={{
                  background:
                    "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                }}>
                {loading || isSubmitting ? (
                  <CircularProgress size={24} />
                ) : sectionData ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default SectionForm;
