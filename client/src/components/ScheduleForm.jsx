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
	existingSchedules = [], // Add existing schedules for conflict checking
}) => {
	// Log when form receives props
	console.log("🔍 ScheduleForm - Component rendered with props:", {
		open,
		existingSchedules: existingSchedules.length,
		scheduleData: scheduleData ? scheduleData.id : null,
	});

	const [skills, setSkills] = useState([]);
	const [teachers, setTeachers] = useState([]);
	const [sections, setSections] = useState([]);
	const [loadingData, setLoadingData] = useState(false);
	const [conflictChecked, setConflictChecked] = useState(false);
	const [hasConflict, setHasConflict] = useState(false);
	const [conflictMessage, setConflictMessage] = useState("");
	const [lastCheckedValues, setLastCheckedValues] = useState(null);

	// Day options (Monday to Friday only)
	const dayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
				timeIn: convertTo24Hour(
					scheduleData.timeInStart || scheduleData.timeIn || ""
				),
				timeOut: convertTo24Hour(
					scheduleData.timeOutEnd || scheduleData.timeOut || ""
				),
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
				timeIn: "",
				timeOut: "",
				subjectId: "",
				teacherId: "",
				sectionId: "",
			};
		}
	};

	// Track when existingSchedules prop changes
	useEffect(() => {
		console.log("🔍 ScheduleForm - existingSchedules prop changed:", {
			length: existingSchedules.length,
			schedules: existingSchedules,
		});
	}, [existingSchedules]);

	// Load data when form opens
	useEffect(() => {
		if (open) {
			loadData();
			// Reset conflict check when form opens
			setConflictChecked(false);
			setHasConflict(false);
			setConflictMessage("");

			// Debug: Log existing schedules when form opens
			console.log(
				"🔍 ScheduleForm - Form opened with existingSchedules:",
				existingSchedules
			);
			console.log(
				"🔍 ScheduleForm - Number of schedules:",
				existingSchedules.length
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]); // Only depend on 'open' to avoid infinite loop

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

	// Check for schedule conflicts
	const checkForConflicts = (values) => {
		console.log("🔍 Conflict Check - Starting check with values:", values);
		console.log("🔍 Conflict Check - Existing schedules:", existingSchedules);

		// Convert time strings to minutes for comparison
		const timeToMinutes = (timeStr) => {
			if (!timeStr) return 0;
			// Handle both 12-hour and 24-hour formats
			if (timeStr.includes("AM") || timeStr.includes("PM")) {
				const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
				if (match) {
					let hours = parseInt(match[1]);
					const minutes = parseInt(match[2]);
					const period = match[3].toUpperCase();
					if (period === "PM" && hours !== 12) hours += 12;
					if (period === "AM" && hours === 12) hours = 0;
					return hours * 60 + minutes;
				}
			} else if (timeStr.includes(":")) {
				const [hours, minutes] = timeStr.split(":");
				return parseInt(hours) * 60 + parseInt(minutes);
			}
			return 0;
		};

		const rangesOverlap = (start1, end1, start2, end2) => {
			return start1 < end2 && start2 < end1;
		};

		// Convert form values to 12-hour format for comparison
		const newStart = timeToMinutes(convertTo12Hour(values.timeIn));
		const newEnd = timeToMinutes(convertTo12Hour(values.timeOut));
		const newDay = values.day;
		const newTeacher = values.teacherId;
		const newSection = values.sectionId;

		console.log("🔍 Conflict Check - New schedule:", {
			day: newDay,
			timeIn: values.timeIn,
			timeOut: values.timeOut,
			convertedTimeIn: convertTo12Hour(values.timeIn),
			convertedTimeOut: convertTo12Hour(values.timeOut),
			startMinutes: newStart,
			endMinutes: newEnd,
			teacherId: newTeacher,
			sectionId: newSection,
		});

		// Check against all existing schedules
		for (const schedule of existingSchedules) {
			// Skip if comparing with itself (when editing)
			if (scheduleData && schedule.id === scheduleData.id) {
				console.log("🔍 Conflict Check - Skipping self:", schedule.id);
				continue;
			}

			console.log("🔍 Conflict Check - Checking against schedule:", schedule);

			// Only check schedules on the same day
			if (schedule.day !== newDay) {
				console.log("🔍 Conflict Check - Different day, skipping");
				continue;
			}

			// FIXED: Only check if same teacher OR same section
			// Different daycare centers (sections) should be allowed
			const sameTeacher = schedule.teacherId === newTeacher;
			const sameSection = schedule.sectionId === newSection;

			console.log("🔍 Conflict Check - Teacher/Section match:", {
				sameTeacher,
				sameSection,
			});

			// If different teacher AND different section, no conflict
			if (!sameTeacher && !sameSection) {
				console.log(
					"🔍 Conflict Check - Different teacher AND section, skipping"
				);
				continue;
			}

			// Check time overlap - handle both old and new field formats
			// Old format: timeInStart/timeOutEnd
			// New format: timeIn/timeOut
			const existingTimeIn = schedule.timeIn || schedule.timeInStart;
			const existingTimeOut = schedule.timeOut || schedule.timeOutEnd;

			const existingStart = timeToMinutes(existingTimeIn);
			const existingEnd = timeToMinutes(existingTimeOut);

			console.log("🔍 Conflict Check - Time comparison:", {
				newStart,
				newEnd,
				existingTimeIn,
				existingTimeOut,
				existingStart,
				existingEnd,
				overlaps: rangesOverlap(newStart, newEnd, existingStart, existingEnd),
			});

			if (rangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
				const skillName =
					skills.find((s) => s.id === schedule.subjectId)?.name || "Unknown";
				const sectionName =
					sections.find((s) => s.id === schedule.sectionId)?.name || "Unknown";

				const displayTimeIn = existingTimeIn;
				const displayTimeOut = existingTimeOut;
				const conflictMsg = `Conflict detected! ${skillName} at ${sectionName} on ${schedule.day} (${displayTimeIn} - ${displayTimeOut})`;
				console.log("🔍 Conflict Check - CONFLICT FOUND:", conflictMsg);

				return {
					hasConflict: true,
					message: conflictMsg,
				};
			}
		}

		console.log("🔍 Conflict Check - No conflicts found");
		return {
			hasConflict: false,
			message: "No conflicts found. Schedule is valid!",
		};
	};

	const handleCheckConflicts = (values) => {
		console.log("🔍 handleCheckConflicts - Called with values:", values);
		console.log(
			"🔍 handleCheckConflicts - existingSchedules prop:",
			existingSchedules
		);
		console.log(
			"🔍 handleCheckConflicts - existingSchedules length:",
			existingSchedules.length
		);

		// If no existing schedules, show warning but allow
		if (existingSchedules.length === 0) {
			console.warn(
				"⚠️ No existing schedules loaded - conflict check may not be accurate!"
			);
		}

		const result = checkForConflicts(values);
		setHasConflict(result.hasConflict);
		setConflictMessage(result.message);
		setConflictChecked(true);

		// Store the values we just checked
		setLastCheckedValues({
			day: values.day,
			timeIn: values.timeIn,
			timeOut: values.timeOut,
			teacherId: values.teacherId,
			sectionId: values.sectionId,
		});
	};

	// Helper function to check if form values have changed since last check
	const valuesHaveChanged = (currentValues) => {
		if (!lastCheckedValues) return true;

		return (
			currentValues.day !== lastCheckedValues.day ||
			currentValues.timeIn !== lastCheckedValues.timeIn ||
			currentValues.timeOut !== lastCheckedValues.timeOut ||
			currentValues.teacherId !== lastCheckedValues.teacherId ||
			currentValues.sectionId !== lastCheckedValues.sectionId
		);
	};

	const handleSubmit = async (values, { setSubmitting }) => {
		// Debug logging
		console.log("🔍 ScheduleForm Debug - Form values:", values);

		// Convert 24-hour format back to 12-hour format for server
		// Send both old and new field names for backward compatibility
		const payload = {
			day: values.day,
			// New simplified fields
			timeIn: convertTo12Hour(values.timeIn || ""),
			timeOut: convertTo12Hour(values.timeOut || ""),
			// Old range fields for backward compatibility
			timeInStart: convertTo12Hour(values.timeIn || ""),
			timeOutEnd: convertTo12Hour(values.timeOut || ""),
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
			}}
		>
			<DialogTitle
				sx={{
					background:
						"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
					backgroundClip: "text",
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					fontWeight: 700,
					fontSize: "1.5rem",
				}}
			>
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
					validateOnBlur={true}
				>
					{({ isSubmitting, values }) => (
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
														error={meta.touched && Boolean(meta.error)}
													>
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
															}}
														>
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
																sx={{ mt: 0.5, ml: 1.75 }}
															>
																{meta.error}
															</Typography>
														)}
													</FormControl>
												)}
											</Field>
										</Box>
										<Box sx={{ flex: "1 1 200px", minWidth: "200px" }}></Box>
									</Box>

									{/* Time Selection */}
									<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
										<Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
											<Field name="timeIn">
												{({ field, meta }) => (
													<TextField
														{...field}
														fullWidth
														label="Time In"
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
											<Field name="timeOut">
												{({ field, meta }) => (
													<TextField
														{...field}
														fullWidth
														label="Time Out"
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

									{/* Skill Selection */}
									<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
										<Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
											<Field name="subjectId">
												{({ field, meta }) => (
													<FormControl
														fullWidth
														required
														error={meta.touched && Boolean(meta.error)}
													>
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
															}}
														>
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
																sx={{ mt: 0.5, ml: 1.75 }}
															>
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
														error={meta.touched && Boolean(meta.error)}
													>
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
															}}
														>
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
																sx={{ mt: 0.5, ml: 1.75 }}
															>
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
														error={meta.touched && Boolean(meta.error)}
													>
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
															}}
														>
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
																sx={{ mt: 0.5, ml: 1.75 }}
															>
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

							<DialogActions sx={{ p: 3, gap: 2, flexDirection: "column" }}>
								{/* Conflict Check Status */}
								{conflictMessage && (
									<Box
										sx={{
											width: "100%",
											p: 2,
											borderRadius: "12px",
											backgroundColor: hasConflict
												? "rgba(244, 67, 54, 0.1)"
												: "rgba(76, 175, 80, 0.1)",
											border: `2px solid ${
												hasConflict ? "#f44336" : "#4caf50"
											}`,
										}}
									>
										<Typography
											variant="body2"
											sx={{
												color: hasConflict ? "#f44336" : "#4caf50",
												fontWeight: 600,
											}}
										>
											{conflictMessage}
										</Typography>
									</Box>
								)}

								{/* Action Buttons */}
								<Box sx={{ display: "flex", gap: 2, width: "100%" }}>
									<Button
										onClick={onClose}
										disabled={loading || isSubmitting}
										sx={{
											borderRadius: "12px",
											px: 3,
											py: 1,
										}}
									>
										Cancel
									</Button>

									<Button
										type="button"
										variant="outlined"
										onClick={() => handleCheckConflicts(values)}
										disabled={
											loading ||
											isSubmitting ||
											!values.day ||
											!values.timeIn ||
											!values.timeOut ||
											!values.sectionId ||
											!values.teacherId
										}
										sx={{
											borderRadius: "12px",
											px: 3,
											py: 1,
											borderColor: "hsl(152, 65%, 28%)",
											color: "hsl(152, 65%, 28%)",
											"&:hover": {
												borderColor: "hsl(145, 60%, 40%)",
												backgroundColor: "rgba(31, 120, 80, 0.05)",
											},
										}}
									>
										Check for Conflicts
									</Button>

									<Button
										type="submit"
										variant="contained"
										disabled={
											loading ||
											isSubmitting ||
											!conflictChecked ||
											hasConflict ||
											valuesHaveChanged(values)
										}
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
											"&:disabled": {
												opacity: 0.5,
											},
										}}
									>
										{loading || isSubmitting ? (
											<CircularProgress size={20} color="inherit" />
										) : scheduleData ? (
											"Update Schedule"
										) : (
											"Create Schedule"
										)}
									</Button>
								</Box>
							</DialogActions>
						</Form>
					)}
				</Formik>
			)}
		</Dialog>
	);
};

export default ScheduleForm;
