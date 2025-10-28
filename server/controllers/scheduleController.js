const QRCode = require("qrcode");
const { db, admin } = require("../config/firebase-admin-config");
const { safeDbQuery } = require("../utils/timeoutWrapper");
const { withCache, invalidateCache } = require("../utils/cache");

// Helper function to format time to 12-hour format
const formatTo12Hour = (timeStr) => {
	if (!timeStr) return null;

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

// Helper function to generate QR code for schedule with attendance type
const generateScheduleQRCode = async (scheduleData, attendanceType) => {
	try {
		const qrData = {
			type: "schedule",
			attendanceType: attendanceType, // 'timeIn' or 'timeOut'
			id: scheduleData.id,
			day: scheduleData.day,
			timeIn: scheduleData.timeIn,
			timeOut: scheduleData.timeOut,
			subjectId: scheduleData.subjectId,
			teacherId: scheduleData.teacherId,
			sectionId: scheduleData.sectionId,
			timestamp: new Date().toISOString(),
		};

		const qrString = JSON.stringify(qrData);

		// Different colors for different attendance types
		const colors = {
			timeIn: {
				dark: "#4caf50", // Green for time-in
				light: "#ffffff",
			},
			timeOut: {
				dark: "#ff9800", // Orange for time-out
				light: "#ffffff",
			},
		};

		const qrDataURL = await QRCode.toDataURL(qrString, {
			width: 200,
			margin: 2,
			color: colors[attendanceType] || colors.timeIn,
			errorCorrectionLevel: "M",
		});

		return qrDataURL;
	} catch (error) {
		console.error("Error generating QR code:", error);
		return null;
	}
};

// Helper to check if two time ranges overlap (minutes)
const rangesOverlap = (startA, endA, startB, endB) => {
	if (startA == null || endA == null || startB == null || endB == null)
		return false;
	// Overlap exists unless one ends before the other starts
	return !(endA <= startB || startA >= endB);
};

// Safely parse a time string to minutes; returns null if invalid/empty
const parseMinutesSafe = (timeStr) => {
	if (!timeStr) return null;
	try {
		return timeToMinutes(formatTo12Hour(timeStr.trim()));
	} catch (err) {
		return null;
	}
};

// Build an array of intervals [startMin, endMin] from a schedule-like object
// Considers timeInStart/timeInEnd, timeOutStart/timeOutEnd, legacy timeIn/timeOut,
// and a combined interval covering earliest start to latest end.
const buildIntervalsFromSchedule = (s) => {
	const intervals = [];

	const tinStart = parseMinutesSafe(s.timeInStart || s.timeIn);
	const tinEnd = parseMinutesSafe(s.timeInEnd || s.timeIn);
	const toutStart = parseMinutesSafe(s.timeOutStart || s.timeOut);
	const toutEnd = parseMinutesSafe(s.timeOutEnd || s.timeOut);

	// Add explicit in-range if valid
	if (tinStart != null && tinEnd != null && tinEnd > tinStart) {
		intervals.push([tinStart, tinEnd]);
	}

	// Add explicit out-range if valid
	if (toutStart != null && toutEnd != null && toutEnd > toutStart) {
		intervals.push([toutStart, toutEnd]);
	}

	// If no separate ranges but we have overall start/end, use them
	if (
		intervals.length === 0 &&
		tinStart != null &&
		toutEnd != null &&
		toutEnd > tinStart
	) {
		intervals.push([tinStart, toutEnd]);
	}

	// If still empty but legacy timeIn/timeOut present
	if (intervals.length === 0) {
		const legacyStart = parseMinutesSafe(s.timeIn);
		const legacyEnd = parseMinutesSafe(s.timeOut);
		if (legacyStart != null && legacyEnd != null && legacyEnd > legacyStart) {
			intervals.push([legacyStart, legacyEnd]);
		}
	}

	// Add a combined interval covering earliest start to latest end if possible
	const starts = intervals.map((i) => i[0]);
	const ends = intervals.map((i) => i[1]);
	if (starts.length && ends.length) {
		const combinedStart = Math.min(...starts);
		const combinedEnd = Math.max(...ends);
		// Only push combined if it spans more than any existing interval (avoid duplicates)
		if (combinedEnd > combinedStart)
			intervals.push([combinedStart, combinedEnd]);
	}

	return intervals;
};

// Create a new schedule
const createSchedule = async (req, res) => {
	try {
		const { day, subjectId, teacherId, sectionId, timeIn, timeOut } = req.body;

		// Validate required fields
		if (!day || !timeIn || !timeOut || !subjectId || !teacherId || !sectionId) {
			return res.status(400).json({
				success: false,
				error:
					"Day, time in, time out, subject, teacher, and section are required",
			});
		}

		// Validate day is Monday-Friday only
		const validWeekdays = [
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
		];
		if (!validWeekdays.includes(day.trim())) {
			return res.status(400).json({
				success: false,
				error: "Day must be Monday - Friday",
			});
		}

		// Validate time format and logic
		const timeInMinutes = timeToMinutes(formatTo12Hour(timeIn.trim()));
		const timeOutMinutes = timeToMinutes(formatTo12Hour(timeOut.trim()));

		if (timeInMinutes >= timeOutMinutes) {
			return res.status(400).json({
				success: false,
				error: "Time out must be after time in",
			});
		}

		// Debug logging
		console.log("🔍 Server Debug - Request body:", req.body);
		console.log("🔍 Server Debug - timeIn:", timeIn);
		console.log("🔍 Server Debug - timeOut:", timeOut);

		// Create schedule data
		const scheduleData = {
			day: day.trim(),
			timeIn: formatTo12Hour(timeIn.trim()),
			timeOut: formatTo12Hour(timeOut.trim()),
			subjectId: subjectId.trim(),
			teacherId: teacherId.trim(),
			sectionId: sectionId.trim(),
			createdAt: admin.database.ServerValue.TIMESTAMP,
			updatedAt: admin.database.ServerValue.TIMESTAMP,
		};

		console.log("🔍 Server Debug - scheduleData being saved:", scheduleData);

		// Check for conflicting schedules on the same day for same teacher or same section
		try {
			const dayTrim = scheduleData.day;
			const existingSnapshot = await db
				.ref("schedules")
				.orderByChild("day")
				.equalTo(dayTrim)
				.once("value");

			const newIntervals = buildIntervalsFromSchedule(scheduleData);

			if (existingSnapshot.exists() && newIntervals.length) {
				let conflict = null;
				existingSnapshot.forEach((childSnapshot) => {
					const existing = childSnapshot.val();

					// Only compare schedules that belong to same teacher or same section
					if (
						existing.teacherId !== scheduleData.teacherId &&
						existing.sectionId !== scheduleData.sectionId
					) {
						return false; // continue
					}

					const existingIntervals = buildIntervalsFromSchedule(existing);

					// Compare every interval pair for overlap
					for (const ni of newIntervals) {
						for (const ei of existingIntervals) {
							if (rangesOverlap(ni[0], ni[1], ei[0], ei[1])) {
								conflict = existing;
								return true; // stop iterating outer
							}
						}
					}
				});

				if (conflict) {
					return res.status(409).json({
						success: false,
						error: `Schedule conflict with existing schedule (id: ${
							conflict.id || "unknown"
						}) for teacher or section on ${scheduleData.day}.`,
						conflict: conflict,
					});
				}
			}
		} catch (err) {
			console.error("Error checking schedule conflicts:", err);
			// Fail fast: don't allow creation when conflict-check could not be completed
			return res.status(500).json({
				success: false,
				error: "Failed to verify schedule conflicts: " + err.message,
			});
		}

		// Add schedule to database
		const scheduleRef = db.ref("schedules").push();
		const scheduleId = scheduleRef.key;

		// Create schedule data with ID
		const scheduleWithId = {
			id: scheduleId,
			...scheduleData,
		};

		// Generate QR codes for both time-in and time-out
		const timeInQRCode = await generateScheduleQRCode(scheduleWithId, "timeIn");
		const timeOutQRCode = await generateScheduleQRCode(
			scheduleWithId,
			"timeOut"
		);

		// Add QR codes to schedule data
		const finalScheduleData = {
			...scheduleWithId,
			qrCodes: {
				timeIn: timeInQRCode,
				timeOut: timeOutQRCode,
			},
			// Keep backward compatibility with single qrCode field
			qrCode: timeInQRCode,
		};

		await scheduleRef.set(finalScheduleData);

		// Invalidate cache for schedules
		invalidateCache("schedules_");

		res.status(201).json({
			success: true,
			data: finalScheduleData,
			message: "Schedule created successfully",
		});
	} catch (error) {
		console.error("Error creating schedule:", error);
		res.status(500).json({
			success: false,
			error: "Failed to create schedule: " + error.message,
		});
	}
};

// Get all schedules with pagination and filtering
const getAllSchedules = async (req, res) => {
	try {
		const {
			page = 1,
			limit = 50,
			day,
			sectionId,
			teacherId,
			subjectId,
		} = req.query;

		const pageNum = parseInt(page);
		const limitNum = Math.min(parseInt(limit), 100); // Cap at 100 items per page
		const offset = (pageNum - 1) * limitNum;

		let query = db.ref("schedules");

		// Apply filters
		if (day) {
			query = query.orderByChild("day").equalTo(day);
		} else if (sectionId) {
			query = query.orderByChild("sectionId").equalTo(sectionId);
		} else if (teacherId) {
			query = query.orderByChild("teacherId").equalTo(teacherId);
		} else if (subjectId) {
			query = query.orderByChild("subjectId").equalTo(subjectId);
		} else {
			// Default ordering by creation date for better performance
			query = query.orderByChild("createdAt");
		}

		// Create cache key based on query parameters
		const cacheKey = `schedules_${JSON.stringify({
			day,
			sectionId,
			teacherId,
			subjectId,
			page: pageNum,
			limit: limitNum,
		})}`;

		const result = await withCache(
			cacheKey,
			async () => {
				const dbResult = await safeDbQuery(() => query.once("value"));
				if (!dbResult.success) {
					throw new Error(dbResult.error);
				}
				return dbResult.data;
			},
			300000
		); // 5 minutes cache

		const snapshot = result;
		const allSchedules = [];

		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				allSchedules.push(childSnapshot.val());
			});
		}

		// Apply pagination
		const totalCount = allSchedules.length;
		const paginatedSchedules = allSchedules.slice(offset, offset + limitNum);

		res.json({
			success: true,
			data: paginatedSchedules,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total: totalCount,
				pages: Math.ceil(totalCount / limitNum),
				hasNext: offset + limitNum < totalCount,
				hasPrev: pageNum > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching schedules:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch schedules: " + error.message,
		});
	}
};

