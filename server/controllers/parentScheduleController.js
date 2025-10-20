const { db, admin } = require('../config/firebase-admin-config');
const { sendAttendanceNotification } = require('../services/smsService');

// Helper to convert 12-hour time string (e.g. "1:05 PM") to minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(' ');
  if (parts.length < 2) return null;
  const [time, period] = parts;
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  let total = hours * 60 + minutes;
  if (period.toUpperCase() === 'PM' && hours !== 12) total += 12 * 60;
  if (period.toUpperCase() === 'AM' && hours === 12) total -= 12 * 60;
  return total;
};

// Calculate attendance status based on scheduled time and actual time
const calculateAttendanceStatus = (scheduledTime, actualTime, gracePeriodMinutes = 15) => {
  const scheduledMinutes = timeToMinutes(scheduledTime);
  const actualMinutes = timeToMinutes(actualTime);
  
  if (scheduledMinutes === null || actualMinutes === null) {
    console.error('Invalid time format:', { scheduledTime, actualTime });
    return {
      status: 'absent',
      minutesLate: 0,
      isOnTime: false,
      error: 'Invalid time format'
    };
  }
  
  const minutesLate = actualMinutes - scheduledMinutes;
  
  // If arriving before or within grace period, mark as present
  if (minutesLate <= gracePeriodMinutes) {
    return {
      status: 'present',
      minutesLate: Math.max(0, minutesLate),
      isOnTime: minutesLate <= 0
    };
  }
  
  // If arriving after grace period, mark as late
  return {
    status: 'late',
    minutesLate: minutesLate,
    isOnTime: false
  };
};

