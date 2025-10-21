const { db, admin } = require("../config/firebase-admin-config");
const { sendAttendanceNotification } = require("../services/smsService");

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

// Format attendance status message
const formatAttendanceMessage = (statusResult, attendanceType = "timeIn") => {
  const { status, minutesLate, isOnTime } = statusResult;

  switch (status) {
    case "present":
      if (isOnTime) {
        return `${
          attendanceType === "timeIn" ? "Checked in" : "Checked out"
        } on time`;
      } else {
        return `${
          attendanceType === "timeIn" ? "Checked in" : "Checked out"
        } ${minutesLate} minutes late (within grace period)`;
      }
    case "late":
      return `${
        attendanceType === "timeIn" ? "Checked in" : "Checked out"
      } ${minutesLate} minutes late`;
    case "absent":
      return `Marked as absent`;
    default:
      return `Attendance status: ${status}`;
  }
};

// Get schedules assigned to a specific parent (through their children)
const getParentSchedules = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Get all users to find children of this parent
    const usersSnapshot = await db.ref("users").once("value");
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    // The parent's uid represents their child in the assignedStudents array
    const parent = users.find((user) => user.uid === parentId);

    if (!parent) {
      return res.json({
        success: true,
        data: [],
        message: "Parent not found",
      });
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    // Get all sections
    const sectionsSnapshot = await db.ref("sections").once("value");
    const sections = [];
    if (sectionsSnapshot.exists()) {
      sectionsSnapshot.forEach((childSnapshot) => {
        sections.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // Find sections where children are assigned
    const relevantSections = sections.filter((section) => {
      if (!section.assignedStudents) return false;
      return section.assignedStudents.some((studentId) =>
        childIds.includes(studentId)
      );
    });

    // Get schedules for these sections
    const schedulesSnapshot = await db.ref("schedules").once("value");
    const allSchedules = [];
    if (schedulesSnapshot.exists()) {
      schedulesSnapshot.forEach((childSnapshot) => {
        allSchedules.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    const parentSchedules = allSchedules.filter((schedule) => {
      return relevantSections.some(
        (section) => section.id === schedule.sectionId
      );
    });

    // Add additional information to each schedule
    const enrichedSchedules = parentSchedules.map((schedule) => {
      const section = relevantSections.find((s) => s.id === schedule.sectionId);
      // In your database structure, if the parent's uid is in assignedStudents,
      // it means this parent represents their child in that section
      const assignedChildren =
        section.assignedStudents && section.assignedStudents.includes(parentId)
          ? [parent]
          : [];

      return {
        ...schedule,
        section: section,
        assignedChildren: assignedChildren,
      };
    });

    res.json({
      success: true,
      data: enrichedSchedules,
      count: enrichedSchedules.length,
    });
  } catch (error) {
    console.error("Error fetching parent schedules:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch parent schedules: " + error.message,
    });
  }
};

// Get parent's children schedules for a specific day
const getParentSchedulesByDay = async (req, res) => {
  try {
    const { parentId, day } = req.params;

    // Get all schedules for this parent
    const parentSchedulesResult = await getParentSchedulesData(parentId);
    if (!parentSchedulesResult.success) {
      return res.status(500).json(parentSchedulesResult);
    }

    // Filter by day
    const daySchedules = parentSchedulesResult.data.filter(
      (schedule) => schedule.day.toLowerCase() === day.toLowerCase()
    );

    res.json({
      success: true,
      data: daySchedules,
      count: daySchedules.length,
    });
  } catch (error) {
    console.error("Error fetching parent schedules by day:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch parent schedules by day: " + error.message,
    });
  }
};

// Get attendance history for parent's children
const getParentChildrenAttendanceHistory = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { days = 30 } = req.query;

    // Get children of this parent
    const usersSnapshot = await db.ref("users").once("value");
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find((user) => user.uid === parentId);

    if (!parent) {
      return res.json({
        success: true,
        data: [],
        message: "Parent not found",
      });
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    // Get attendance records for these children
    const attendanceSnapshot = await db.ref("attendance").once("value");
    const allAttendanceRecords = [];
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        allAttendanceRecords.push(childSnapshot.val());
      });
    }

    // Filter attendance records for parent's children
    const childAttendanceRecords = allAttendanceRecords.filter((record) =>
      childIds.includes(record.studentId)
    );

    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

    const filteredRecords = childAttendanceRecords
      .filter((record) => record.date >= cutoffDateStr)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add child information to each attendance record
    const enrichedRecords = filteredRecords.map((record) => {
      // In your database structure, the parent represents their child
      const child = record.studentId === parentId ? parent : null;
      return {
        ...record,
        child: child,
      };
    });

    res.json({
      success: true,
      data: enrichedRecords,
      count: enrichedRecords.length,
    });
  } catch (error) {
    console.error("Error fetching parent children attendance history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch attendance history: " + error.message,
    });
  }
};

