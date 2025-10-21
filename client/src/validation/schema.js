import * as yup from "yup";

// Common validation patterns
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phonePattern = /^[0-9]+$/; // Only integers allowed for mobile numbers
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const addressPattern = /^[a-zA-Z0-9\s,.]*$/; // Only letters, numbers, spaces, commas, and periods allowed
const namePattern = /^[a-zA-Z\s]+$/; // Only letters and spaces for names
const alphanumericPattern = /^[a-zA-Z0-9\s]+$/; // Letters, numbers, and spaces
const textPattern = /^[a-zA-Z0-9\s.,!?()-]*$/; // Common text characters
const codePattern = /^[A-Z0-9_-]+$/; // Uppercase letters, numbers, underscore, dash

// Login validation schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .matches(emailPattern, "Please enter a valid email address")
    .trim(),
  password: yup
    .string()
    .required("Password is required")

    .trim(),
});

// Signup validation schema
export const signupSchema = yup.object({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
    .trim(),

  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces")
    .trim(),

  email: yup
    .string()
    .required("Email is required")
    .matches(emailPattern, "Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim(),

  phone: yup
    .string()
    .required("Phone number is required")
    .matches(
      phonePattern,
      "Phone number must contain only numbers (no spaces, dashes, or special characters)"
    )
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be no more than 15 digits")
    .trim(),

  organization: yup
    .string()
    .required("Organization is required")
    .min(2, "Organization must be at least 2 characters")
    .max(100, "Organization must be less than 100 characters")
    .trim(),

  role: yup
    .string()
    .required("Role is required")
    .oneOf(
      ["admin", "teacher", "staff", "parent"],
      "Please select a valid role"
    ),

  address: yup
    .string()
    .matches(
      addressPattern,
      "Address can only contain letters, numbers, spaces, commas, and periods"
    )
    .trim(),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .matches(
      passwordPattern,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .trim(),

  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .trim(),
});

// Password reset validation schema
export const passwordResetSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .matches(emailPattern, "Please enter a valid email address")
    .trim(),
});

// Profile update validation schema (for existing users)
export const profileUpdateSchema = yup.object({
  firstName: yup
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "First name can only contain letters and spaces")
    .trim(),

  lastName: yup
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Last name can only contain letters and spaces")
    .trim(),

  phone: yup
    .string()
    .matches(
      phonePattern,
      "Phone number must contain only numbers (no spaces, dashes, or special characters)"
    )
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be no more than 15 digits")
    .trim(),

  organization: yup
    .string()
    .min(2, "Organization must be at least 2 characters")
    .max(100, "Organization must be less than 100 characters")
    .trim(),

  role: yup
    .string()
    .oneOf(
      ["admin", "teacher", "staff", "parent"],
      "Please select a valid role"
    ),
});

// Change password validation schema
export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required("Current password is required").trim(),

  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .matches(
      passwordPattern,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .trim(),

  confirmNewPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword"), null], "Passwords must match")
    .trim(),
});