// Get schedule by ID
const getScheduleById = async (req, res) => {
	try {
		const { id } = req.params;

		const snapshot = await db.ref(`schedules/${id}`).once("value");

		if (!snapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Schedule not found",
			});
		}

		res.json({
			success: true,
			data: snapshot.val(),
		});
	} catch (error) {
		console.error("Error fetching schedule:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch schedule: " + error.message,
		});
	}
};

// Update schedule
const updateSchedule = async (req, res) => {
	try {
		const { id } = req.params;
		const { day, timeIn, timeOut, subjectId, teacherId, sectionId } = req.body;

		// Check if schedule exists
		const snapshot = await db.ref(`schedules/${id}`).once("value");
		if (!snapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Schedule not found",
			});
		}

		// Validate day is Monday-Friday only if day is being updated
		if (day) {
			const validWeekdays = [
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
			];
			if (!validWeekdays.includes(day.trim())) {
				return res.status(400).json({
					success: false,
					error: "Day must be Monday - Friday",
				});
			}
		}

		// Validate time if provided
		if (timeIn && timeOut) {
			const effectiveTimeIn = formatTo12Hour(timeIn.trim());
			const effectiveTimeOut = formatTo12Hour(timeOut.trim());
			const timeInMinutes = timeToMinutes(effectiveTimeIn);
			const timeOutMinutes = timeToMinutes(effectiveTimeOut);

			if (timeInMinutes >= timeOutMinutes) {
				return res.status(400).json({
					success: false,
					error: "Time out must be after time in",
				});
			}
		}

		// Conflict check: ensure updated schedule doesn't overlap with another schedule
		try {
			// determine the day to check (updated or existing)
			const currentSchedule = snapshot.val();
			const checkDay = (day || currentSchedule.day || "").trim();

			// Build a merged schedule object combining current and incoming values
			const mergedSchedule = {
				...currentSchedule,
				day: checkDay,
				timeIn:
					timeIn !== undefined
						? timeIn
							? formatTo12Hour(timeIn.trim())
							: ""
						: currentSchedule.timeIn,
				timeOut:
					timeOut !== undefined
						? timeOut
							? formatTo12Hour(timeOut.trim())
							: ""
						: currentSchedule.timeOut,
				teacherId:
					teacherId !== undefined
						? teacherId.trim()
						: currentSchedule.teacherId,
				sectionId:
					sectionId !== undefined
						? sectionId.trim()
						: currentSchedule.sectionId,
			};

			const newIntervals = buildIntervalsFromSchedule(mergedSchedule);

			if (newIntervals.length) {
				const existingSnapshot = await db
					.ref("schedules")
					.orderByChild("day")
					.equalTo(checkDay)
					.once("value");

				if (existingSnapshot.exists()) {
					let conflict = null;
					existingSnapshot.forEach((childSnap) => {
						const existing = childSnap.val();
						const existingId = existing.id || childSnap.key;
						// skip comparing to itself
						if (existingId === id) return false;

						// Only compare when teacher or section would collide
						if (
							existing.teacherId !== mergedSchedule.teacherId &&
							existing.sectionId !== mergedSchedule.sectionId
						) {
							return false;
						}

						const existingIntervals = buildIntervalsFromSchedule(existing);

						for (const ni of newIntervals) {
							for (const ei of existingIntervals) {
								if (rangesOverlap(ni[0], ni[1], ei[0], ei[1])) {
									conflict = existing;
									return true; // break out
								}
							}
						}
					});

					if (conflict) {
						return res.status(409).json({
							success: false,
							error: `Schedule conflict with existing schedule (id: ${
								conflict.id || "unknown"
							}) for teacher or section on ${checkDay}.`,
							conflict: conflict,
						});
					}
				}
			}
		} catch (err) {
			console.error("Error checking schedule conflicts on update:", err);
			// Fail update when conflict-check cannot complete
			return res.status(500).json({
				success: false,
				error: "Failed to verify schedule conflicts: " + err.message,
			});
		}

		// Debug logging
		console.log("🔍 Server Debug - Update request body:", req.body);
		console.log("🔍 Server Debug - timeIn:", timeIn);
		console.log("🔍 Server Debug - timeOut:", timeOut);

		// Prepare update data
		const updateData = {
			updatedAt: admin.database.ServerValue.TIMESTAMP,
		};

		if (day !== undefined) updateData.day = day.trim();
		if (timeIn !== undefined)
			updateData.timeIn = timeIn ? formatTo12Hour(timeIn.trim()) : "";
		if (timeOut !== undefined)
			updateData.timeOut = timeOut ? formatTo12Hour(timeOut.trim()) : "";
		if (subjectId !== undefined) updateData.subjectId = subjectId.trim();
		if (teacherId !== undefined) updateData.teacherId = teacherId.trim();
		if (sectionId !== undefined) updateData.sectionId = sectionId.trim();

		console.log("🔍 Server Debug - updateData being saved:", updateData);

		// Update schedule
		await db.ref(`schedules/${id}`).update(updateData);

		// Get updated schedule
		const updatedSnapshot = await db.ref(`schedules/${id}`).once("value");
		const updatedSchedule = updatedSnapshot.val();

		// Regenerate QR codes for updated schedule
		const timeInQRCode = await generateScheduleQRCode(
			updatedSchedule,
			"timeIn"
		);
		const timeOutQRCode = await generateScheduleQRCode(
			updatedSchedule,
			"timeOut"
		);

		// Update QR codes if generation was successful
		if (timeInQRCode && timeOutQRCode) {
			const qrUpdateData = {
				qrCodes: {
					timeIn: timeInQRCode,
					timeOut: timeOutQRCode,
				},
				qrCode: timeInQRCode, // Keep backward compatibility
			};

			await db.ref(`schedules/${id}`).update(qrUpdateData);
			updatedSchedule.qrCodes = qrUpdateData.qrCodes;
			updatedSchedule.qrCode = qrUpdateData.qrCode;
		}

		// Invalidate cache for schedules
		invalidateCache("schedules_");

		res.json({
			success: true,
			data: updatedSchedule,
			message: "Schedule updated successfully",
		});
	} catch (error) {
		console.error("Error updating schedule:", error);
		res.status(500).json({
			success: false,
			error: "Failed to update schedule: " + error.message,
		});
	}
};

