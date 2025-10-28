const { db, admin } = require("../config/firebase-admin-config");
const { sendAttendanceNotification } = require("../services/smsService");
const { createNotificationInternal } = require("./notificationController");

// Helper function to format time to 12-hour format
const formatTo12Hour = (timeStr) => {
	if (!timeStr) return null;

	console.log("formatTo12Hour input:", { timeStr, type: typeof timeStr });

	// If already in 12-hour format (contains AM/PM), return as is
	if (timeStr.includes("AM") || timeStr.includes("PM")) {
		console.log("Already in 12-hour format, returning as is:", timeStr);
		return timeStr;
	}

	// If in 24-hour format (HH:MM), convert to 12-hour
	if (timeStr.includes(":")) {
		const [hours, minutes] = timeStr.split(":");
		const hour24 = parseInt(hours);
		const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
		const ampm = hour24 >= 12 ? "PM" : "AM";
		const result = `${hour12}:${minutes} ${ampm}`;
		console.log("Converted 24-hour to 12-hour:", {
			hour24,
			hour12,
			ampm,
			result,
		});
		return result;
	}

	console.log("No conversion needed, returning original:", timeStr);
	return timeStr;
};

const getLocalDateString = (value) => {
	const date = value ? new Date(value) : new Date();
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// Helper to convert 12-hour time string (e.g. "1:05 PM") to minutes since midnight
const timeToMinutes = (timeStr) => {
	if (!timeStr || typeof timeStr !== "string") return null;

	const trimmed = timeStr.trim();
	const parts = trimmed.split(" ");
	if (parts.length !== 2) return null;

	const [time, rawPeriod] = parts;
	const period = rawPeriod.toUpperCase();
	const [hoursStr, minutesStr] = time.split(":");
	const hours = parseInt(hoursStr, 10);
	const minutes = parseInt(minutesStr, 10);

	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

	let total = (hours % 12) * 60 + minutes;
	if (period === "PM") total += 12 * 60;
	if (period === "AM" && hours === 12) total -= 12 * 60;

	return total;
};

// Compare an actual tap against the scheduled time with a configurable grace window
const evaluateTapAgainstSchedule = (
	scheduledTime,
	actualTime,
	gracePeriodMinutes = 15
) => {
	if (!actualTime) {
		return {
			classification: "missing",
			minutesLate: 0,
			minutesEarly: 0,
			differenceMinutes: null,
			withinGrace: false,
		};
	}

	if (!scheduledTime) {
		return {
			classification: "unknown_schedule",
			minutesLate: 0,
			minutesEarly: 0,
			differenceMinutes: 0,
			withinGrace: true,
		};
	}

	const scheduledMinutes = timeToMinutes(scheduledTime);
	const actualMinutes = timeToMinutes(actualTime);

	if (scheduledMinutes === null || actualMinutes === null) {
		console.error("Invalid time format:", { scheduledTime, actualTime });
		return {
			classification: "invalid",
			minutesLate: 0,
			minutesEarly: 0,
			differenceMinutes: null,
			withinGrace: false,
		};
	}

	const differenceMinutes = actualMinutes - scheduledMinutes;
	const minutesLate = differenceMinutes > 0 ? differenceMinutes : 0;
	const minutesEarly = differenceMinutes < 0 ? Math.abs(differenceMinutes) : 0;

	let classification = "within_grace";
	if (differenceMinutes === 0) {
		classification = "on_time";
	} else if (differenceMinutes > gracePeriodMinutes) {
		classification = "late";
	} else if (differenceMinutes < -gracePeriodMinutes) {
		classification = "early";
	}

	return {
		classification,
		minutesLate,
		minutesEarly,
		differenceMinutes,
		withinGrace: Math.abs(differenceMinutes) <= gracePeriodMinutes,
	};
};

const mapArrivalStatus = (classification) => {
	switch (classification) {
		case "late":
			return "late_arrival";
		case "early":
			return "early_arrival";
		case "on_time":
		case "within_grace":
			return "on_time_arrival";
		case "unknown_schedule":
			return "unknown_arrival";
		case "invalid":
			return "invalid_arrival";
		default:
			return "missing_arrival";
	}
};

const mapDepartureStatus = (classification) => {
	switch (classification) {
		case "late":
			return "late_time_out";
		case "early":
			return "early_time_out";
		case "on_time":
		case "within_grace":
			return "on_time_time_out";
		case "unknown_schedule":
			return "unknown_time_out";
		case "invalid":
			return "invalid_time_out";
		default:
			return "missing_time_out";
	}
};

const buildArrivalNote = (classification, evaluation, gracePeriodMinutes) => {
	switch (classification) {
		case "late":
			return `Arrived ${evaluation.minutesLate} minutes late (beyond the ${gracePeriodMinutes}-minute window). Marked as LATE.`;
		case "early":
			return `Arrived ${evaluation.minutesEarly} minutes early.`;
		case "within_grace":
			if (evaluation.differenceMinutes > 0) {
				return `Arrived ${evaluation.minutesLate} minutes late but within the ${gracePeriodMinutes}-minute grace window. Marked present.`;
			}
			if (evaluation.differenceMinutes < 0) {
				return `Arrived ${evaluation.minutesEarly} minutes early (within grace period). Marked present.`;
			}
			return "Arrived on time.";
		case "on_time":
			return "Arrived exactly on time.";
		case "missing":
			return "No time-in recorded.";
		case "invalid":
			return "Invalid time-in provided. Attendance requires manual review.";
		case "unknown_schedule":
			return "No scheduled start time configured.";
		default:
			return null;
	}
};

const buildDepartureNote = (classification, evaluation, gracePeriodMinutes) => {
	switch (classification) {
		case "late":
			return `School hours have ended. Clocked out ${evaluation.minutesLate} minutes after schedule — marked as late time-out.`;
		case "early":
			return `Clocked out ${evaluation.minutesEarly} minutes early — marked as early time-out.`;
		case "within_grace":
			if (evaluation.differenceMinutes > 0) {
				return `Clocked out ${evaluation.minutesLate} minutes after schedule but within the ${gracePeriodMinutes}-minute grace window.`;
			}
			if (evaluation.differenceMinutes < 0) {
				return `Clocked out ${evaluation.minutesEarly} minutes before schedule (within grace period).`;
			}
			return "Clocked out on time.";
		case "on_time":
			return "Clocked out exactly on time.";
		case "missing":
			return "No time-out recorded.";
		case "invalid":
			return "Invalid time-out provided. Please verify the tap.";
		case "unknown_schedule":
			return "No scheduled end time configured.";
		default:
			return null;
	}
};

// Calculate attendance status based on scheduled time and actual time (legacy helper kept for compatibility)
const calculateAttendanceStatus = (
	scheduledTime,
	actualTime,
	gracePeriodMinutes = 15
) => {
	const evaluation = evaluateTapAgainstSchedule(
		scheduledTime,
		actualTime,
		gracePeriodMinutes
	);

	if (evaluation.classification === "invalid") {
		return {
			status: "late",
			minutesLate: evaluation.minutesLate,
			minutesEarly: evaluation.minutesEarly,
			isOnTime: false,
			withinGrace: evaluation.withinGrace,
			classification: evaluation.classification,
			differenceMinutes: evaluation.differenceMinutes,
			error: "Invalid time format",
		};
	}

	if (evaluation.classification === "missing") {
		return {
			status: "absent",
			minutesLate: 0,
			minutesEarly: 0,
			isOnTime: false,
			withinGrace: false,
			classification: evaluation.classification,
			differenceMinutes: evaluation.differenceMinutes,
		};
	}

	if (evaluation.classification === "unknown_schedule") {
		return {
			status: "present",
			minutesLate: 0,
			minutesEarly: 0,
			isOnTime: true,
			withinGrace: true,
			classification: evaluation.classification,
			differenceMinutes: evaluation.differenceMinutes,
		};
	}

	const status = evaluation.classification === "late" ? "late" : "present";
	const isOnTime =
		evaluation.classification === "on_time" ||
		evaluation.classification === "within_grace";

	return {
		status,
		minutesLate: evaluation.minutesLate,
		minutesEarly: evaluation.minutesEarly,
		isOnTime,
		withinGrace: evaluation.withinGrace,
		classification: evaluation.classification,
		differenceMinutes: evaluation.differenceMinutes,
	};
};

const markAttendance = async (req, res) => {
	try {
		const {
			scheduleId,
			studentId,
			status,
			timeIn,
			timeOut,
			notes: manualNoteInputRaw,
		} = req.body;

		if (!scheduleId || !studentId) {
			return res.status(400).json({
				success: false,
				error: "Schedule ID and student ID are required",
			});
		}

		// Verify that schedule exists
		const scheduleSnapshot = await db
			.ref(`schedules/${scheduleId}`)
			.once("value");
		if (!scheduleSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Schedule not found",
			});
		}
		const schedule = scheduleSnapshot.val();

		const today = getLocalDateString();

		// Check if attendance already exists for today
		const existingSnapshot = await db
			.ref("attendance")
			.orderByChild("scheduleId")
			.equalTo(scheduleId)
			.once("value");

		let attendanceId = null;
		if (existingSnapshot.exists()) {
			existingSnapshot.forEach((childSnapshot) => {
				const record = childSnapshot.val();
				if (record.studentId === studentId && record.date === today) {
					attendanceId = childSnapshot.key;
				}
			});
		}

		let existingData = null;
		if (attendanceId) {
			const existingRecord = await db
				.ref(`attendance/${attendanceId}`)
				.once("value");
			existingData = existingRecord.val();
		}

		const manualNoteInput =
			typeof manualNoteInputRaw === "string"
				? manualNoteInputRaw.trim()
				: undefined;

		let resolvedManualNote = existingData?.manualNote ?? null;
		if (manualNoteInputRaw !== undefined) {
			resolvedManualNote = manualNoteInput || null;
		}

		const normalizedTimeIn =
			timeIn !== undefined
				? formatTo12Hour(timeIn)
				: existingData?.timeIn || null;
		const normalizedTimeOut =
			timeOut !== undefined
				? formatTo12Hour(timeOut)
				: existingData?.timeOut || null;

		const manualStatus =
			typeof status === "string" && status.trim().length > 0
				? status.trim().toLowerCase()
				: undefined;
		const manualStatusProvided = Boolean(manualStatus);

		const scheduledTimeIn = formatTo12Hour(
			schedule.timeInStart || schedule.timeIn
		);
		const scheduledTimeOut = formatTo12Hour(
			schedule.timeOutEnd || schedule.timeOut
		);

		const arrivalEvaluation = evaluateTapAgainstSchedule(
			scheduledTimeIn,
			normalizedTimeIn,
			15
		);
		const departureEvaluation = evaluateTapAgainstSchedule(
			scheduledTimeOut,
			normalizedTimeOut,
			15
		);

		const arrivalStatus = mapArrivalStatus(arrivalEvaluation.classification);
		const departureStatus = mapDepartureStatus(
			departureEvaluation.classification
		);

		const arrivalNote = buildArrivalNote(
			arrivalEvaluation.classification,
			arrivalEvaluation,
			15
		);
		const departureNote = buildDepartureNote(
			departureEvaluation.classification,
			departureEvaluation,
			15
		);

		let finalStatus = "absent";
		let statusMessage = arrivalNote || departureNote || "";

		if (normalizedTimeIn) {
			if (arrivalEvaluation.classification === "invalid") {
				finalStatus = "absent";
				statusMessage = "Invalid time-in provided.";
			} else {
				finalStatus =
					arrivalEvaluation.classification === "late" ? "late" : "present";
				statusMessage = arrivalNote || "";
			}
		} else if (manualStatusProvided) {
			const validStatuses = ["present", "absent", "late"];
			if (!validStatuses.includes(manualStatus)) {
				return res.status(400).json({
					success: false,
					error: "Status must be present, absent, or late",
				});
			}
			finalStatus = manualStatus;
		} else if (normalizedTimeOut) {
			if (departureEvaluation.classification === "invalid") {
				finalStatus = "absent";
				statusMessage = "Invalid time-out provided.";
			} else {
				finalStatus =
					departureEvaluation.classification === "late" ? "late" : "present";
				statusMessage = departureNote || "";
			}
		}

		if (
			!manualStatusProvided &&
			normalizedTimeOut &&
			departureEvaluation.classification === "late" &&
			finalStatus === "present"
		) {
			finalStatus = "late";
			statusMessage = departureNote || statusMessage;
		}

		const noteFragments = [arrivalNote, departureNote];
		if (resolvedManualNote) {
			noteFragments.push(`Teacher note: ${resolvedManualNote}`);
		}
		const combinedNotes = noteFragments.filter(Boolean).join(" | ") || null;

		const derivedMetrics = {
			timeIn: normalizedTimeIn,
			timeOut: normalizedTimeOut,
			notes: combinedNotes,
			arrivalNote: arrivalNote || null,
			departureNote: departureNote || null,
			arrivalStatus,
			timeInStatus: arrivalStatus,
			arrivalMinutesLate: arrivalEvaluation.minutesLate,
			arrivalMinutesEarly: arrivalEvaluation.minutesEarly,
			arrivalDifferenceMinutes: arrivalEvaluation.differenceMinutes,
			arrivalClassification: arrivalEvaluation.classification,
			arrivalWithinGrace: arrivalEvaluation.withinGrace,
			departureStatus,
			timeOutStatus: departureStatus,
			departureMinutesLate: departureEvaluation.minutesLate,
			departureMinutesEarly: departureEvaluation.minutesEarly,
			departureDifferenceMinutes: departureEvaluation.differenceMinutes,
			departureClassification: departureEvaluation.classification,
			departureWithinGrace: departureEvaluation.withinGrace,
			manualNote: resolvedManualNote,
		};

		if (attendanceId) {
			await db.ref(`attendance/${attendanceId}`).update({
				status: finalStatus,
				...derivedMetrics,
				updatedAt: admin.database.ServerValue.TIMESTAMP,
			});
		} else {
			const attendanceRef = db.ref("attendance").push();
			attendanceId = attendanceRef.key;
			await attendanceRef.set({
				id: attendanceId,
				scheduleId,
				studentId,
				status: finalStatus,
				date: today,
				...derivedMetrics,
				createdAt: admin.database.ServerValue.TIMESTAMP,
				updatedAt: admin.database.ServerValue.TIMESTAMP,
			});
		}

		// Get the final attendance record to return
		const finalRecord = await db
			.ref(`attendance/${attendanceId}`)
			.once("value");
		const finalData = finalRecord.val();

		// Send SMS notification (async, don't wait for it)
		sendAttendanceNotificationAsync(
			finalData,
			scheduleId,
			studentId,
			normalizedTimeIn,
			normalizedTimeOut
		);

		// Create in-app notification for parent
		try {
			const userSnapshot = await db.ref(`users/${studentId}`).once("value");
			if (userSnapshot.exists()) {
				const student = userSnapshot.val();
				const scheduleData = await db
					.ref(`schedules/${scheduleId}`)
					.once("value");
				const scheduleDetails = scheduleData.val();

				// Get skill/subject name
				let subjectName = "Class";
				if (scheduleDetails && scheduleDetails.subjectId) {
					const skillSnapshot = await db
						.ref(`skills/${scheduleDetails.subjectId}`)
						.once("value");
					if (skillSnapshot.exists()) {
						subjectName = skillSnapshot.val().name;
					}
				}

				const timeInfo = normalizedTimeIn ? ` at ${normalizedTimeIn}` : "";
				const statusEmoji =
					finalStatus === "present" ? "✓" : finalStatus === "late" ? "⏰" : "✗";

				await createNotificationInternal({
					recipientId: studentId,
					recipientRole: student.role || "parent",
					type: "attendance",
					title: `Attendance: ${
						finalStatus.charAt(0).toUpperCase() + finalStatus.slice(1)
					}`,
					message: `${statusEmoji} ${student.firstName} ${student.lastName} was marked ${finalStatus} for ${subjectName}${timeInfo}`,
					priority: finalStatus === "absent" ? "high" : "normal",
					actionUrl: "/dashboard/parent-schedules",
					metadata: {
						attendanceId,
						scheduleId,
						studentId,
						status: finalStatus,
						arrivalStatus,
						departureStatus,
						arrivalClassification: arrivalEvaluation.classification,
						departureClassification: departureEvaluation.classification,
						arrivalMinutesLate: arrivalEvaluation.minutesLate,
						arrivalMinutesEarly: arrivalEvaluation.minutesEarly,
						departureMinutesLate: departureEvaluation.minutesLate,
						departureMinutesEarly: departureEvaluation.minutesEarly,
						arrivalWithinGrace: arrivalEvaluation.withinGrace,
						departureWithinGrace: departureEvaluation.withinGrace,
					},
					createdBy: req.user?.uid || "system",
				});
			}
		} catch (notifError) {
			console.error("Error creating attendance notification:", notifError);
			// Don't fail the request if notification fails
		}

		res.json({
			success: true,
			data: {
				id: attendanceId,
				...finalData,
			},
			message: `Attendance marked as ${finalStatus.toUpperCase()}${
				statusMessage ? ": " + statusMessage : ""
			}`,
		});
	} catch (error) {
		console.error("Error marking attendance:", error);
		res.status(500).json({
			success: false,
			error: "Failed to mark attendance: " + error.message,
		});
	}
};