// Helper to find active schedule for a given parentId based on current day/time
const findActiveScheduleForParent = async (parentId) => {
  console.log(
    `🔍 DEBUG: findActiveScheduleForParent - Starting for parent: ${parentId}`
  );
  // Get all sections
  const sectionsSnapshot = await db.ref("sections").once("value");
  const sections = [];
  if (sectionsSnapshot.exists()) {
    sectionsSnapshot.forEach((childSnapshot) => {
      sections.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  // Sections where parent is assigned (parent represents their child)
  const relevantSections = sections.filter((section) => {
    return (
      Array.isArray(section.assignedStudents) &&
      section.assignedStudents.includes(parentId)
    );
  });
  if (relevantSections.length === 0) return null;

  // Get all schedules
  const schedulesSnapshot = await db.ref("schedules").once("value");
  const allSchedules = [];
  if (schedulesSnapshot.exists()) {
    schedulesSnapshot.forEach((childSnapshot) => {
      allSchedules.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  // Filter to schedules for relevant sections
  const parentSchedules = allSchedules.filter((s) =>
    relevantSections.some((sec) => sec.id === s.sectionId)
  );
  if (parentSchedules.length === 0) return null;

  // Determine current day and time
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const now = new Date();
  const todayName = days[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Try to find schedule that matches today
  const candidatesToday = parentSchedules.filter((s) => s.day === todayName);
  console.log("🔍 findActiveScheduleForParent Debug:", {
    parentId,
    todayName,
    nowMinutes,
    totalSchedules: parentSchedules.length,
    candidatesToday: candidatesToday.length,
    candidatesTodayData: candidatesToday.map((s) => ({
      id: s.id,
      day: s.day,
      timeInStart: s.timeInStart,
      timeInEnd: s.timeInEnd,
      timeOutStart: s.timeOutStart,
      timeOutEnd: s.timeOutEnd,
      timeIn: s.timeIn,
      timeOut: s.timeOut,
    })),
  });

  if (candidatesToday.length === 0) return null;

  // For new schedule format with time ranges, check if current time falls within any time window
  let active = null;
  for (const s of candidatesToday) {
    console.log(`🔍 Checking schedule ${s.id}:`, {
      timeInStart: s.timeInStart,
      timeInEnd: s.timeInEnd,
      timeOutStart: s.timeOutStart,
      timeOutEnd: s.timeOutEnd,
      timeIn: s.timeIn,
      timeOut: s.timeOut,
    });

    // Check if current time is within Time In range
    if (s.timeInStart && s.timeInEnd) {
      const timeInStart = timeToMinutes(s.timeInStart);
      const timeInEnd = timeToMinutes(s.timeInEnd);
      console.log(`🔍 Time In range check:`, {
        timeInStart: s.timeInStart,
        timeInEnd: s.timeInEnd,
        timeInStartMinutes: timeInStart,
        timeInEndMinutes: timeInEnd,
        nowMinutes,
        inRange:
          timeInStart != null &&
          timeInEnd != null &&
          nowMinutes >= timeInStart &&
          nowMinutes <= timeInEnd,
      });
      if (
        timeInStart != null &&
        timeInEnd != null &&
        nowMinutes >= timeInStart &&
        nowMinutes <= timeInEnd
      ) {
        active = s;
        console.log(`✅ Found active schedule (Time In range): ${s.id}`);
        break;
      }
    }

    // Check if current time is within Time Out range
    if (s.timeOutStart && s.timeOutEnd) {
      const timeOutStart = timeToMinutes(s.timeOutStart);
      const timeOutEnd = timeToMinutes(s.timeOutEnd);
      console.log(`🔍 Time Out range check:`, {
        timeOutStart: s.timeOutStart,
        timeOutEnd: s.timeOutEnd,
        timeOutStartMinutes: timeOutStart,
        timeOutEndMinutes: timeOutEnd,
        nowMinutes,
        inRange:
          timeOutStart != null &&
          timeOutEnd != null &&
          nowMinutes >= timeOutStart &&
          nowMinutes <= timeOutEnd,
      });
      if (
        timeOutStart != null &&
        timeOutEnd != null &&
        nowMinutes >= timeOutStart &&
        nowMinutes <= timeOutEnd
      ) {
        active = s;
        console.log(`✅ Found active schedule (Time Out range): ${s.id}`);
        break;
      }
    }

    // Fallback to old format for backward compatibility
    if (s.timeIn && s.timeOut) {
      const start = timeToMinutes(s.timeIn);
      const end = timeToMinutes(s.timeOut);
      console.log(`🔍 Old format check:`, {
        timeIn: s.timeIn,
        timeOut: s.timeOut,
        startMinutes: start,
        endMinutes: end,
        nowMinutes,
        inRange:
          start != null &&
          end != null &&
          nowMinutes >= start &&
          nowMinutes <= end,
      });
      if (
        start != null &&
        end != null &&
        nowMinutes >= start &&
        nowMinutes <= end
      ) {
        active = s;
        console.log(`✅ Found active schedule (old format): ${s.id}`);
        break;
      }
    }
  }

  // If none exactly active, fallback to first schedule for today
  if (!active && candidatesToday.length > 0) {
    active = candidatesToday[0];
    console.log(`⚠️ No active schedule found, using fallback: ${active.id}`);
  }

  console.log(`🔍 Final result:`, {
    foundActive: !!active,
    activeScheduleId: active?.id,
    activeScheduleDay: active?.day,
  });

  return active;
};

// Mark attendance for parent's child via QR code
const markAttendanceViaQR = async (req, res) => {
  console.log("🔍 DEBUG: markAttendanceViaQR - Function started");
  console.log("🔍 DEBUG: markAttendanceViaQR - Request body:", req.body);

  try {
    const { qrData, parentId, attendanceType, notes } = req.body;
    console.log("🔍 DEBUG: markAttendanceViaQR - Extracted data:", {
      qrData,
      parentId,
      attendanceType,
      notes,
    });

    // Parse QR data
    let parsedQRData;
    try {
      parsedQRData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Invalid QR code data format",
      });
    }

    // Branch: allow either schedule QR or parent QR
    const isScheduleQR = parsedQRData.type === "schedule" && !!parsedQRData.id;
    const isParentQR =
      parsedQRData.type === "parent" && (!!parsedQRData.parentId || !!parentId);
    if (!isScheduleQR && !isParentQR) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code. Expecting type "schedule" or "parent".',
      });
    }

    // Get parent's children
    const usersSnapshot = await db.ref("users").once("value");
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // Resolve effective parent id
    const effectiveParentId = isParentQR
      ? parsedQRData.parentId || parentId
      : parentId;

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find((user) => user.uid === effectiveParentId);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: "Parent not found",
      });
    }

    // The child is represented by the parent's uid
    const childIds = [effectiveParentId];

    // Determine schedule
    let schedule;
    if (isScheduleQR) {
      const scheduleSnapshot = await db
        .ref(`schedules/${parsedQRData.id}`)
        .once("value");
      if (!scheduleSnapshot.exists()) {
        return res
          .status(404)
          .json({ success: false, error: "Schedule not found" });
      }
      schedule = scheduleSnapshot.val();
    } else {
      // Parent QR: infer active schedule for this parent
      const activeSchedule = await findActiveScheduleForParent(
        effectiveParentId
      );
      if (!activeSchedule) {
        console.log(
          "🔍 DEBUG: No active schedule found for parent:",
          effectiveParentId
        );
        console.log("🔍 DEBUG: Creating attendance record without schedule...");

        // Create a basic attendance record even without a schedule
        const today = new Date().toISOString().split("T")[0];
        const currentTime = new Date().toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        });

        const attendanceData = {
          studentId: effectiveParentId,
          status: attendanceType === "timeIn" ? "present" : "present",
          date: today,
          timeIn: attendanceType === "timeIn" ? currentTime : null,
          timeOut: attendanceType === "timeOut" ? currentTime : null,
          notes: `RFID scan - ${attendanceType} (No schedule found)`,
          createdAt: admin.database.ServerValue.TIMESTAMP,
          updatedAt: admin.database.ServerValue.TIMESTAMP,
        };

        // Save to Firebase
        const attendanceRef = db.ref("attendance").push();
        const attendanceId = attendanceRef.key;
        await attendanceRef.set({
          id: attendanceId,
          ...attendanceData,
        });

        console.log(
          "🔍 DEBUG: Attendance record created without schedule:",
          attendanceId
        );

        return res.status(200).json({
          success: true,
          data: {
            attendance: attendanceData,
            child: {
              firstName: "Student",
              lastName: "Name",
            },
          },
          message: "Attendance recorded successfully (no schedule found)",
        });
      }
      schedule = activeSchedule;
    }

    // Get section to find assigned children
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
    // In your database structure, if the parent's uid is in assignedStudents,
    // it means this parent represents their child in that section
    const assignedChildren =
      section.assignedStudents &&
      section.assignedStudents.includes(effectiveParentId)
        ? [parent]
        : [];

    if (assignedChildren.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No children found assigned to this schedule",
      });
    }

    // In your database structure, the parent represents their child
    const child = assignedChildren[0];

    // Use client's time if provided, otherwise fallback to server time
    const clientTime = req.body.currentTime;
    let currentTime;

    if (clientTime) {
      // Use client-provided time (already in their timezone)
      // IMPORTANT: Use client time as-is without any timezone conversion
      currentTime = clientTime;
      console.log("Using client-provided time (no conversion):", clientTime);
      console.log("Client time type:", typeof clientTime);

      // Debug: Compare server time with client time
      const serverTime = new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });
      console.log("Time comparison:", {
        clientTime,
        serverTime,
        serverDate: new Date().toString(),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        note: "Using client time as-is to avoid timezone conversion issues",
      });
    } else {
      // Fallback to server time if no client time provided
      currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      });
      console.log("Using server time (no client time provided):", currentTime);
    }

    const today = new Date().toISOString().split("T")[0];

    // Parse QR data and determine attendance type
    let qrAttendanceType;
    try {
      const parsedQRData = JSON.parse(qrData);
      qrAttendanceType = parsedQRData.attendanceType || attendanceType;
    } catch (error) {
      console.error("Error parsing QR data:", error);
      qrAttendanceType = attendanceType; // Fallback to request parameter
    }

    console.log("QR Attendance Type Debug:", {
      qrData: req.body.qrData,
      parsedQRData: qrAttendanceType,
      requestAttendanceType: attendanceType,
      finalAttendanceType: qrAttendanceType,
    });

    // Calculate attendance status based on schedule time and current time
    let scheduledTime;
    if (qrAttendanceType === "timeIn") {
      // Use new time range format if available, fallback to old format
      scheduledTime = schedule.timeInStart || schedule.timeIn;
    } else {
      // Use new time range format if available, fallback to old format
      scheduledTime = schedule.timeOutStart || schedule.timeOut;
    }

    const statusResult = calculateAttendanceStatus(
      scheduledTime,
      currentTime,
      15
    ); // 15-minute grace period
    const statusMessage = formatAttendanceMessage(
      statusResult,
      qrAttendanceType
    );

    // Check if attendance already exists for today
    const existingSnapshot = await db
      .ref("attendance")
      .orderByChild("scheduleId")
      .equalTo(schedule.id)
      .once("value");

    let attendanceId = null;
    if (existingSnapshot.exists()) {
      existingSnapshot.forEach((childSnapshot) => {
        const record = childSnapshot.val();
        if (record.studentId === child.uid && record.date === today) {
          attendanceId = childSnapshot.key;
        }
      });
    }

    // For timeOut QR codes, don't change status - only record the time-out
    let attendanceData;
    if (qrAttendanceType === "timeOut") {
      // For time-out, only record timeOut and don't change status
      attendanceData = {
        timeOut: currentTime,
        notes: notes || "Timed out via QR scan",
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };
    } else {
      // For time-in, use calculated status and full attendance data
      attendanceData = {
        scheduleId: schedule.id,
        studentId: child.uid,
        status: statusResult.status, // Use calculated status instead of hardcoded 'present'
        date: today,
        notes: notes || statusMessage, // Include status message in notes
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      };
    }

    // Validate attendance type
    if (
      !qrAttendanceType ||
      !["timeIn", "timeOut"].includes(qrAttendanceType)
    ) {
      console.error("Invalid attendance type:", qrAttendanceType);
      return res.status(400).json({
        success: false,
        error: "Invalid attendance type. Must be timeIn or timeOut.",
      });
    }

    // Add time in/out based on attendance type from QR code data
    if (qrAttendanceType === "timeIn") {
      attendanceData.timeIn = currentTime;
      console.log("Setting timeIn in attendanceData:", {
        qrAttendanceType,
        currentTime,
        timeInValue: attendanceData.timeIn,
      });
    }
    // Note: timeOut is already added above in the timeOut branch

    console.log("Final attendanceData before database save:", {
      timeIn: attendanceData.timeIn,
      timeOut: attendanceData.timeOut,
      qrAttendanceType,
      currentTime,
      attendanceDataKeys: Object.keys(attendanceData),
      fullAttendanceData: attendanceData,
    });

    if (attendanceId) {
      // Update existing attendance
      await db.ref(`attendance/${attendanceId}`).update(attendanceData);
      console.log("Updated existing attendance record:", attendanceId);
    } else {
      // Create new attendance record
      attendanceData.createdAt = admin.database.ServerValue.TIMESTAMP;
      const attendanceRef = db.ref("attendance").push();
      attendanceId = attendanceRef.key;
      await attendanceRef.set({
        id: attendanceId,
        ...attendanceData,
      });
      console.log("Created new attendance record:", attendanceId);
    }

    // Send SMS notification (async, don't wait for it)
    sendAttendanceNotificationAsync(
      attendanceData,
      schedule,
      child,
      qrAttendanceType,
      currentTime
    );

    // Create appropriate response message
    let responseMessage;
    if (qrAttendanceType === "timeOut") {
      responseMessage = `TIMED OUT: Student ${
        child.childName || `${child.firstName} ${child.lastName}`
      } has been timed out at ${currentTime}`;
    } else {
      responseMessage = `${statusResult.status.toUpperCase()}: ${statusMessage} for ${
        child.childName || `${child.firstName} ${child.lastName}`
      }`;
    }

    const responseData = {
      id: attendanceId,
      ...attendanceData,
      child: child,
      schedule: schedule,
      statusResult: qrAttendanceType === "timeOut" ? null : statusResult, // Only include for time-in
      statusMessage:
        qrAttendanceType === "timeOut"
          ? "Timed out via QR scan"
          : statusMessage,
    };

    console.log("Server response data:", {
      timeIn: responseData.timeIn,
      timeOut: responseData.timeOut,
      qrAttendanceType,
      currentTime,
      responseKeys: Object.keys(responseData),
    });

    res.json({
      success: true,
      data: responseData,
      message: responseMessage,
    });
  } catch (error) {
    console.error("🔍 DEBUG: markAttendanceViaQR - Error occurred:", error);
    console.error("🔍 DEBUG: markAttendanceViaQR - Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to mark attendance: " + error.message,
    });
  }
};

