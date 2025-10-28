import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import { getAllSections } from "../utils/sectionService";
import { getAllSkills } from "../utils/skillService";
import { getAllUsers } from "../utils/userService";
import { scheduleSchema } from "../validation/schema";

// Helper function to convert 24-hour format to 12-hour format for server
const convertTo12Hour = (timeStr) => {
  if (!timeStr || timeStr === undefined || timeStr === null) return "";

  // If already in 12-hour format (contains AM/PM), return as is
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    return timeStr;
  }

  // If in 24-hour format (HH:MM), convert to 12-hour
  if (timeStr.includes(":")) {
    const [hours, minutes] = timeStr.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  }

  return timeStr;
};

// Helper function to convert 12-hour format to 24-hour format for HTML time inputs
const convertTo24Hour = (timeStr) => {
  if (!timeStr || timeStr === undefined || timeStr === null) return "";

  // If already in 24-hour format (HH:MM), return as is
  if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
    return timeStr;
  }

  // If in 12-hour format (H:MM AM/PM), convert to 24-hour
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let [, hours, minutes, period] = match;
    hours = parseInt(hours);

    if (period.toUpperCase() === "AM") {
      if (hours === 12) hours = 0;
    } else {
      // PM
      if (hours !== 12) hours += 12;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  return timeStr;
};