// Delete schedule
const deleteSchedule = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if schedule exists
		const snapshot = await db.ref(`schedules/${id}`).once("value");
		if (!snapshot.exists()) {
			return res.status(404).json({
				success: false,
				error: "Schedule not found",
			});
		}

		// Delete schedule
		await db.ref(`schedules/${id}`).remove();

		// Invalidate cache for schedules
		invalidateCache("schedules_");

		res.json({
			success: true,
			message: "Schedule deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting schedule:", error);
		res.status(500).json({
			success: false,
			error: "Failed to delete schedule: " + error.message,
		});
	}
};

// Get schedules by day
const getSchedulesByDay = async (req, res) => {
	try {
		const { day } = req.params;

		const snapshot = await db
			.ref("schedules")
			.orderByChild("day")
			.equalTo(day)
			.once("value");
		const schedules = [];

		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				schedules.push(childSnapshot.val());
			});
		}

		res.json({
			success: true,
			data: schedules,
			count: schedules.length,
		});
	} catch (error) {
		console.error("Error fetching schedules by day:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch schedules by day: " + error.message,
		});
	}
};

// Get schedules by section
const getSchedulesBySection = async (req, res) => {
	try {
		const { sectionId } = req.params;

		const snapshot = await db
			.ref("schedules")
			.orderByChild("sectionId")
			.equalTo(sectionId)
			.once("value");
		const schedules = [];

		if (snapshot.exists()) {
			snapshot.forEach((childSnapshot) => {
				schedules.push(childSnapshot.val());
			});
		}

		res.json({
			success: true,
			data: schedules,
			count: schedules.length,
		});
	} catch (error) {
		console.error("Error fetching schedules by section:", error);
		res.status(500).json({
			success: false,
			error: "Failed to fetch schedules by section: " + error.message,
		});
	}
};

// Helper function to convert time to minutes
const timeToMinutes = (timeStr) => {
	const [time, period] = timeStr.split(" ");
	const [hours, minutes] = time.split(":").map(Number);

	let totalMinutes = hours * 60 + minutes;

	if (period === "PM" && hours !== 12) {
		totalMinutes += 12 * 60;
	} else if (period === "AM" && hours === 12) {
		totalMinutes -= 12 * 60;
	}

	return totalMinutes;
};

module.exports = {
	createSchedule,
	getAllSchedules,
	getScheduleById,
	updateSchedule,
	deleteSchedule,
	getSchedulesByDay,
	getSchedulesBySection,
};
