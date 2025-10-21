import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Field, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAllUsers } from "../utils/userService";
import { userFormSchema } from "../validation/schema";

// Role constants
const ROLES = {
  TEACHER: "teacher",
  PARENT: "parent",
  ADMIN: "admin",
};

const UserForm = ({
  open,
  onClose,
  onSubmit,
  userData = null,
  loading = false,
}) => {
  const { userProfile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [rfidError, setRfidError] = useState("");

  // Load all users when form opens
  useEffect(() => {
    if (open) {
      loadAllUsers();
    }
  }, [open]);

  const loadAllUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setAllUsers(result.data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  // Check if RFID is already registered to another user
  const checkRfidUniqueness = (rfid, currentUserId = null) => {
    if (!rfid || !rfid.trim()) {
      setRfidError("");
      return true;
    }

    const trimmedRfid = rfid.trim();
    const existingUser = allUsers.find(
      (user) =>
        user.childRFID === trimmedRfid &&
        user.uid !== currentUserId &&
        user.role === "parent"
    );

    if (existingUser) {
      setRfidError(
        `RFID "${trimmedRfid}" is already registered to ${existingUser.firstName} ${existingUser.lastName}`
      );
      return false;
    } else {
      setRfidError("");
      return true;
    }
  };

  const getInitialValues = () => {
    if (userData) {
      return {
        firstName: userData.firstName || "",
        middleName: userData.middleName || "",
        lastName: userData.lastName || "",
        suffix: userData.suffix || "",
        email: userData.email || "",
        phone: userData.phone || "",
        password: userData.password || "", // ⚠️ Display stored password for admin
        confirmPassword: userData.password || "", // ⚠️ Pre-fill confirm password
        role: userData.role || ROLES.TEACHER,
        // Child Information
        childFirstName: userData.childFirstName || "",
        childMiddleName: userData.childMiddleName || "",
        childLastName: userData.childLastName || "",
        childRFID: userData.childRFID || "",
        childSex: userData.childSex || "",
        childBirthMonth: userData.childBirthMonth || "",
        childBirthDay: userData.childBirthDay || "",
        childBirthYear: userData.childBirthYear || "",
        address: userData.address || "",
        barangay: userData.barangay || "",
        municipality: userData.municipality || "",
        province: userData.province || "",
        region: userData.region || "",
        childHandedness: userData.childHandedness || "",
        isStudying: userData.isStudying || "",
        schoolName: userData.schoolName || "",
        numberOfSiblings: userData.numberOfSiblings || "",
        birthOrder: userData.birthOrder || "",
        // Father Information
        fatherFirstName: userData.fatherFirstName || "",
        fatherMiddleName: userData.fatherMiddleName || "",
        fatherLastName: userData.fatherLastName || "",
        fatherAge: userData.fatherAge || "",
        fatherOccupation: userData.fatherOccupation || "",
        fatherEducation: userData.fatherEducation || "",
        // Mother Information
        motherFirstName: userData.motherFirstName || "",
        motherMiddleName: userData.motherMiddleName || "",
        motherLastName: userData.motherLastName || "",
        motherAge: userData.motherAge || "",
        motherOccupation: userData.motherOccupation || "",
        motherEducation: userData.motherEducation || "",
      };
    } else {
      return {
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role:
          userProfile && userProfile.role === "teacher"
            ? ROLES.PARENT
            : ROLES.TEACHER,
        // Child Information
        childFirstName: "",
        childMiddleName: "",
        childLastName: "",
        childRFID: "",
        childSex: "",
        childBirthMonth: "",
        childBirthDay: "",
        childBirthYear: "",
        address: "",
        barangay: "",
        municipality: "",
        province: "",
        region: "",
        childHandedness: "",
        isStudying: "",
        schoolName: "",
        numberOfSiblings: "",
        birthOrder: "",
        // Father Information
        fatherFirstName: "",
        fatherMiddleName: "",
        fatherLastName: "",
        fatherAge: "",
        fatherOccupation: "",
        fatherEducation: "",
        // Mother Information
        motherFirstName: "",
        motherMiddleName: "",
        motherLastName: "",
        motherAge: "",
        motherOccupation: "",
        motherEducation: "",
      };
    }
  };

  // Get available roles based on user permissions
  const getAvailableRoles = () => {
    if (userProfile && userProfile.role === "teacher") {
      // Teachers can only create parents
      return [{ value: ROLES.PARENT, label: "Parent" }];
    }
    return [
      { value: ROLES.TEACHER, label: "Teacher" },
      { value: ROLES.PARENT, label: "Parent" },
      { value: ROLES.ADMIN, label: "Admin" },
    ];
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    // Check RFID uniqueness before submission
    if (values.role === ROLES.PARENT && values.childRFID) {
      const isRfidUnique = checkRfidUniqueness(values.childRFID, userData?.uid);
      if (!isRfidUnique) {
        setSubmitting(false);
        return;
      }
    }

    await onSubmit(values);
    setSubmitting(false);
  };

  // Check if teacher is trying to create a new user (only allowed for parents)
  const isTeacherCreatingNewUser =
    userProfile && userProfile.role === "teacher" && !userData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        },
      }}>
      <DialogTitle sx={{ flexShrink: 0, pb: 1 }}>
        {userData ? "Edit User" : "Add New User"}
      </DialogTitle>
      {isTeacherCreatingNewUser && (
        <Alert severity="info" sx={{ m: 2, mt: 0, flexShrink: 0 }}>
          Teachers can create and edit parent accounts.
        </Alert>
      )}
      <Formik
        initialValues={getInitialValues()}
        validationSchema={userFormSchema}
        onSubmit={handleSubmit}
        enableReinitialize
        validateOnChange={true}
        validateOnBlur={true}
        context={{ isNewUser: !userData }}>
        {({ values, errors, touched, isSubmitting }) => (
          <Form
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}>
            <DialogContent
              sx={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                py: 2,
              }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Basic User Information */}
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: "primary.main",
                      fontFamily: "Plus Jakarta Sans, sans-serif",
                      fontWeight: 700,
                    }}>
                    User Information
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="firstName">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="First Name"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            required
                          />
                        )}
                      </Field>
                    </Box>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="middleName">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Middle Name"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                    </Box>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="lastName">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Last Name"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            required
                          />
                        )}
                      </Field>
                    </Box>
                    <Box sx={{ flex: "1 1 150px", minWidth: "150px" }}>
                      <Field name="suffix">
                        {({ field, meta }) => (
                          <FormControl
                            fullWidth
                            error={meta.touched && Boolean(meta.error)}>
                            <InputLabel>Suffix</InputLabel>
                            <Select {...field} label="Suffix">
                              <MenuItem value="">None</MenuItem>
                              <MenuItem value="Jr.">Jr.</MenuItem>
                              <MenuItem value="Sr.">Sr.</MenuItem>
                              <MenuItem value="II">II</MenuItem>
                              <MenuItem value="III">III</MenuItem>
                              <MenuItem value="IV">IV</MenuItem>
                              <MenuItem value="V">V</MenuItem>
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

                  <Box
                    sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="email">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Email"
                            type="email"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            required
                          />
                        )}
                      </Field>
                    </Box>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="phone">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Phone"
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            required
                          />
                        )}
                      </Field>
                    </Box>
                  </Box>

                  {/* Password fields - Always show for new users, show for admins when editing */}
                  <Box
                    sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="password">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={
                              userData
                                ? "Password (Admin can view/edit)"
                                : "Password"
                            }
                            type={showPassword ? "text" : "password"}
                            error={meta.touched && Boolean(meta.error)}
                            helperText={
                              meta.touched && meta.error ? meta.error : ""
                            }
                            required={!userData}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                    edge="end"
                                    tabIndex={-1}>
                                    {showPassword ? (
                                      <VisibilityOff />
                                    ) : (
                                      <Visibility />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: userData
                                  ? "rgba(255, 152, 0, 0.05)"
                                  : "transparent",
                              },
                            }}
                          />
                        )}
                      </Field>
                    </Box>
                    <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Confirm Password"
                            type={showConfirmPassword ? "text" : "password"}
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            required={
                              !userData &&
                              values.password &&
                              values.password.length > 0
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                    edge="end"
                                    tabIndex={-1}>
                                    {showConfirmPassword ? (
                                      <VisibilityOff />
                                    ) : (
                                      <Visibility />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: userData
                                  ? "rgba(255, 152, 0, 0.05)"
                                  : "transparent",
                              },
                            }}
                          />
                        )}
                      </Field>
                    </Box>
                  </Box>

                  {/* Only show role field for non-teachers or when creating new users */}
                  {(!userProfile ||
                    userProfile.role !== "teacher" ||
                    !userData) && (
                    <Box
                      sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
                      <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                        <Field name="role">
                          {({ field, meta }) => (
                            <FormControl
                              fullWidth
                              error={meta.touched && Boolean(meta.error)}>
                              <InputLabel>Role</InputLabel>
                              <Select {...field} label="Role">
                                {getAvailableRoles().map((role) => (
                                  <MenuItem key={role.value} value={role.value}>
                                    {role.label}
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
                  )}
                </Box>

                {/* Child Information - Only show for parent role */}
                {values.role === ROLES.PARENT && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          color: "primary.main",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 700,
                        }}>
                        Child Information
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="childFirstName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Child's First Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="childRFID">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Child RFID ID"
                                placeholder="Scan child's RFID card"
                                error={
                                  (meta.touched && Boolean(meta.error)) ||
                                  Boolean(rfidError)
                                }
                                helperText={
                                  meta.touched && meta.error
                                    ? meta.error
                                    : rfidError
                                    ? rfidError
                                    : ""
                                }
                                required
                                inputProps={{
                                  inputMode: "text",
                                  autoComplete: "off",
                                }}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Check RFID uniqueness in real-time
                                  checkRfidUniqueness(
                                    e.target.value,
                                    userData?.uid
                                  );
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    backgroundColor: rfidError
                                      ? "rgba(244, 67, 54, 0.05)"
                                      : "transparent",
                                  },
                                }}
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="childMiddleName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Child's Middle Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="childLastName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Child's Last Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="childSex">
                            {({ field, meta }) => (
                              <FormControl
                                fullWidth
                                error={meta.touched && Boolean(meta.error)}>
                                <InputLabel>Sex</InputLabel>
                                <Select {...field} label="Sex">
                                  <MenuItem value="Male">Male</MenuItem>
                                  <MenuItem value="Female">Female</MenuItem>
                                </Select>
                                {meta.touched && meta.error && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ mt: 0.5, ml: 1.5 }}>
                                    {meta.error}
                                  </Typography>
                                )}
                              </FormControl>
                            )}
                          </Field>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ width: "100%", mb: 1 }}>
                          Date of Birth
                        </Typography>
                        <Box sx={{ flex: "1 1 100px", minWidth: "100px" }}>
                          <Field name="childBirthMonth">
                            {({ field, meta }) => (
                              <FormControl
                                fullWidth
                                error={meta.touched && Boolean(meta.error)}>
                                <InputLabel>Month</InputLabel>
                                <Select {...field} label="Month">
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <MenuItem key={i + 1} value={i + 1}>
                                      {new Date(0, i).toLocaleString(
                                        "default",
                                        { month: "long" }
                                      )}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {meta.touched && meta.error && (
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ mt: 0.5, ml: 1.5 }}>
                                    {meta.error}
                                  </Typography>
                                )}
                              </FormControl>
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 100px", minWidth: "100px" }}>
                          <Field name="childBirthDay">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Day"
                                type="number"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                                inputProps={{ min: 1, max: 31 }}
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 100px", minWidth: "100px" }}>
                          <Field name="childBirthYear">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Year"
                                type="number"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                                inputProps={{
                                  min: 1900,
                                  max: new Date().getFullYear(),
                                }}
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="address">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Address"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="barangay">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Barangay"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="municipality">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Municipality/City"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="province">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Province"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="region">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Region"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box
                          sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Field name="childHandedness">
                          {({ field, meta }) => (
                            <FormControl
                              error={meta.touched && Boolean(meta.error)}>
                              <FormLabel>Child's Handedness</FormLabel>
                              <RadioGroup {...field} row>
                                <FormControlLabel
                                  value="Right"
                                  control={<Radio />}
                                  label="Right"
                                />
                                <FormControlLabel
                                  value="Left"
                                  control={<Radio />}
                                  label="Left"
                                />
                                <FormControlLabel
                                  value="Both"
                                  control={<Radio />}
                                  label="Both"
                                />
                                <FormControlLabel
                                  value="Not yet established"
                                  control={<Radio />}
                                  label="Not yet established"
                                />
                              </RadioGroup>
                              {meta.touched && meta.error && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  sx={{ mt: 0.5, ml: 1.5 }}>
                                  {meta.error}
                                </Typography>
                              )}
                            </FormControl>
                          )}
                        </Field>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Field name="isStudying">
                          {({ field, meta }) => (
                            <FormControl
                              error={meta.touched && Boolean(meta.error)}>
                              <FormLabel>
                                Is the child presently studying?
                              </FormLabel>
                              <RadioGroup {...field} row>
                                <FormControlLabel
                                  value="Yes"
                                  control={<Radio />}
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="No"
                                  control={<Radio />}
                                  label="No"
                                />
                              </RadioGroup>
                              {meta.touched && meta.error && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  sx={{ mt: 0.5, ml: 1.5 }}>
                                  {meta.error}
                                </Typography>
                              )}
                            </FormControl>
                          )}
                        </Field>
                      </Box>

                      {values.isStudying === "Yes" && (
                        <Box sx={{ mt: 2 }}>
                          <Field name="schoolName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Name of child's school / learning center / day care"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="numberOfSiblings">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Child's Number of Siblings"
                                type="number"
                                inputProps={{ min: 0 }}
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="birthOrder">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Child's Birth Order (1st, 2nd, 3rd, etc.)"
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>
                    </Box>

                    <Divider />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          color: "primary.main",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 700,
                        }}>
                        Father Information
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="fatherFirstName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Father's First Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="fatherMiddleName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Father's Middle Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="fatherLastName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Father's Last Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="fatherAge">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Father's Age"
                                type="number"
                                inputProps={{ min: 1, max: 120 }}
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="fatherOccupation">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Father's Occupation"
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="fatherEducation">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Father's Educational Attainment"
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>
                    </Box>

                    <Divider />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          color: "primary.main",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          fontWeight: 700,
                        }}>
                        Mother Information
                      </Typography>

                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="motherFirstName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Mother's First Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="motherMiddleName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Mother's Middle Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="motherLastName">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Mother's Last Name"
                                error={meta.touched && Boolean(meta.error)}
                                helperText={meta.touched && meta.error}
                                required
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="motherAge">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Mother's Age"
                                type="number"
                                inputProps={{ min: 1, max: 120 }}
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 2,
                        }}>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="motherOccupation">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Mother's Occupation"
                              />
                            )}
                          </Field>
                        </Box>
                        <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
                          <Field name="motherEducation">
                            {({ field, meta }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Mother's Educational Attainment"
                              />
                            )}
                          </Field>
                        </Box>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ flexShrink: 0, p: 3, pt: 2 }}>
              <Button onClick={onClose} disabled={loading || isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  loading ||
                  isSubmitting ||
                  Object.keys(errors).length > 0 ||
                  Boolean(rfidError)
                }
                sx={{
                  background:
                    "linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
                }}>
                {loading || isSubmitting ? (
                  <CircularProgress size={24} />
                ) : userData ? (
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

export default UserForm;