// Get today's attendance status for parent's children
const getTodayAttendanceStatus = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Get children of this parent
    const usersSnapshot = await db.ref("users").once("value");
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find((user) => user.uid === parentId);

    if (!parent) {
      return res.json({
        success: true,
        data: [],
        message: "Parent not found",
      });
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    const today = new Date().toISOString().split("T")[0];

    // Get today's attendance records for these children
    const attendanceSnapshot = await db.ref("attendance").once("value");
    const allAttendanceRecords = [];
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        allAttendanceRecords.push(childSnapshot.val());
      });
    }

    const todayAttendanceRecords = allAttendanceRecords.filter(
      (record) => childIds.includes(record.studentId) && record.date === today
    );

    // Create status for the child (parent represents their child)
    const childrenStatus = [
      {
        child: parent,
        hasTimeIn: todayAttendanceRecords.some(
          (record) => record.studentId === parentId && record.timeIn
        ),
        hasTimeOut: todayAttendanceRecords.some(
          (record) => record.studentId === parentId && record.timeOut
        ),
        timeIn:
          todayAttendanceRecords.find((record) => record.studentId === parentId)
            ?.timeIn || null,
        timeOut:
          todayAttendanceRecords.find((record) => record.studentId === parentId)
            ?.timeOut || null,
        status:
          todayAttendanceRecords.find((record) => record.studentId === parentId)
            ?.status || "absent",
        notes:
          todayAttendanceRecords.find((record) => record.studentId === parentId)
            ?.notes || null,
      },
    ];

    res.json({
      success: true,
      data: childrenStatus,
      count: childrenStatus.length,
    });
  } catch (error) {
    console.error("Error fetching today attendance status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch today attendance status: " + error.message,
    });
  }
};