const ScheduleForm = ({
  open,
  onClose,
  onSubmit,
  scheduleData = null,
  selectedDate = null,
  loading = false,
}) => {
  const [skills, setSkills] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Day options
  const dayOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getInitialValues = () => {
    if (scheduleData) {
      // Debug logging
      console.log("🔍 ScheduleForm Debug - scheduleData:", scheduleData);
      console.log(
        "🔍 ScheduleForm Debug - timeInStart:",
        scheduleData.timeInStart
      );
      console.log("🔍 ScheduleForm Debug - timeInEnd:", scheduleData.timeInEnd);
      console.log(
        "🔍 ScheduleForm Debug - timeOutStart:",
        scheduleData.timeOutStart
      );
      console.log(
        "🔍 ScheduleForm Debug - timeOutEnd:",
        scheduleData.timeOutEnd
      );
      console.log(
        "🔍 ScheduleForm Debug - lateTimeIn:",
        scheduleData.lateTimeIn
      );

      const initialValues = {
        day: scheduleData.day || "",
        // Only use new range fields
        timeInStart: convertTo24Hour(scheduleData.timeInStart || ""),
        timeInEnd: convertTo24Hour(scheduleData.timeInEnd || ""),
        timeOutStart: convertTo24Hour(scheduleData.timeOutStart || ""),
        timeOutEnd: convertTo24Hour(scheduleData.timeOutEnd || ""),
        lateTimeIn: convertTo24Hour(scheduleData.lateTimeIn || ""),
        subjectId: scheduleData.subjectId || "",
        teacherId: scheduleData.teacherId || "",
        sectionId: scheduleData.sectionId || "",
      };

      console.log("🔍 ScheduleForm Debug - initialValues:", initialValues);
      return initialValues;
    } else {
      // Reset form for new schedule
      // If selectedDate is provided, pre-populate the day
      let dayValue = "";
      if (selectedDate) {
        const dateObj =
          selectedDate instanceof Date
            ? selectedDate
            : new Date(selectedDate + "T00:00:00");
        dayValue = dateObj.toLocaleDateString("en-US", { weekday: "long" });
      }

      return {
        day: dayValue,
        timeInStart: "",
        timeInEnd: "",
        timeOutStart: "",
        timeOutEnd: "",
        lateTimeIn: "",
        subjectId: "",
        teacherId: "",
        sectionId: "",
      };
    }
  };

  // Load data when form opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Load skills, teachers, and sections in parallel
      const [skillsResult, usersResult, sectionsResult] = await Promise.all([
        getAllSkills(),
        getAllUsers(),
        getAllSections(),
      ]);

      if (skillsResult.success) {
        setSkills(skillsResult.data);
      }

      if (usersResult.success) {
        // Filter for teachers only
        const teachers = usersResult.data.filter(
          (user) => user.role === "teacher"
        );
        setTeachers(teachers);
      }

      if (sectionsResult.success) {
        setSections(sectionsResult.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    // Debug logging
    console.log("🔍 ScheduleForm Debug - Form values:", values);

    // Convert 24-hour format back to 12-hour format for server - only new range fields
    const payload = {
      day: values.day,
      timeInStart: convertTo12Hour(values.timeInStart || ""),
      timeInEnd: convertTo12Hour(values.timeInEnd || ""),
      timeOutStart: convertTo12Hour(values.timeOutStart || ""),
      timeOutEnd: convertTo12Hour(values.timeOutEnd || ""),
      lateTimeIn: convertTo12Hour(values.lateTimeIn || ""),
      subjectId: values.subjectId,
      teacherId: values.teacherId,
      sectionId: values.sectionId,
    };

    console.log("🔍 ScheduleForm Debug - Payload being sent:", payload);
    await onSubmit(payload);
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
        {scheduleData ? "Edit Schedule" : "Add New Schedule"}
      </DialogTitle>

      {loadingData ? (
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      ) : (
        <Formik
          initialValues={getInitialValues()}
          validationSchema={scheduleSchema}
          onSubmit={handleSubmit}
          enableReinitialize
          validateOnChange={true}
          validateOnBlur={true}>
          {({ values, errors, touched, isSubmitting }) => (
            <Form>
              <DialogContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Day Selection */}
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="day">
                        {({ field, meta }) => (
                          <FormControl
                            fullWidth
                            required
                            error={meta.touched && Boolean(meta.error)}>
                            <InputLabel>Day</InputLabel>
                            <Select
                              {...field}
                              label="Day"
                              sx={{
                                borderRadius: "12px",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "hsl(152, 65%, 28%)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "hsl(152, 65%, 28%)",
                                  },
                              }}>
                              {dayOptions.map((day) => (
                                <MenuItem key={day} value={day}>
                                  {day}
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
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
                  </Box>

                  {/* Time Selection - Ranges */}
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {/* Time In Range */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                        <Field name="timeInStart">
                          {({ field, meta }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Start Time In"
                              type="time"
                              error={meta.touched && Boolean(meta.error)}
                              helperText={meta.touched && meta.error}
                              required
                              InputLabelProps={{ shrink: true }}
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
                      </Box>
                      <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                        <Field name="timeInEnd">
                          {({ field, meta }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="End Time In"
                              type="time"
                              error={meta.touched && Boolean(meta.error)}
                              helperText={meta.touched && meta.error}
                              InputLabelProps={{ shrink: true }}
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
                      </Box>
                      <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                        <Field name="lateTimeIn">
                          {({ field, meta }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Late Time In"
                              type="time"
                              error={meta.touched && Boolean(meta.error)}
                              helperText={meta.touched && meta.error}
                              InputLabelProps={{ shrink: true }}
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
                      </Box>
                    </Box>

                    {/* Time Out Range */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                        <Field name="timeOutStart">
                          {({ field, meta }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Start Time Out"
                              type="time"
                              error={meta.touched && Boolean(meta.error)}
                              helperText={meta.touched && meta.error}
                              InputLabelProps={{ shrink: true }}
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
                      </Box>
                      <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                        <Field name="timeOutEnd">
                          {({ field, meta }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="End Time Out"
                              type="time"
                              error={meta.touched && Boolean(meta.error)}
                              helperText={meta.touched && meta.error}
                              required
                              InputLabelProps={{ shrink: true }}
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
                      </Box>
                    </Box>
                  </Box>

                  {/* Skill Selection */}
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
                      <Field name="subjectId">
                        {({ field, meta }) => (
                          <FormControl
                            fullWidth
                            required
                            error={meta.touched && Boolean(meta.error)}>
                            <InputLabel>Skill</InputLabel>
                            <Select
                              {...field}
                              label="Skill"
                              sx={{
                                borderRadius: "12px",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "hsl(152, 65%, 28%)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "hsl(152, 65%, 28%)",
                                  },
                              }}>
                              {skills.map((skill) => (
                                <MenuItem key={skill.id} value={skill.id}>
                                  {skill.name} {skill.code && `(${skill.code})`}
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
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
                  </Box>

                  {/* Teacher Selection */}
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
                      <Field name="teacherId">
                        {({ field, meta }) => (
                          <FormControl
                            fullWidth
                            required
                            error={meta.touched && Boolean(meta.error)}>
                            <InputLabel>Assigned Teacher</InputLabel>
                            <Select
                              {...field}
                              label="Assigned Teacher"
                              sx={{
                                borderRadius: "12px",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "hsl(152, 65%, 28%)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "hsl(152, 65%, 28%)",
                                  },
                              }}>
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
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
                  </Box>

                  {/* Section Selection */}
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
                      <Field name="sectionId">
                        {({ field, meta }) => (
                          <FormControl
                            fullWidth
                            required
                            error={meta.touched && Boolean(meta.error)}>
                            <InputLabel>Daycare Center</InputLabel>
                            <Select
                              {...field}
                              label="Daycare Center"
                              sx={{
                                borderRadius: "12px",
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "hsl(152, 65%, 28%)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "hsl(152, 65%, 28%)",
                                  },
                              }}>
                              {sections.map((section) => (
                                <MenuItem key={section.id} value={section.id}>
                                  {section.name} - {section.grade}
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
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
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
                  ) : scheduleData ? (
                    "Update Schedule"
                  ) : (
                    "Create Schedule"
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      )}
    </Dialog>
  );
};

export default ScheduleForm;
