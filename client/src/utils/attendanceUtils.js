// Utility functions for attendance status calculation

/**
 * Convert 12-hour time string to minutes since midnight
 * @param {string} timeStr - Time in format "H:MM AM/PM" or "HH:MM AM/PM"
 * @returns {number} Minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const [time, period] = timeStr.trim().split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  
  if (period?.toUpperCase() === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period?.toUpperCase() === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
};

/**
 * Calculate attendance status based on scheduled time and actual time
 * @param {string} scheduledTime - Scheduled time in "H:MM AM/PM" format
 * @param {string} actualTime - Actual scan time in "H:MM AM/PM" format
 * @param {number} gracePeriodMinutes - Grace period in minutes (default: 15)
 * @returns {Object} Status result with status, minutesLate, and isOnTime
 */
export const calculateAttendanceStatus = (scheduledTime, actualTime, gracePeriodMinutes = 15) => {
  if (!scheduledTime || !actualTime) {
    return {
      status: 'absent',
      minutesLate: 0,
      isOnTime: false
    };
  }

  const scheduledMinutes = timeToMinutes(scheduledTime);
  const actualMinutes = timeToMinutes(actualTime);
  
  const minutesLate = actualMinutes - scheduledMinutes;
  
  if (minutesLate <= 0) {
    return {
      status: 'present',
      minutesLate: 0,
      isOnTime: true
    };
  } else if (minutesLate <= gracePeriodMinutes) {
    return {
      status: 'present',
      minutesLate: minutesLate,
      isOnTime: false
    };
  } else {
    return {
      status: 'late',
      minutesLate: minutesLate,
      isOnTime: false
    };
  }
};

/**
 * Format attendance message based on status result
 * @param {Object} statusResult - Result from calculateAttendanceStatus
 * @param {string} attendanceType - Type of attendance (timeIn/timeOut)
 * @returns {string} Formatted message
 */
export const formatAttendanceMessage = (statusResult, attendanceType = 'timeIn') => {
  const { status, minutesLate, isOnTime } = statusResult;
  
  if (status === 'present' && isOnTime) {
    return `Student arrived on time for ${attendanceType}`;
  } else if (status === 'present' && !isOnTime) {
    return `Student arrived ${minutesLate} minutes late but within grace period for ${attendanceType}`;
  } else if (status === 'late') {
    return `Student arrived ${minutesLate} minutes late for ${attendanceType}`;
  } else {
    return `Student marked as absent for ${attendanceType}`;
  }
};

/**
 * Get color for attendance status
 * @param {string} status - Attendance status (present/late/absent)
 * @returns {string} Color name for UI components
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'present':
      return 'success';
    case 'late':
      return 'warning';
    case 'absent':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format time for display (12-hour format)
 * @param {string} timeStr - Time string to format
 * @returns {string} Formatted time string
 */
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  
  try {
    const [time, period] = timeStr.trim().split(' ');
    const [hours, minutes] = time.split(':');
    
    // Remove leading zero from hours if present
    const formattedHours = parseInt(hours, 10).toString();
    
    return `${formattedHours}:${minutes} ${period}`;
  } catch (error) {
    return timeStr;
  }
};

/**
 * Get current time in 12-hour format
 * @returns {string} Current time in "H:MM AM/PM" format
 */
export const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Validate time string format
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid time format
 */
export const isValidTimeFormat = (timeStr) => {
  if (!timeStr) return false;
  
  const timeRegex = /^(1[0-2]|[1-9]):[0-5][0-9]\s?(AM|PM)$/i;
  return timeRegex.test(timeStr.trim());
};

/**
 * Calculate grace period end time
 * @param {string} scheduledTime - Scheduled time
 * @param {number} gracePeriodMinutes - Grace period in minutes
 * @returns {string} Grace period end time in 12-hour format
 */
export const calculateGracePeriodEnd = (scheduledTime, gracePeriodMinutes = 15) => {
  if (!scheduledTime) return '';
  
  const scheduledMinutes = timeToMinutes(scheduledTime);
  const graceEndMinutes = scheduledMinutes + gracePeriodMinutes;
  
  // Convert back to 12-hour format
  const hours = Math.floor(graceEndMinutes / 60) % 24;
  const minutes = graceEndMinutes % 60;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};