// Format attendance status message
const formatAttendanceMessage = (statusResult, attendanceType = 'timeIn') => {
  const { status, minutesLate, isOnTime } = statusResult;
  
  switch (status) {
    case 'present':
      if (isOnTime) {
        return `${attendanceType === 'timeIn' ? 'Checked in' : 'Checked out'} on time`;
      } else {
        return `${attendanceType === 'timeIn' ? 'Checked in' : 'Checked out'} ${minutesLate} minutes late (within grace period)`;
      }
    case 'late':
      return `${attendanceType === 'timeIn' ? 'Checked in' : 'Checked out'} ${minutesLate} minutes late`;
    case 'absent':
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
    const usersSnapshot = await db.ref('users').once('value');
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    // The parent's uid represents their child in the assignedStudents array
    const parent = users.find(user => user.uid === parentId);
    
    if (!parent) {
      return res.json({
        success: true,
        data: [],
        message: 'Parent not found'
      });
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    // Get all sections
    const sectionsSnapshot = await db.ref('sections').once('value');
    const sections = [];
    if (sectionsSnapshot.exists()) {
      sectionsSnapshot.forEach((childSnapshot) => {
        sections.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // Find sections where children are assigned
    const relevantSections = sections.filter(section => {
      if (!section.assignedStudents) return false;
      return section.assignedStudents.some(studentId => childIds.includes(studentId));
    });

    // Get schedules for these sections
    const schedulesSnapshot = await db.ref('schedules').once('value');
    const allSchedules = [];
    if (schedulesSnapshot.exists()) {
      schedulesSnapshot.forEach((childSnapshot) => {
        allSchedules.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    const parentSchedules = allSchedules.filter(schedule => {
      return relevantSections.some(section => section.id === schedule.sectionId);
    });

    // Add additional information to each schedule
    const enrichedSchedules = parentSchedules.map(schedule => {
      const section = relevantSections.find(s => s.id === schedule.sectionId);
      // In your database structure, if the parent's uid is in assignedStudents,
      // it means this parent represents their child in that section
      const assignedChildren = section.assignedStudents && section.assignedStudents.includes(parentId) ? [parent] : [];

      return {
        ...schedule,
        section: section,
        assignedChildren: assignedChildren
      };
    });

    res.json({
      success: true,
      data: enrichedSchedules,
      count: enrichedSchedules.length
    });

  } catch (error) {
    console.error('Error fetching parent schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent schedules: ' + error.message
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
    const daySchedules = parentSchedulesResult.data.filter(schedule => 
      schedule.day.toLowerCase() === day.toLowerCase()
    );

    res.json({
      success: true,
      data: daySchedules,
      count: daySchedules.length
    });

  } catch (error) {
    console.error('Error fetching parent schedules by day:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent schedules by day: ' + error.message
    });
  }
};

// Get attendance history for parent's children
const getParentChildrenAttendanceHistory = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { days = 30 } = req.query;

    // Get children of this parent
    const usersSnapshot = await db.ref('users').once('value');
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find(user => user.uid === parentId);
    
    if (!parent) {
      return res.json({
        success: true,
        data: [],
        message: 'Parent not found'
      });
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    // Get attendance records for these children
    const attendanceSnapshot = await db.ref('attendance').once('value');
    const allAttendanceRecords = [];
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        allAttendanceRecords.push(childSnapshot.val());
      });
    }

    // Filter attendance records for parent's children
    const childAttendanceRecords = allAttendanceRecords.filter(record => 
      childIds.includes(record.studentId)
    );

    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const filteredRecords = childAttendanceRecords.filter(record => 
      record.date >= cutoffDateStr
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add child information to each attendance record
    const enrichedRecords = filteredRecords.map(record => {
      // In your database structure, the parent represents their child
      const child = record.studentId === parentId ? parent : null;
      return {
        ...record,
        child: child
      };
    });

    res.json({
      success: true,
      data: enrichedRecords,
      count: enrichedRecords.length
    });

  } catch (error) {
    console.error('Error fetching parent children attendance history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance history: ' + error.message
    });
  }
};

// Helper to find active schedule for a given parentId based on current day/time
const findActiveScheduleForParent = async (parentId) => {
  // Get all sections
  const sectionsSnapshot = await db.ref('sections').once('value');
  const sections = [];
  if (sectionsSnapshot.exists()) {
    sectionsSnapshot.forEach((childSnapshot) => {
      sections.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  // Sections where parent is assigned (parent represents their child)
  const relevantSections = sections.filter((section) => {
    return Array.isArray(section.assignedStudents) && section.assignedStudents.includes(parentId);
  });
  if (relevantSections.length === 0) return null;

  // Get all schedules
  const schedulesSnapshot = await db.ref('schedules').once('value');
  const allSchedules = [];
  if (schedulesSnapshot.exists()) {
    schedulesSnapshot.forEach((childSnapshot) => {
      allSchedules.push({ id: childSnapshot.key, ...childSnapshot.val() });
    });
  }

  // Filter to schedules for relevant sections
  const parentSchedules = allSchedules.filter((s) => relevantSections.some((sec) => sec.id === s.sectionId));
  if (parentSchedules.length === 0) return null;

  // Determine current day and time
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const todayName = days[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // Try to find schedule that matches today and where now is between timeIn and timeOut
  const candidatesToday = parentSchedules.filter((s) => s.day === todayName);
  let active = null;
  for (const s of candidatesToday) {
    const start = timeToMinutes(s.timeIn);
    const end = timeToMinutes(s.timeOut);
    if (start != null && end != null && nowMinutes >= start && nowMinutes <= end) {
      active = s;
      break;
    }
  }

  // If none exactly active, fallback to first schedule for today
  if (!active && candidatesToday.length > 0) {
    active = candidatesToday[0];
  }

  return active;
};

// Mark attendance for parent's child via QR code
const markAttendanceViaQR = async (req, res) => {
  try {
    const { qrData, parentId, attendanceType, notes } = req.body;

    // Parse QR data
    let parsedQRData;
    try {
      parsedQRData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code data format'
      });
    }

    // Branch: allow either schedule QR or parent QR
    const isScheduleQR = parsedQRData.type === 'schedule' && !!parsedQRData.id;
    const isParentQR = parsedQRData.type === 'parent' && (!!parsedQRData.parentId || !!parentId);
    if (!isScheduleQR && !isParentQR) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code. Expecting type "schedule" or "parent".'
      });
    }

    // Get parent's children
    const usersSnapshot = await db.ref('users').once('value');
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // Resolve effective parent id
    const effectiveParentId = isParentQR ? (parsedQRData.parentId || parentId) : parentId;

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find(user => user.uid === effectiveParentId);
    
    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // The child is represented by the parent's uid
    const childIds = [effectiveParentId];

    // Determine schedule
    let schedule;
    if (isScheduleQR) {
      const scheduleSnapshot = await db.ref(`schedules/${parsedQRData.id}`).once('value');
      if (!scheduleSnapshot.exists()) {
        return res.status(404).json({ success: false, error: 'Schedule not found' });
      }
      schedule = scheduleSnapshot.val();
    } else {
      // Parent QR: infer active schedule for this parent
      const activeSchedule = await findActiveScheduleForParent(effectiveParentId);
      if (!activeSchedule) {
        return res.status(404).json({
          success: false,
          error: 'No active schedule found for this parent at this time.'
        });
      }
      schedule = activeSchedule;
    }

    // Get section to find assigned children
    const sectionSnapshot = await db.ref(`sections/${schedule.sectionId}`).once('value');
    if (!sectionSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: 'Section not found'
      });
    }

    const section = sectionSnapshot.val();
    // In your database structure, if the parent's uid is in assignedStudents,
    // it means this parent represents their child in that section
    const assignedChildren = section.assignedStudents && section.assignedStudents.includes(effectiveParentId) ? [parent] : [];

    if (assignedChildren.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No children found assigned to this schedule'
      });
    }

    // In your database structure, the parent represents their child
    const child = assignedChildren[0];
    
    // Use client's time if provided, otherwise fallback to server time
    const clientTime = req.body.currentTime;
    let currentTime;
    
    if (clientTime) {
      // Use client-provided time (already in their timezone)
      currentTime = clientTime;
      console.log('Using client-provided time:', clientTime);
    } else {
      // Fallback to server time if no client time provided
      currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log('Using server time (no client time provided):', currentTime);
    }

    const today = new Date().toISOString().split('T')[0];

    // Parse QR data and determine attendance type
    let qrAttendanceType;
    try {
      const parsedQRData = JSON.parse(qrData);
      qrAttendanceType = parsedQRData.attendanceType || attendanceType;
    } catch (error) {
      console.error('Error parsing QR data:', error);
      qrAttendanceType = attendanceType; // Fallback to request parameter
    }

    console.log('QR Attendance Type Debug:', {
      qrData: req.body.qrData,
      parsedQRData: qrAttendanceType,
      requestAttendanceType: attendanceType,
      finalAttendanceType: qrAttendanceType
    });

    // Calculate attendance status based on schedule time and current time
    const scheduledTime = qrAttendanceType === 'timeIn' ? schedule.timeIn : schedule.timeOut;
    const statusResult = calculateAttendanceStatus(scheduledTime, currentTime, 15); // 15-minute grace period
    const statusMessage = formatAttendanceMessage(statusResult, qrAttendanceType);

    // Check if attendance already exists for today
    const existingSnapshot = await db.ref('attendance')
      .orderByChild('scheduleId')
      .equalTo(schedule.id)
      .once('value');

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
    if (qrAttendanceType === 'timeOut') {
      // For time-out, only record timeOut and don't change status
      attendanceData = {
        timeOut: currentTime,
        notes: notes || 'Timed out via QR scan',
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };
    } else {
      // For time-in, use calculated status and full attendance data
      attendanceData = {
        scheduleId: schedule.id,
        studentId: child.uid,
        status: statusResult.status, // Use calculated status instead of hardcoded 'present'
        date: today,
        notes: notes || statusMessage, // Include status message in notes
        updatedAt: admin.database.ServerValue.TIMESTAMP
      };
    }

    // Validate attendance type
    if (!qrAttendanceType || !['timeIn', 'timeOut'].includes(qrAttendanceType)) {
      console.error('Invalid attendance type:', qrAttendanceType);
      return res.status(400).json({
        success: false,
        error: 'Invalid attendance type. Must be timeIn or timeOut.'
      });
    }

    // Add time in/out based on attendance type from QR code data
    if (qrAttendanceType === 'timeIn') {
      attendanceData.timeIn = currentTime;
    }
    // Note: timeOut is already added above in the timeOut branch

    if (attendanceId) {
      // Update existing attendance
      await db.ref(`attendance/${attendanceId}`).update(attendanceData);
    } else {
      // Create new attendance record
      attendanceData.createdAt = admin.database.ServerValue.TIMESTAMP;
      const attendanceRef = db.ref('attendance').push();
      attendanceId = attendanceRef.key;
      await attendanceRef.set({
        id: attendanceId,
        ...attendanceData
      });
    }

    // Send SMS notification (async, don't wait for it)
    sendAttendanceNotificationAsync(attendanceData, schedule, child, qrAttendanceType, currentTime);

    // Create appropriate response message
    let responseMessage;
    if (qrAttendanceType === 'timeOut') {
      responseMessage = `TIMED OUT: Student ${child.childName || `${child.firstName} ${child.lastName}`} has been timed out at ${currentTime}`;
    } else {
      responseMessage = `${statusResult.status.toUpperCase()}: ${statusMessage} for ${child.childName || `${child.firstName} ${child.lastName}`}`;
    }

    res.json({
      success: true,
      data: {
        id: attendanceId,
        ...attendanceData,
        child: child,
        schedule: schedule,
        statusResult: qrAttendanceType === 'timeOut' ? null : statusResult, // Only include for time-in
        statusMessage: qrAttendanceType === 'timeOut' ? 'Timed out via QR scan' : statusMessage
      },
      message: responseMessage
    });

  } catch (error) {
    console.error('Error marking attendance via QR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark attendance: ' + error.message
    });
  }
};