// Get all attendance records with filtering
const getAllAttendance = async (req, res) => {
	try {
		const { date, startDate, endDate, sectionId } = req.query;

		console.log("Attendance Query Params:", {
			date,
			startDate,
			endDate,
			sectionId,
		});

		const attendanceSnapshot = await db.ref("attendance").once("value");
		const attendanceRecords = [];

		if (attendanceSnapshot.exists()) {
			attendanceSnapshot.forEach((childSnapshot) => {
				const attendance = {
					id: childSnapshot.key,
					...childSnapshot.val(),
				};
				attendanceRecords.push(attendance);
			});
		}

		console.log(
			`🔍 DEBUG: getAllAttendance - Found ${attendanceRecords.length} total attendance records`
		);
		console.log(
			`🔍 DEBUG: getAllAttendance - Sample records:`,
			attendanceRecords.slice(0, 3)
		);

		// Apply filters
		let filteredRecords = attendanceRecords;

		// Filter by specific date
		if (date) {
			filteredRecords = filteredRecords.filter(
				(record) => record.date === date
			);
		}
		// Filter by date range
		else if (startDate && endDate) {
			filteredRecords = filteredRecords.filter((record) => {
				if (!record.date) return false;
				return record.date >= startDate && record.date <= endDate;
			});
		}
		// Filter by start date only (from start date onwards)
		else if (startDate) {
			filteredRecords = filteredRecords.filter((record) => {
				if (!record.date) return false;
				return record.date >= startDate;
			});
		}
		// Filter by end date only (up to end date)
		else if (endDate) {
			filteredRecords = filteredRecords.filter((record) => {
				if (!record.date) return false;
				return record.date <= endDate;
			});
		}

		// Filter by section (through schedule)
		if (sectionId) {
			// Get all schedules for this section to find schedule IDs
			const schedulesSnapshot = await db
				.ref("schedules")
				.orderByChild("sectionId")
				.equalTo(sectionId)
				.once("value");

			const sectionScheduleIds = [];
			if (schedulesSnapshot.exists()) {
				schedulesSnapshot.forEach((childSnapshot) => {
					sectionScheduleIds.push(childSnapshot.key);
				});
			}

			// Filter attendance records by these schedule IDs
			filteredRecords = filteredRecords.filter((record) =>
				sectionScheduleIds.includes(record.scheduleId)
			);
		}

		// Sort by date (newest first)
		filteredRecords.sort((a, b) => {
			const dateA = new Date(a.date || 0);
			const dateB = new Date(b.date || 0);
			return dateB - dateA;
		});

		console.log(
			`🔍 DEBUG: getAllAttendance - Filtered attendance: ${filteredRecords.length} records out of ${attendanceRecords.length} total`
		);
		console.log(
			`🔍 DEBUG: getAllAttendance - Filtered records:`,
			filteredRecords.slice(0, 3)
		);

		res.json({
			success: true,
			data: filteredRecords,
			count: filteredRecords.length,
			totalCount: attendanceRecords.length,
		});
	} catch (error) {
		console.error("Error fetching all attendance records:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch attendance records",
		});
	}
};

