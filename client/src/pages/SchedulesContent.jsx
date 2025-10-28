import { Add, Delete, Edit, Refresh, Search } from "@mui/icons-material";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	InputAdornment,
	MenuItem,
	Paper,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getStatusColor } from "../utils/attendanceUtils";
// Removed static QR image import - now using dynamically generated QR codes
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import ScheduleForm from "../components/ScheduleForm";
import { useAuth } from "../contexts/AuthContext";
import { getAttendanceBySchedule } from "../utils/attendanceService";
import {
	createSchedule,
	deleteSchedule,
	getAllSchedules,
	subscribeToAllSchedules,
	updateSchedule,
} from "../utils/scheduleService";
import { getAllSections } from "../utils/sectionService";
import { getAllSkills } from "../utils/skillService";
import { formatTimeRange } from "../utils/timeUtils";
import { getAllUsers } from "../utils/userService";

const SchedulesContent = () => {
	const navigate = useNavigate();
	const { userProfile } = useAuth();
	const [schedules, setSchedules] = useState([]);
	const [allSchedules, setAllSchedules] = useState([]); // Store ALL schedules for conflict checking

	// Track schedules state changes
	useEffect(() => {
		console.log("🔍 SchedulesContent - schedules STATE changed:", {
			length: schedules.length,
			schedules: schedules,
		});
	}, [schedules]);

	// Track all schedules state changes
	useEffect(() => {
		console.log("🔍 SchedulesContent - allSchedules STATE changed:", {
			length: allSchedules.length,
		});
	}, [allSchedules]);

	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredSchedules, setFilteredSchedules] = useState([]);
	const [dayFilter, setDayFilter] = useState("all");
	const [skills, setSkills] = useState([]);
	const [users, setUsers] = useState([]);
	const [sections, setSections] = useState([]);

	// Dialog states
	const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

	const [editingSchedule, setEditingSchedule] = useState(null);
	const [deletingSchedule, setDeletingSchedule] = useState(null);
	const [loadingAttendance, setLoadingAttendance] = useState(false);

	// Notification states
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});

	// Day options
	const dayOptions = [
		"all",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
	];

	// Load schedules and related data when component mounts or user profile changes
	useEffect(() => {
		if (userProfile) {
			loadSchedules();
			loadRelatedData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userProfile?.uid]); // Only re-run if user ID changes, not the whole object

	// Set up real-time subscription
	useEffect(() => {
		// TEMPORARILY DISABLED - causing infinite loop
		// TODO: Fix the subscription to only update when data actually changes
		/*
		const unsubscribe = subscribeToAllSchedules((result) => {
			if (result.success) {
				let schedulesData = result.data;

				// If user is a teacher, filter schedules to show only their assigned schedules
				if (userProfile && userProfile.role === "teacher") {
					schedulesData = result.data.filter(
						(schedule) => schedule.teacherId === userProfile.uid
					);
				}

				// Only update if schedules actually changed
				setSchedules((prevSchedules) => {
					if (JSON.stringify(prevSchedules) !== JSON.stringify(schedulesData)) {
						console.log("🔍 SchedulesContent - Schedules updated:", schedulesData.length);
						return schedulesData;
					}
					return prevSchedules;
				});
			} else {
				showSnackbar("Error loading schedules: " + result.error, "error");
			}
		});

		return () => unsubscribe();
		*/
	}, [userProfile]);

	// Filter schedules when search term or day filter changes
	useEffect(() => {
		let filtered = schedules;

		// Filter by day
		if (dayFilter !== "all") {
			filtered = filtered.filter((schedule) => schedule.day === dayFilter);
		}

		// Filter by search term
		if (searchTerm.trim()) {
			filtered = filtered.filter(
				(schedule) =>
					schedule.day?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					schedule.timeIn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					schedule.timeOut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
					getSkillName(schedule.subjectId)
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					getTeacherName(schedule.teacherId)
						?.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					getSectionName(schedule.sectionId)
						?.toLowerCase()
						.includes(searchTerm.toLowerCase())
			);
		}

		setFilteredSchedules(filtered);
	}, [searchTerm, schedules, dayFilter]);

	const loadSchedules = async () => {
		console.log("🔍 loadSchedules - Starting to load schedules");
		console.log("🔍 loadSchedules - User profile:", userProfile);
		console.log("🔍 loadSchedules - User role:", userProfile?.role);
		console.log("🔍 loadSchedules - User ID:", userProfile?.uid);
		setLoading(true);
		try {
			const result = await getAllSchedules();
			console.log("🔍 loadSchedules - API result:", result);
			if (result.success) {
				let schedulesData = result.data;
				console.log("🔍 loadSchedules - Raw data from API:", schedulesData);
				console.log(
					"🔍 loadSchedules - Number of schedules:",
					schedulesData.length
				);

				// Store ALL schedules for conflict checking (unfiltered)
				setAllSchedules(schedulesData);
				console.log(
					"🔍 loadSchedules - Set allSchedules state with:",
					schedulesData.length,
					"schedules"
				);

				// If user is a teacher, filter schedules to show only their assigned schedules
				// BUT: Keep unfiltered data in allSchedules for conflict checking
				let displaySchedules = schedulesData;
				if (userProfile && userProfile.role === "teacher") {
					displaySchedules = result.data.filter(
						(schedule) => schedule.teacherId === userProfile.uid
					);
					console.log("🔍 loadSchedules - Teacher filter applied");
					console.log(
						"🔍 loadSchedules - Filtered for teacher:",
						displaySchedules.length
					);
					console.log("🔍 loadSchedules - Teacher ID:", userProfile.uid);
					console.log(
						"🔍 loadSchedules - Sample schedule teacherId:",
						schedulesData[0]?.teacherId
					);
				}

				setSchedules(displaySchedules);
				console.log(
					"🔍 loadSchedules - Schedules state updated with:",
					displaySchedules.length,
					"schedules"
				);
			} else {
				showSnackbar("Error loading schedules: " + result.error, "error");
			}
		} catch (error) {
			console.error("🔍 loadSchedules - Error:", error);
			showSnackbar("Error loading schedules: " + error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	const loadRelatedData = async () => {
		try {
			const [skillsResult, usersResult, sectionsResult] = await Promise.all([
				getAllSkills(),
				getAllUsers(),
				getAllSections(),
			]);

			if (skillsResult.success) {
				setSkills(skillsResult.data);
			}

			if (usersResult.success) {
				setUsers(usersResult.data);
			}

			if (sectionsResult.success) {
				setSections(sectionsResult.data);
			}
		} catch (error) {
			console.error("Error loading related data:", error);
		}
	};

	const getSkillName = (subjectId) => {
		const skill = skills.find((s) => s.id === subjectId);
		return skill ? skill.name : "Unknown Skill";
	};

	const getTeacherName = (teacherId) => {
		const teacher = users.find((u) => u.uid === teacherId);
		return teacher
			? `${teacher.firstName} ${teacher.lastName}`
			: "Unknown Teacher";
	};

	const getSectionName = (sectionId) => {
		const section = sections.find((s) => s.id === sectionId);
		return section ? section.name : "Unknown Daycare Center";
	};

	const showSnackbar = (message, severity = "success") => {
		setSnackbar({
			open: true,
			message,
			severity,
		});
	};

	const handleScanQR = async (qrDataString) => {
		try {
			const parsed = JSON.parse(qrDataString);
			// For parent QR, call backend to mark attendance (teacher scans parent QR)
			if (parsed.type === "parent" && (parsed.parentId || parsed.parentID)) {
				const parentId = parsed.parentId || parsed.parentID;
				const attendanceType = parsed.attendanceType || "timeIn";

				// Special handling for timeOut QR codes - make database changes but don't update status
				if (attendanceType === "timeOut") {
					// Still process the attendance to record time-out in database
					const result = await markAttendanceViaQR(
						qrDataString,
						parentId,
						attendanceType,
						"Timed out via QR scan"
					);

					if (result.success) {
						Swal.fire({
							icon: "success",
							title: "Successfully Timed Out",
							text: "Student has been successfully timed out and recorded.",
							confirmButtonColor: "#2196f3",
							timer: 3000,
							timerProgressBar: true,
						});
					} else {
						Swal.fire({
							icon: "error",
							title: "Time-Out Failed",
							text: result.error || "Failed to record time-out.",
							confirmButtonColor: "#d33",
						});
					}
					return; // Exit early after processing
				}

				// Calculate attendance status based on current time and schedule
				let attendanceStatus = "present";
				let statusMessage = "";

				// Find the relevant schedule to calculate status
				const relevantSchedule = schedules.find((s) => {
					// Find schedule that matches the current day and time
					const today = new Date().toLocaleDateString("en-US", {
						weekday: "long",
					});
					return s.day === today;
				});

				if (relevantSchedule) {
					const currentTime = new Date().toLocaleTimeString("en-US", {
						hour12: true,
						hour: "2-digit",
						minute: "2-digit",
					});

					const scheduledTime =
						attendanceType === "timeIn"
							? relevantSchedule.timeIn
							: relevantSchedule.timeOut;
					const statusResult = calculateAttendanceStatus(
						scheduledTime,
						currentTime,
						15
					); // 15-minute grace period

					attendanceStatus = statusResult.status;
					statusMessage = formatAttendanceMessage(statusResult, attendanceType);
				}

				const result = await markAttendanceViaQR(
					qrDataString,
					parentId,
					attendanceType,
					statusMessage
				);
				if (result.success) {
					const statusColor = getStatusColor(attendanceStatus);
					const statusIcon =
						attendanceStatus === "present"
							? "success"
							: attendanceStatus === "late"
							? "warning"
							: "error";

					Swal.fire({
						icon: statusIcon,
						title: "Attendance Recorded!",
						html: `
              <div style="text-align: left;">
                <p><strong>Student:</strong> ${result.data.child.firstName} ${
							result.data.child.lastName
						}</p>
                <p><strong>Status:</strong> <span style="color: ${
									statusColor === "success"
										? "#4caf50"
										: statusColor === "warning"
										? "#ff9800"
										: "#f44336"
								}">${attendanceStatus.toUpperCase()}</span></p>
                <p><strong>Time:</strong> ${
									attendanceType === "timeIn" ? "Check-in" : "Check-out"
								}</p>
                <p><strong>Details:</strong> ${statusMessage}</p>
              </div>
            `,
						confirmButtonColor:
							statusColor === "success"
								? "#4caf50"
								: statusColor === "warning"
								? "#ff9800"
								: "#f44336",
						timer: 7000,
						timerProgressBar: true,
					});
					loadSchedules();
				} else {
					Swal.fire({
						icon: "error",
						title: "Attendance Error",
						text: "Error marking attendance: " + result.error,
						confirmButtonColor: "#d33",
					});
				}
			} else if (parsed.type === "schedule" && parsed.id) {
				// If a schedule QR is scanned, just navigate to attendance view for that schedule
				const schedule = schedules.find((s) => s.id === parsed.id);
				if (schedule) {
					Swal.fire({
						icon: "success",
						title: "QR Code Scanned!",
						text: `Opening attendance view for ${schedule.subjectName} - ${schedule.day}`,
						confirmButtonColor: "#2196f3",
						timer: 3000,
						timerProgressBar: true,
					});
					await handleViewAttendance(schedule);
				} else {
					Swal.fire({
						icon: "error",
						title: "Schedule Not Found",
						text: "The scanned schedule could not be found in the system.",
						confirmButtonColor: "#d33",
					});
				}
			} else {
				Swal.fire({
					icon: "warning",
					title: "Invalid QR Code",
					text: "This QR code is not recognized. Please scan a valid schedule or parent QR code.",
					confirmButtonColor: "#ff9800",
				});
			}
		} catch (err) {
			Swal.fire({
				icon: "error",
				title: "Scanning Error",
				text: "Error processing QR code: " + err.message,
				confirmButtonColor: "#d33",
			});
		}
	};

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const handleAddSchedule = () => {
		console.log("🔍 SchedulesContent - Opening form to add schedule");
		console.log("🔍 SchedulesContent - Current schedules array:", schedules);
		console.log("🔍 SchedulesContent - Number of schedules:", schedules.length);
		console.log(
			"🔍 SchedulesContent - Full schedule objects:",
			JSON.stringify(schedules, null, 2)
		);

		// If schedules haven't loaded yet, load them first
		if (schedules.length === 0) {
			console.warn(
				"⚠️ No schedules loaded yet! Loading schedules before opening form..."
			);
			loadSchedules().then(() => {
				console.log("✅ Schedules loaded, now opening form");
				setEditingSchedule(null);
				setScheduleFormOpen(true);
			});
		} else {
			setEditingSchedule(null);
			setScheduleFormOpen(true);
		}
	};

	const handleEditSchedule = (schedule) => {
		setEditingSchedule(schedule);
		setScheduleFormOpen(true);
	};

	const handleDeleteSchedule = (schedule) => {
		setDeletingSchedule(schedule);
		setConfirmDialogOpen(true);
	};

	// Helper function to check for schedule conflicts on client side
	const checkScheduleConflict = (newSchedule, excludeId = null) => {
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

		const newStart = timeToMinutes(
			newSchedule.timeIn || newSchedule.timeInStart
		);
		const newEnd = timeToMinutes(newSchedule.timeOut || newSchedule.timeOutEnd);
		const newDay = newSchedule.day;
		const newTeacher = newSchedule.teacherId;
		const newSection = newSchedule.sectionId;

		// Check against all existing schedules
		for (const schedule of schedules) {
			// Skip if comparing with itself
			if (excludeId && schedule.id === excludeId) continue;

			// Only check schedules on the same day
			if (schedule.day !== newDay) continue;

			// Check if same teacher or same section
			if (
				schedule.teacherId !== newTeacher &&
				schedule.sectionId !== newSection
			) {
				continue;
			}

			// Check time overlap
			const existingStart = timeToMinutes(
				schedule.timeIn || schedule.timeInStart
			);
			const existingEnd = timeToMinutes(
				schedule.timeOut || schedule.timeOutEnd
			);

			if (rangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
				return {
					hasConflict: true,
					conflictSchedule: schedule,
				};
			}
		}

		return { hasConflict: false };
	};

	const handleScheduleFormSubmit = async (formData) => {
		setLoading(true);
		try {
			// Client-side conflict check first
			const conflictCheck = checkScheduleConflict(
				formData,
				editingSchedule?.id
			);
			if (conflictCheck.hasConflict) {
				const c = conflictCheck.conflictSchedule;
				const conflictMsg = `Schedule conflict detected! Conflicts with: ${getSkillName(
					c.subjectId
				)} on ${c.day} (${c.timeIn || c.timeInStart || ""} - ${
					c.timeOut || c.timeOutEnd || ""
				})`;
				showSnackbar(conflictMsg, "error");
				setLoading(false);
				return;
			}

			let result;
			if (editingSchedule) {
				// Update existing schedule
				result = await updateSchedule(editingSchedule.id, formData);
				if (result.success) {
					showSnackbar("Schedule updated successfully!");
					setScheduleFormOpen(false);
					// Reload schedules after successful update
					await loadSchedules();
				} else {
					if (result.conflict) {
						const c = result.conflict;
						const conflictMsg = `Conflict with existing schedule: ${getSkillName(
							c.subjectId
						)} (${c.day} ${c.timeInStart || c.timeIn || ""} - ${
							c.timeOutEnd || c.timeOut || ""
						})`;
						showSnackbar(
							conflictMsg + " — " + (result.error || "Scheduling conflict"),
							"error"
						);
					} else {
						showSnackbar("Error updating schedule: " + result.error, "error");
					}
				}
			} else {
				// Create new schedule
				result = await createSchedule(formData);
				if (result.success) {
					showSnackbar("Schedule created successfully!");
					setScheduleFormOpen(false);
					// Reload schedules after successful create
					await loadSchedules();
				} else {
					if (result.conflict) {
						const c = result.conflict;
						const conflictMsg = `Conflict with existing schedule: ${getSkillName(
							c.subjectId
						)} (${c.day} ${c.timeInStart || c.timeIn || ""} - ${
							c.timeOutEnd || c.timeOut || ""
						})`;
						showSnackbar(
							conflictMsg + " — " + (result.error || "Scheduling conflict"),
							"error"
						);
					} else {
						showSnackbar("Error creating schedule: " + result.error, "error");
					}
				}
			}
		} catch (error) {
			showSnackbar("Error: " + error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deletingSchedule) return;

		setLoading(true);
		try {
			const result = await deleteSchedule(deletingSchedule.id);
			if (result.success) {
				showSnackbar("Schedule deleted successfully!");
				setConfirmDialogOpen(false);
				setDeletingSchedule(null);
				// Reload schedules after successful delete
				await loadSchedules();
			} else {
				showSnackbar("Error deleting schedule: " + result.error, "error");
			}
		} catch (error) {
			showSnackbar("Error: " + error.message, "error");
		} finally {
			setLoading(false);
		}
	};

	const handleViewAttendance = async (schedule) => {
		setLoadingAttendance(true);
		try {
			const result = await getAttendanceBySchedule(schedule.id);
			if (result.success) {
				// Navigate to attendance page with data
				navigate("/dashboard/attendance", {
					state: {
						attendanceData: result.data,
					},
				});
			} else {
				showSnackbar("Error loading attendance: " + result.error, "error");
			}
		} catch (error) {
			showSnackbar("Error loading attendance: " + error.message, "error");
		} finally {
			setLoadingAttendance(false);
		}
	};

	return (
		<Box>
			<Paper
				sx={{
					p: 4,
					mb: 4,
					background: "rgba(255, 255, 255, 0.95)",
					backdropFilter: "blur(15px)",
					border: "2px solid rgba(31, 120, 80, 0.2)",
					borderRadius: "20px",
					boxShadow: "0 8px 32px rgba(31, 120, 80, 0.2)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 3,
					}}
				>
					<Typography
						variant="h4"
						sx={{
							fontFamily: "Plus Jakarta Sans, sans-serif",
							fontWeight: 700,
							background:
								"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
							backgroundClip: "text",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						Class Schedules
					</Typography>
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						{/* Allow teachers to add schedules */}
						<Button
							variant="contained"
							startIcon={<Add />}
							onClick={handleAddSchedule}
							sx={{
								background:
									"linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))",
							}}
						>
							Add Schedule
						</Button>
					</Box>
				</Box>

				{/* Controls */}
				<Box
					sx={{
						display: "flex",
						gap: 2,
						alignItems: "center",
						mb: 3,
						flexWrap: "wrap",
					}}
				>
					<TextField
						size="small"
						placeholder="Search schedules..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Search />
								</InputAdornment>
							),
						}}
						sx={{ minWidth: 250 }}
					/>

					<TextField
						size="small"
						select
						label="Filter by Day"
						value={dayFilter}
						onChange={(e) => setDayFilter(e.target.value)}
						sx={{ minWidth: 150 }}
					>
						{dayOptions.map((day) => (
							<MenuItem key={day} value={day}>
								{day === "all" ? "All Days" : day}
							</MenuItem>
						))}
					</TextField>

					<Box sx={{ display: "flex", gap: 1 }}>
						<Tooltip title="Refresh">
							<IconButton onClick={loadSchedules} disabled={loading}>
								<Refresh />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				{/* Content */}
				{loading ? (
					<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
						<CircularProgress />
					</Box>
				) : (
					<TableContainer
						component={Paper}
						sx={{
							background: "rgba(255, 255, 255, 0.95)",
							backdropFilter: "blur(15px)",
							border: "2px solid rgba(31, 120, 80, 0.2)",
							borderRadius: "16px",
							boxShadow: "0 6px 20px rgba(31, 120, 80, 0.15)",
						}}
					>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 600,
										}}
									>
										Day
									</TableCell>
									<TableCell
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 600,
										}}
									>
										Time
									</TableCell>
									<TableCell
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 600,
										}}
									>
										Daycare Center
									</TableCell>
									<TableCell
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 600,
										}}
									>
										Teacher
									</TableCell>
									<TableCell
										sx={{
											fontFamily: "Plus Jakarta Sans, sans-serif",
											fontWeight: 600,
										}}
										align="center"
									>
										Actions
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredSchedules.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={5}
											align="center"
											sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
										>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
											>
												No schedules found
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									filteredSchedules.map((schedule) => {
										// Check if this schedule has conflicts
										const conflict = checkScheduleConflict(
											schedule,
											schedule.id
										);
										const hasConflict = conflict.hasConflict;

										return (
											<TableRow
												key={schedule.id}
												sx={{
													"&:hover": {
														backgroundColor: hasConflict
															? "rgba(244, 67, 54, 0.08)"
															: "rgba(31, 120, 80, 0.05)",
														cursor: "pointer",
													},
													"&:active": {
														backgroundColor: hasConflict
															? "rgba(244, 67, 54, 0.15)"
															: "rgba(31, 120, 80, 0.1)",
													},
													backgroundColor: hasConflict
														? "rgba(244, 67, 54, 0.05)"
														: "transparent",
													borderLeft: hasConflict
														? "4px solid #f44336"
														: "none",
												}}
												onClick={() => handleViewAttendance(schedule)}
											>
												<TableCell>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
														}}
													>
														<Chip
															label={schedule.day}
															color="primary"
															variant="outlined"
															size="small"
														/>
														{hasConflict && (
															<Chip
																label="CONFLICT"
																color="error"
																size="small"
																sx={{ fontWeight: 600 }}
															/>
														)}
													</Box>
												</TableCell>
												<TableCell>
													<Typography
														variant="body2"
														fontWeight={500}
														sx={{ color: hasConflict ? "#f44336" : "inherit" }}
													>
														{formatTimeRange(
															schedule.timeIn,
															schedule.timeOut,
															schedule
														)}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography
														variant="body2"
														sx={{
															fontFamily: "Plus Jakarta Sans, sans-serif",
															color: "hsl(152, 65%, 28%)",
															fontWeight: 500,
														}}
													>
														{getSkillName(schedule.subjectId)}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{getTeacherName(schedule.teacherId)}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2">
														{getSectionName(schedule.sectionId)}
													</Typography>
												</TableCell>
												{/* Show Actions column for all users including teachers */}
												<TableCell>
													<Box sx={{ display: "flex", gap: 1 }}>
														<Tooltip title="Edit schedule">
															<IconButton
																size="small"
																color="primary"
																onClick={(e) => {
																	e.stopPropagation();
																	handleEditSchedule(schedule);
																}}
																sx={{
																	"&:hover": {
																		backgroundColor: "rgba(21, 101, 192, 0.08)",
																	},
																}}
															>
																<Edit fontSize="small" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Delete Schedule">
															<IconButton
																size="small"
																color="error"
																onClick={(e) => {
																	e.stopPropagation();
																	handleDeleteSchedule(schedule);
																}}
																sx={{
																	"&:hover": {
																		backgroundColor: "rgba(244, 67, 54, 0.1)",
																	},
																}}
															>
																<Delete />
															</IconButton>
														</Tooltip>
													</Box>
												</TableCell>
											</TableRow>
										);
									})
								)}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Paper>

			{/* Schedule Form Dialog */}
			<ScheduleForm
				open={scheduleFormOpen}
				onClose={() => setScheduleFormOpen(false)}
				onSubmit={handleScheduleFormSubmit}
				scheduleData={editingSchedule}
				loading={loading}
				existingSchedules={allSchedules}
			/>
			{/* Log schedules prop being passed */}
			{console.log(
				"🔍 SchedulesContent - Rendering ScheduleForm with allSchedules:",
				allSchedules.length,
				"items"
			)}
			{/* Confirm Delete Dialog */}
			<ConfirmDialog
				open={confirmDialogOpen}
				onClose={() => setConfirmDialogOpen(false)}
				onConfirm={handleConfirmDelete}
				title="Delete Schedule"
				message={`Are you sure you want to delete this schedule? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				loading={loading}
				type="danger"
			/>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default SchedulesContent;