// Get today's attendance status for parent's children
const getTodayAttendanceStatus = async (req, res) => {
  try {
    const { parentId } = req.params;

    // Get children of this parent
    const usersSnapshot = await db.ref('users').once('value');
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find(user => user.uid === parentId);
    
    if (!parent) {
      return res.json({
        success: true,
        data: [],
        message: 'Parent not found'
      });
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    const today = new Date().toISOString().split('T')[0];

    // Get today's attendance records for these children
    const attendanceSnapshot = await db.ref('attendance').once('value');
    const allAttendanceRecords = [];
    if (attendanceSnapshot.exists()) {
      attendanceSnapshot.forEach((childSnapshot) => {
        allAttendanceRecords.push(childSnapshot.val());
      });
    }

    const todayAttendanceRecords = allAttendanceRecords.filter(record => 
      childIds.includes(record.studentId) && record.date === today
    );

    // Create status for the child (parent represents their child)
    const childrenStatus = [{
      child: parent,
      hasTimeIn: todayAttendanceRecords.some(record => record.studentId === parentId && record.timeIn),
      hasTimeOut: todayAttendanceRecords.some(record => record.studentId === parentId && record.timeOut),
      timeIn: todayAttendanceRecords.find(record => record.studentId === parentId)?.timeIn || null,
      timeOut: todayAttendanceRecords.find(record => record.studentId === parentId)?.timeOut || null,
      status: todayAttendanceRecords.find(record => record.studentId === parentId)?.status || 'absent',
      notes: todayAttendanceRecords.find(record => record.studentId === parentId)?.notes || null
    }];

    res.json({
      success: true,
      data: childrenStatus,
      count: childrenStatus.length
    });

  } catch (error) {
    console.error('Error fetching today attendance status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today attendance status: ' + error.message
    });
  }
};