// Get attendance for a specific schedule
const getAttendanceBySchedule = async (req, res) => {
	try {
		const { scheduleId } = req.params;

		// Get schedule details first
		const scheduleSnapshot = await db
			.ref(`schedules/${scheduleId}`)
			.once("value");
		if (!scheduleSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Schedule not found",
			});
		}

		const schedule = scheduleSnapshot.val();

		// Get section details to find assigned students
		const sectionSnapshot = await db
			.ref(`sections/${schedule.sectionId}`)
			.once("value");
		if (!sectionSnapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Section not found",
			});
		}

		const section = sectionSnapshot.val();
		const assignedStudents = section.assignedStudents || [];

		// Get attendance records for this schedule
		const attendanceSnapshot = await db
			.ref("attendance")
			.orderByChild("scheduleId")
			.equalTo(scheduleId)
			.once("value");

		const attendanceRecords = [];
		if (attendanceSnapshot.exists()) {
			attendanceSnapshot.forEach((childSnapshot) => {
				attendanceRecords.push(childSnapshot.val());
			});
		}

		// Get current date for today's attendance
		const today = getLocalDateString(); // YYYY-MM-DD format

		// Create attendance status for each student
		const studentAttendance = assignedStudents.map((studentId) => {
			// Find today's attendance record for this student
			const todayAttendance = attendanceRecords.find(
				(record) => record.studentId === studentId && record.date === today
			);

			return {
				studentId,
				status: todayAttendance ? todayAttendance.status : "absent", // 'present', 'absent', 'late'
				timeIn: todayAttendance ? todayAttendance.timeIn : null,
				timeOut: todayAttendance ? todayAttendance.timeOut : null,
				notes: todayAttendance ? todayAttendance.notes : null,
				date: today,
			};
		});

		res.json({
			success: true,
			data: {
				schedule: schedule,
				section: section,
				attendance: studentAttendance,
				totalStudents: assignedStudents.length,
				presentCount: studentAttendance.filter((a) => a.status === "present")
					.length,
				absentCount: studentAttendance.filter((a) => a.status === "absent")
					.length,
				lateCount: studentAttendance.filter((a) => a.status === "late").length,
			},
		});
	} catch (error) {
		console.error("Error fetching attendance:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch attendance: " + error.message,
		});
	}
};