// Assignment validation schema
export const assignmentSchema = yup.object({
  title: yup
    .string()
    .required("Assignment title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .trim(),

  description: yup
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim(),

  points: yup
    .number()
    .required("Points are required")
    .min(1, "Points must be at least 1")
    .max(1000, "Points must be no more than 1000")
    .integer("Points must be a whole number"),

  dueDate: yup.date().required("Due date is required"),

  instructions: yup
    .string()
    .max(1000, "Instructions must be less than 1000 characters")
    .trim(),
});

// Lesson validation schema
export const lessonSchema = yup.object({
  title: yup
    .string()
    .required("Lesson title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .trim(),

  description: yup
    .string()
    .max(500, "Description must be less than 500 characters")
    .trim(),

  order: yup
    .number()
    .required("Order is required")
    .min(1, "Order must be at least 1")
    .max(999, "Order must be no more than 999")
    .integer("Order must be a whole number"),

  content: yup
    .string()
    .max(5000, "Content must be less than 5000 characters")
    .trim(),
});

// Skill validation schema
export const skillSchema = yup.object({
  name: yup
    .string()
    .required("Skill name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .matches(namePattern, "Name can only contain letters and spaces")
    .trim(),

  code: yup
    .string()
    .required("Skill code is required")
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be less than 20 characters")
    .matches(
      codePattern,
      "Code can only contain uppercase letters, numbers, underscore, and dash"
    )
    .trim(),

  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(200, "Description must be less than 200 characters")
    .trim(),
});

// Section validation schema
export const sectionSchema = yup.object({
  name: yup
    .string()
    .required("Daycare level is required")
    .oneOf(
      [
        "Daycare Center K1",
        "Daycare Center K2",
        "Daycare Center K3",
        "Daycare Center K4",
      ],
      "Please select a valid daycare level"
    ),

  capacity: yup
    .number()
    .min(0, "Capacity must be at least 0")
    .integer("Capacity must be a whole number"),

  teacherId: yup.string().required("Teacher must be assigned"),

  description: yup
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(200, "Description must be less than 200 characters")
    .trim(),
});

// Schedule validation schema
export const scheduleSchema = yup.object({
  day: yup
    .string()
    .required("Day is required")
    .oneOf(
      [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      "Please select a valid day"
    ),

  // New range fields
  timeInStart: yup
    .string()
    .required("Start Time In is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter time as HH:MM"),

  timeInEnd: yup
    .string()
    .matches(/^$|^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter time as HH:MM")
    .test(
      "in-range",
      "End Time In must be after Start Time In",
      function (value) {
        const { timeInStart } = this.parent;
        if (!timeInStart || !value) return true;
        return (
          new Date(`2000-01-01T${value}`) >
          new Date(`2000-01-01T${timeInStart}`)
        );
      }
    ),

  lateTimeIn: yup
    .string()
    .matches(/^$|^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter time as HH:MM")
    .test(
      "late-after-endIn",
      "Late Time In must be after End Time In",
      function (value) {
        const { timeInEnd } = this.parent;
        if (!value || !timeInEnd) return true;
        return (
          new Date(`2000-01-01T${value}`) > new Date(`2000-01-01T${timeInEnd}`)
        );
      }
    ),

  timeOutStart: yup
    .string()
    .matches(/^$|^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter time as HH:MM")
    .test(
      "out-after-in",
      "Start Time Out must be after End Time In",
      function (value) {
        const { timeInEnd } = this.parent;
        if (!value || !timeInEnd) return true;
        return (
          new Date(`2000-01-01T${value}`) > new Date(`2000-01-01T${timeInEnd}`)
        );
      }
    ),

  timeOutEnd: yup
    .string()
    .required("End Time Out is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Enter time as HH:MM")
    .test(
      "out-range",
      "End Time Out must be after Start Time Out",
      function (value) {
        const { timeOutStart } = this.parent;
        if (!value || !timeOutStart) return true;
        return (
          new Date(`2000-01-01T${value}`) >
          new Date(`2000-01-01T${timeOutStart}`)
        );
      }
    ),

  subjectId: yup.string().required("Subject is required"),

  teacherId: yup.string().required("Teacher is required"),
});

// Module validation schema
export const moduleSchema = yup.object({
  title: yup
    .string()
    .required("Module title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .matches(
      textPattern,
      "Title can only contain letters, numbers, spaces, and common punctuation"
    )
    .trim(),

  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .trim(),

  order: yup
    .number()
    .required("Order is required")
    .min(1, "Order must be at least 1")
    .max(999, "Order must be no more than 999")
    .integer("Order must be a whole number"),
});

// Contact form validation schema
export const contactSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .matches(namePattern, "Name can only contain letters and spaces")
    .trim(),

  email: yup
    .string()
    .required("Email is required")
    .matches(emailPattern, "Please enter a valid email address")
    .trim(),

  subject: yup
    .string()
    .required("Subject is required")
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be less than 100 characters")
    .trim(),

  message: yup
    .string()
    .required("Message is required")
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters")
    .trim(),
});

// User form validation schema (for creating/editing users with optional child info)
export const userFormSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .matches(namePattern, "First name can only contain letters and spaces")
    .trim(),

  middleName: yup
    .string()
    .min(2, "Middle name must be at least 2 characters")
    .max(50, "Middle name must be less than 50 characters")
    .matches(namePattern, "Middle name can only contain letters and spaces")
    .trim()
    .notRequired(),

  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .matches(namePattern, "Last name can only contain letters and spaces")
    .trim(),

  suffix: yup.string().notRequired(),

  email: yup
    .string()
    .required("Email is required")
    .matches(emailPattern, "Please enter a valid email address")
    .trim(),

  phone: yup
    .string()
    .required("Phone number is required")
    .matches(
      phonePattern,
      "Phone number must contain only numbers (no spaces, dashes, or special characters)"
    )
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be no more than 15 digits")
    .trim(),

  password: yup.string().when("$isNewUser", {
    is: true,
    then: (schema) =>
      schema
        .required("Password is required")
        .min(8, "Password must be at least 8 characters"),
    otherwise: (schema) =>
      schema.min(8, "Password must be at least 8 characters").notRequired(),
  }),

  confirmPassword: yup.string().when(["password", "$isNewUser"], {
    is: (password, isNewUser) => password && password.length > 0,
    then: (schema) =>
      schema
        .required("Please confirm your password")
        .oneOf([yup.ref("password"), null], "Passwords must match"),
    otherwise: (schema) => schema.notRequired(),
  }),

  role: yup
    .string()
    .required("Role is required")
    .oneOf(
      ["admin", "teacher", "staff", "parent"],
      "Please select a valid role"
    ),

  // Child information (conditional - only for parent role)
  childFirstName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Child first name is required")
        .min(2, "Child first name must be at least 2 characters")
        .matches(
          namePattern,
          "Child first name can only contain letters and spaces"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  childMiddleName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .min(2, "Child middle name must be at least 2 characters")
        .matches(
          namePattern,
          "Child middle name can only contain letters and spaces"
        )
        .trim()
        .notRequired(),
    otherwise: (schema) => schema.notRequired(),
  }),

  childLastName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Child last name is required")
        .min(2, "Child last name must be at least 2 characters")
        .matches(
          namePattern,
          "Child last name can only contain letters and spaces"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  // Child RFID (required for parent)
  childRFID: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Child RFID is required")
        .max(64, "RFID must be at most 64 characters")
        .trim()
        .test(
          "rfid-uniqueness",
          "This RFID is already registered to another user",
          function (value) {
            // This will be handled by the component-level validation
            // The schema validation is kept for basic format validation
            return true;
          }
        ),
    otherwise: (schema) => schema.notRequired(),
  }),

  childSex: yup.string().when("role", {
    is: "parent",
    then: (schema) => schema.required("Child sex is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  childBirthMonth: yup.number().when("role", {
    is: "parent",
    then: (schema) => schema.required("Birth month is required").min(1).max(12),
    otherwise: (schema) => schema.notRequired(),
  }),

  childBirthDay: yup.number().when("role", {
    is: "parent",
    then: (schema) => schema.required("Birth day is required").min(1).max(31),
    otherwise: (schema) => schema.notRequired(),
  }),

  childBirthYear: yup.number().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Birth year is required")
        .min(1900)
        .max(new Date().getFullYear()),
    otherwise: (schema) => schema.notRequired(),
  }),

  address: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Address is required")
        .matches(
          addressPattern,
          "Address can only contain letters, numbers, spaces, commas, and periods"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  barangay: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Barangay is required")
        .matches(
          addressPattern,
          "Barangay can only contain letters, numbers, spaces, commas, and periods"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  municipality: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Municipality/City is required")
        .matches(
          addressPattern,
          "Municipality/City can only contain letters, numbers, spaces, commas, and periods"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  province: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Province is required")
        .matches(
          addressPattern,
          "Province can only contain letters, numbers, spaces, commas, and periods"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  region: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Region is required")
        .matches(
          addressPattern,
          "Region can only contain letters, numbers, spaces, commas, and periods"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  childHandedness: yup.string().when("role", {
    is: "parent",
    then: (schema) => schema.required("Child handedness is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  isStudying: yup.string().when("role", {
    is: "parent",
    then: (schema) => schema.required("Please specify if child is studying"),
    otherwise: (schema) => schema.notRequired(),
  }),

  schoolName: yup.string().when(["role", "isStudying"], {
    is: (role, isStudying) => role === "parent" && isStudying === "Yes",
    then: (schema) =>
      schema.required("School name is required when child is studying"),
    otherwise: (schema) => schema.notRequired(),
  }),

  fatherFirstName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Father first name is required")
        .min(2, "Father first name must be at least 2 characters")
        .matches(
          namePattern,
          "Father first name can only contain letters and spaces"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  fatherMiddleName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .min(2, "Father middle name must be at least 2 characters")
        .matches(
          namePattern,
          "Father middle name can only contain letters and spaces"
        )
        .trim()
        .notRequired(),
    otherwise: (schema) => schema.notRequired(),
  }),

  fatherLastName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Father last name is required")
        .min(2, "Father last name must be at least 2 characters")
        .matches(
          namePattern,
          "Father last name can only contain letters and spaces"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  motherFirstName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Mother first name is required")
        .min(2, "Mother first name must be at least 2 characters")
        .matches(
          namePattern,
          "Mother first name can only contain letters and spaces"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),

  motherMiddleName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .min(2, "Mother middle name must be at least 2 characters")
        .matches(
          namePattern,
          "Mother middle name can only contain letters and spaces"
        )
        .trim()
        .notRequired(),
    otherwise: (schema) => schema.notRequired(),
  }),

  motherLastName: yup.string().when("role", {
    is: "parent",
    then: (schema) =>
      schema
        .required("Mother last name is required")
        .min(2, "Mother last name must be at least 2 characters")
        .matches(
          namePattern,
          "Mother last name can only contain letters and spaces"
        )
        .trim(),
    otherwise: (schema) => schema.notRequired(),
  }),
});

// Export all schemas
export default {
  loginSchema,
  signupSchema,
  passwordResetSchema,
  profileUpdateSchema,
  changePasswordSchema,
  assignmentSchema,
  lessonSchema,
  skillSchema,
  sectionSchema,
  scheduleSchema,
  moduleSchema,
  contactSchema,
  userFormSchema,
};