// Helper function to get parent schedules data
const getParentSchedulesData = async (parentId) => {
  try {
    // Get all users to find children of this parent
    const usersSnapshot = await db.ref('users').once('value');
    const users = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        users.push({
          uid: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // In your database structure, the parent's child information is stored in the parent record itself
    const parent = users.find(user => user.uid === parentId);
    
    if (!parent) {
      return {
        success: true,
        data: []
      };
    }

    // The child is represented by the parent's uid
    const childIds = [parentId];

    // Get all sections
    const sectionsSnapshot = await db.ref('sections').once('value');
    const sections = [];
    if (sectionsSnapshot.exists()) {
      sectionsSnapshot.forEach((childSnapshot) => {
        sections.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    // Find sections where children are assigned
    const relevantSections = sections.filter(section => {
      if (!section.assignedStudents) return false;
      return section.assignedStudents.some(studentId => childIds.includes(studentId));
    });

    // Get schedules for these sections
    const schedulesSnapshot = await db.ref('schedules').once('value');
    const allSchedules = [];
    if (schedulesSnapshot.exists()) {
      schedulesSnapshot.forEach((childSnapshot) => {
        allSchedules.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    const parentSchedules = allSchedules.filter(schedule => {
      return relevantSections.some(section => section.id === schedule.sectionId);
    });

    // Add additional information to each schedule
    const enrichedSchedules = parentSchedules.map(schedule => {
      const section = relevantSections.find(s => s.id === schedule.sectionId);
      // In your database structure, if the parent's uid is in assignedStudents,
      // it means this parent represents their child in that section
      const assignedChildren = section.assignedStudents && section.assignedStudents.includes(parentId) ? [parent] : [];

      return {
        ...schedule,
        section: section,
        assignedChildren: assignedChildren
      };
    });

    return {
      success: true,
      data: enrichedSchedules
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Async function to send SMS notification for parent QR attendance (non-blocking)
const sendAttendanceNotificationAsync = async (attendanceData, schedule, child, attendanceType, time) => {
  try {
    console.log('Parent QR SMS: Starting SMS notification process');
    console.log('Parent QR SMS: Child data:', child);
    console.log('Parent QR SMS: Schedule data:', schedule);
    console.log('Parent QR SMS: Attendance type:', attendanceType);
    console.log('Parent QR SMS: Time:', time);

    // Get skill/subject details
    const skillSnapshot = await db.ref(`skills/${schedule.subjectId}`).once('value');
    const skill = skillSnapshot.exists() ? skillSnapshot.val() : { name: 'Unknown Subject' };

    // Prepare SMS data
    const smsData = {
      studentName: child.childName || `${child.firstName} ${child.lastName}`,
      parentPhone: child.phone,
      attendanceType: attendanceType,
      time: time,
      scheduleDay: schedule.day,
      scheduleTime: `${schedule.timeIn} - ${schedule.timeOut}`,
      subjectName: skill.name
    };

    console.log('Parent QR SMS: Prepared SMS data:', smsData);

    // Send SMS
    const smsResult = await sendAttendanceNotification(smsData);
    if (smsResult.success) {
      console.log(`SMS sent successfully for parent QR ${attendanceType} - ${child.childName || child.firstName}`);
    } else {
      console.log(`SMS failed for parent QR ${attendanceType} - ${child.childName || child.firstName}:`, smsResult.error);
    }
  } catch (error) {
    console.error('Error in parent QR SMS notification:', error);
  }
};

module.exports = {
  getParentSchedules,
  getParentSchedulesByDay,
  getParentChildrenAttendanceHistory,
  markAttendanceViaQR,
  getTodayAttendanceStatus
};
