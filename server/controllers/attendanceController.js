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
    console.log("Converted 24-hour to 12-hour:", { hour24, hour12, ampm, result });
    return result;
  }

  console.log("No conversion needed, returning original:", timeStr);
  return timeStr;
};

// Helper to convert 12-hour time string (e.g. "1:05 PM") to minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.trim().split(" ");
  if (parts.length < 2) return null;
  const [time, period] = parts;
  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  let total = hours * 60 + minutes;
  if (period.toUpperCase() === "PM" && hours !== 12) total += 12 * 60;
  if (period.toUpperCase() === "AM" && hours === 12) total -= 12 * 60;
  return total;
};

// Calculate attendance status based on scheduled time and actual time
const calculateAttendanceStatus = (
  scheduledTime,
  actualTime,
  gracePeriodMinutes = 15
) => {
  const scheduledMinutes = timeToMinutes(scheduledTime);
  const actualMinutes = timeToMinutes(actualTime);

  if (scheduledMinutes === null || actualMinutes === null) {
    console.error("Invalid time format:", { scheduledTime, actualTime });
    return {
      status: "absent",
      minutesLate: 0,
      isOnTime: false,
      error: "Invalid time format",
    };
  }

  const minutesLate = actualMinutes - scheduledMinutes;

  // If arriving before or within grace period, mark as present
  if (minutesLate <= gracePeriodMinutes) {
    return {
      status: "present",
      minutesLate: Math.max(0, minutesLate),
      isOnTime: minutesLate <= 0,
    };
  }

  // If arriving after grace period, mark as late
  return {
    status: "late",
    minutesLate: minutesLate,
    isOnTime: false,
  };
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
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

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

// Mark attendance for a student
const markAttendance = async (req, res) => {
  try {
    const { scheduleId, studentId, status, timeIn, timeOut } = req.body;

    console.log("Mark Attendance Request:", {
      scheduleId,
      studentId,
      status,
      timeIn,
      timeOut,
      currentTime: new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    // Log the actual time values being processed
    console.log("Time values being processed:", {
      timeIn: timeIn,
      timeOut: timeOut,
      timeInType: typeof timeIn,
      timeOutType: typeof timeOut,
    });

    // Validate required fields
    if (!scheduleId || !studentId) {
      return res.status(400).json({
        success: false,
        error: "Schedule ID and Student ID are required",
      });
    }

    // Get schedule details to calculate automatic status
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

    let finalStatus = status;
    let statusMessage = "";

    // If timeIn is provided and no explicit status, calculate status automatically
    if (timeIn && !status) {
      const statusResult = calculateAttendanceStatus(
        schedule.timeIn,
        timeIn,
        15
      ); // 15-minute grace period
      finalStatus = statusResult.status;
      statusMessage = `Auto-calculated: ${
        statusResult.isOnTime
          ? "On time"
          : `${statusResult.minutesLate} minutes late`
      }`;
    }
    // If timeIn is provided and status is provided, use the provided status (don't override)
    else if (timeIn && status) {
      // Keep the provided status, but still calculate status message for reference
      const statusResult = calculateAttendanceStatus(
        schedule.timeIn,
        timeIn,
        15
      );
      statusMessage = `Provided time: ${
        statusResult.isOnTime
          ? "On time"
          : `${statusResult.minutesLate} minutes late`
      }`;
    }
    // If status is provided, validate it
    else if (status) {
      const validStatuses = ["present", "absent", "late"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Status must be present, absent, or late",
        });
      }
    }
    // If neither status nor timeIn provided, default to absent
    else {
      finalStatus = "absent";
      statusMessage = "No time provided - marked as absent";
    }

    const today = new Date().toISOString().split("T")[0];

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

    if (attendanceId) {
      // Update existing attendance - preserve existing time-in/time-out data
      const existingRecord = await db
        .ref(`attendance/${attendanceId}`)
        .once("value");
      const existingData = existingRecord.val();

      const updateData = {
        status: finalStatus,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };

      // Only update timeIn if provided, otherwise keep existing
      if (timeIn !== null && timeIn !== undefined) {
        const formattedTimeIn = formatTo12Hour(timeIn);
        updateData.timeIn = formattedTimeIn;
        console.log("Updating timeIn:", {
          original: timeIn,
          formatted: formattedTimeIn,
          originalType: typeof timeIn,
        });
      }

      // Only update timeOut if provided, otherwise keep existing
      if (timeOut !== null && timeOut !== undefined) {
        const formattedTimeOut = formatTo12Hour(timeOut);
        updateData.timeOut = formattedTimeOut;
        console.log("Updating timeOut:", {
          original: timeOut,
          formatted: formattedTimeOut,
          originalType: typeof timeOut,
        });
      }

      await db.ref(`attendance/${attendanceId}`).update(updateData);
    } else {
      // Create new attendance record
      const attendanceData = {
        scheduleId,
        studentId,
        status: finalStatus,
        date: today,
        timeIn: formatTo12Hour(timeIn) || null,
        timeOut: formatTo12Hour(timeOut) || null,
        notes: statusMessage || null,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };

      console.log("Creating new attendance record:", {
        timeIn: { 
          original: timeIn, 
          formatted: formatTo12Hour(timeIn),
          originalType: typeof timeIn
        },
        timeOut: { 
          original: timeOut, 
          formatted: formatTo12Hour(timeOut),
          originalType: typeof timeOut
        },
      });

      const attendanceRef = db.ref("attendance").push();
      attendanceId = attendanceRef.key;
      await attendanceRef.set({
        id: attendanceId,
        ...attendanceData,
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
      timeIn,
      timeOut
    );

    // Create in-app notification for parent
    try {
      const userSnapshot = await db.ref(`users/${studentId}`).once("value");
      if (userSnapshot.exists()) {
        const student = userSnapshot.val();
        const scheduleData = await db
          .ref(`schedules/${scheduleId}`)
          .once("value");
        const schedule = scheduleData.val();

        // Get skill/subject name
        let subjectName = "Class";
        if (schedule && schedule.subjectId) {
          const skillSnapshot = await db
            .ref(`skills/${schedule.subjectId}`)
            .once("value");
          if (skillSnapshot.exists()) {
            subjectName = skillSnapshot.val().name;
          }
        }

        const timeInfo = timeIn ? ` at ${formatTo12Hour(timeIn)}` : "";
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
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

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