// Helper function to get parent schedules data
const getParentSchedulesData = async (parentId) => {
  try {
    // Get all users to find children of this parent
    const usersSnapshot = await db.ref("users").once("value");
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find((user) => user.uid === parentId);

    if (!parent) {
      return {
        success: true,
        data: [],
      };
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    // Get all sections
    const sectionsSnapshot = await db.ref("sections").once("value");
    const sections = [];
    if (sectionsSnapshot.exists()) {
      sectionsSnapshot.forEach((childSnapshot) => {
        sections.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    // Find sections where children are assigned
    const relevantSections = sections.filter((section) => {
      if (!section.assignedStudents) return false;
      return section.assignedStudents.some((studentId) =>
        childIds.includes(studentId)
      );
    });

    // Get schedules for these sections
    const schedulesSnapshot = await db.ref("schedules").once("value");
    const allSchedules = [];
    if (schedulesSnapshot.exists()) {
      schedulesSnapshot.forEach((childSnapshot) => {
        allSchedules.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }

    const parentSchedules = allSchedules.filter((schedule) => {
      return relevantSections.some(
        (section) => section.id === schedule.sectionId
      );
    });

    // Add additional information to each schedule
    const enrichedSchedules = parentSchedules.map((schedule) => {
      const section = relevantSections.find((s) => s.id === schedule.sectionId);
      // In your database structure, if the parent's uid is in assignedStudents,
      // it means this parent represents their child in that section
      const assignedChildren =
        section.assignedStudents && section.assignedStudents.includes(parentId)
          ? [parent]
          : [];

      return {
        ...schedule,
        section: section,
        assignedChildren: assignedChildren,
      };
    });

    return {
      success: true,
      data: enrichedSchedules,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Async function to send SMS notification for parent QR attendance (non-blocking)
const sendAttendanceNotificationAsync = async (
  attendanceData,
  schedule,
  child,
  attendanceType,
  time
) => {
  try {
    console.log("Parent QR SMS: Starting SMS notification process");
    console.log("Parent QR SMS: Child data:", child);
    console.log("Parent QR SMS: Schedule data:", schedule);
    console.log("Parent QR SMS: Attendance type:", attendanceType);
    console.log("Parent QR SMS: Time:", time);

    // Get skill/subject details
    const skillSnapshot = await db
      .ref(`skills/${schedule.subjectId}`)
      .once("value");
    const skill = skillSnapshot.exists()
      ? skillSnapshot.val()
      : { name: "Unknown Subject" };

    // Prepare SMS data
    const smsData = {
      studentName: child.childName || `${child.firstName} ${child.lastName}`,
      parentPhone: child.phone,
      attendanceType: attendanceType,
      time: time,
      scheduleDay: schedule.day,
      scheduleTime:
        schedule.timeInStart &&
        schedule.timeInEnd &&
        schedule.timeOutStart &&
        schedule.timeOutEnd
          ? `${schedule.timeInStart} - ${schedule.timeInEnd} / ${schedule.timeOutStart} - ${schedule.timeOutEnd}`
          : `${schedule.timeIn || "N/A"} - ${schedule.timeOut || "N/A"}`,
      subjectName: skill.name,
    };

    console.log("Parent QR SMS: Prepared SMS data:", smsData);

    // Send SMS
    const smsResult = await sendAttendanceNotification(smsData);
    if (smsResult.success) {
      console.log(
        `SMS sent successfully for parent QR ${attendanceType} - ${
          child.childName || child.firstName
        }`
      );
    } else {
      console.log(
        `SMS failed for parent QR ${attendanceType} - ${
          child.childName || child.firstName
        }:`,
        smsResult.error
      );
    }
  } catch (error) {
    console.error("Error in parent QR SMS notification:", error);
  }
};

module.exports = {
  getParentSchedules,
  getParentSchedulesByDay,
  getParentChildrenAttendanceHistory,
  markAttendanceViaQR,
  getTodayAttendanceStatus,
};
