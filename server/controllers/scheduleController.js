const QRCode = require("qrcode");
const { db, admin } = require("../config/firebase-admin-config");

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

// Create a new schedule
const createSchedule = async (req, res) => {
  try {
    const {
      day,
      subjectId,
      teacherId,
      sectionId,
      timeInStart,
      timeInEnd,
      timeOutStart,
      timeOutEnd,
      lateTimeIn,
    } = req.body;

    // Validate required fields - using only new range fields
    if (
      !day ||
      !timeInStart ||
      !timeOutEnd ||
      !subjectId ||
      !teacherId ||
      !sectionId
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Day, start time in, end time out, subject, teacher, and section are required",
      });
    }

    // Validate time format and logic
    const timeInStartMinutes = timeToMinutes(
      formatTo12Hour(timeInStart.trim())
    );
    const timeOutEndMinutes = timeToMinutes(formatTo12Hour(timeOutEnd.trim()));

    if (timeInStartMinutes >= timeOutEndMinutes) {
      return res.status(400).json({
        success: false,
        error: "End time out must be after start time in",
      });
    }

    // Debug logging
    console.log("🔍 Server Debug - Request body:", req.body);
    console.log("🔍 Server Debug - timeInStart:", timeInStart);
    console.log("🔍 Server Debug - timeInEnd:", timeInEnd);
    console.log("🔍 Server Debug - timeOutStart:", timeOutStart);
    console.log("🔍 Server Debug - timeOutEnd:", timeOutEnd);
    console.log("🔍 Server Debug - lateTimeIn:", lateTimeIn);

    // Create schedule data - only using new range fields
    const scheduleData = {
      day: day.trim(),
      // Store only the new range fields
      timeInStart: formatTo12Hour(timeInStart.trim()),
      timeInEnd: timeInEnd ? formatTo12Hour(timeInEnd.trim()) : "",
      timeOutStart: timeOutStart ? formatTo12Hour(timeOutStart.trim()) : "",
      timeOutEnd: formatTo12Hour(timeOutEnd.trim()),
      lateTimeIn: lateTimeIn ? formatTo12Hour(lateTimeIn.trim()) : "",
      subjectId: subjectId.trim(),
      teacherId: teacherId.trim(),
      sectionId: sectionId.trim(),
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    console.log("🔍 Server Debug - scheduleData being saved:", scheduleData);

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

// Get all schedules
const getAllSchedules = async (req, res) => {
  try {
    const snapshot = await db.ref("schedules").once("value");
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
    const {
      day,
      timeIn,
      timeOut,
      subjectId,
      teacherId,
      sectionId,
      timeInStart,
      timeInEnd,
      timeOutStart,
      timeOutEnd,
      lateTimeIn,
    } = req.body;

    // Check if schedule exists
    const snapshot = await db.ref(`schedules/${id}`).once("value");
    if (!snapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    // Validate time if provided
    if ((timeIn && timeOut) || (timeInStart && timeOutEnd)) {
      const effectiveTimeIn = formatTo12Hour((timeInStart || timeIn).trim());
      const effectiveTimeOut = formatTo12Hour((timeOutEnd || timeOut).trim());
      const timeInMinutes = timeToMinutes(effectiveTimeIn);
      const timeOutMinutes = timeToMinutes(effectiveTimeOut);

      if (timeInMinutes >= timeOutMinutes) {
        return res.status(400).json({
          success: false,
          error: "Time out must be after time in",
        });
      }
    }

    // Debug logging
    console.log("🔍 Server Debug - Update request body:", req.body);
    console.log("🔍 Server Debug - timeInStart:", timeInStart);
    console.log("🔍 Server Debug - timeInEnd:", timeInEnd);
    console.log("🔍 Server Debug - timeOutStart:", timeOutStart);
    console.log("🔍 Server Debug - timeOutEnd:", timeOutEnd);

    // Prepare update data
    const updateData = {
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };

    if (day !== undefined) updateData.day = day.trim();
    if (timeIn !== undefined || timeInStart !== undefined)
      updateData.timeIn = formatTo12Hour((timeInStart || timeIn || "").trim());
    if (timeOut !== undefined || timeOutEnd !== undefined)
      updateData.timeOut = formatTo12Hour((timeOutEnd || timeOut || "").trim());
    // Always update range fields if provided
    if (timeInStart !== undefined)
      updateData.timeInStart = timeInStart
        ? formatTo12Hour(timeInStart.trim())
        : "";
    if (timeInEnd !== undefined)
      updateData.timeInEnd = timeInEnd ? formatTo12Hour(timeInEnd.trim()) : "";
    if (timeOutStart !== undefined)
      updateData.timeOutStart = timeOutStart
        ? formatTo12Hour(timeOutStart.trim())
        : "";
    if (timeOutEnd !== undefined)
      updateData.timeOutEnd = timeOutEnd
        ? formatTo12Hour(timeOutEnd.trim())
        : "";
    if (lateTimeIn !== undefined)
      updateData.lateTimeIn = lateTimeIn
        ? formatTo12Hour(lateTimeIn.trim())
        : "";
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