// Get attendance history for a student
const getStudentAttendanceHistory = async (req, res) => {
	try {
		const { studentId } = req.params;
		const { days = 30 } = req.query; // Default to last 30 days

		const snapshot = await db
			.ref("attendance")
			.orderByChild("studentId")
			.equalTo(studentId)
			.once("value");

		const attendanceRecords = [];
		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				attendanceRecords.push(childSnapshot.val());
			});
		}

		// Filter by date range (last N days)
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
		const cutoffDateStr = getLocalDateString(cutoffDate);

		const filteredRecords = attendanceRecords
			.filter((record) => record.date >= cutoffDateStr)
			.sort((a, b) => new Date(b.date) - new Date(a.date));

		res.json({
			success: true,
			data: filteredRecords,
			count: filteredRecords.length,
		});
	} catch (error) {
		console.error("Error fetching attendance history:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch attendance history: " + error.message,
		});
	}
};

// Async function to send SMS notification (non-blocking)
const sendAttendanceNotificationAsync = async (
	attendanceData,
	scheduleId,
	studentId,
	timeIn,
	timeOut
) => {
	try {
		// Get schedule details
		const scheduleSnapshot = await db
			.ref(`schedules/${scheduleId}`)
			.once("value");
		if (!scheduleSnapshot.exists()) {
			console.log("Schedule not found for SMS notification");
			return;
		}
		const schedule = scheduleSnapshot.val();

		// Get skill/subject details
		const skillSnapshot = await db
			.ref(`skills/${schedule.subjectId}`)
			.once("value");
		const skill = skillSnapshot.exists()
			? skillSnapshot.val()
			: { name: "Unknown Subject" };

		// Get user details (parent)
		const userSnapshot = await db.ref(`users/${studentId}`).once("value");
		if (!userSnapshot.exists()) {
			console.log("User not found for SMS notification");
			return;
		}
		const user = userSnapshot.val();

		// Determine attendance type and time
		const attendanceType = timeIn ? "timeIn" : "timeOut";
		const time = timeIn || timeOut;

		// Prepare SMS data
		const smsData = {
			studentName: user.childName || `${user.firstName} ${user.lastName}`,
			parentPhone: user.phone,
			attendanceType: attendanceType,
			time: time,
			scheduleDay: schedule.day,
			scheduleTime: `${schedule.timeIn} - ${schedule.timeOut}`,
			subjectName: skill.name,
		};

		// Send SMS
		const smsResult = await sendAttendanceNotification(smsData);
		if (smsResult.success) {
			console.log(
				`SMS sent successfully for ${attendanceType} - ${
					user.childName || user.firstName
				}`
			);
		} else {
			console.log(
				`SMS failed for ${attendanceType} - ${
					user.childName || user.firstName
				}:`,
				smsResult.error
			);
		}
	} catch (error) {
		console.error("Error in SMS notification:", error);
	}
};

module.exports = {
	getAllAttendance,
	getAttendanceBySchedule,
	markAttendance,
	getStudentAttendanceHistory,
};
