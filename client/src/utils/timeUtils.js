/**
 * Convert 24-hour time format to 12-hour format
 * @param {string} timeStr - Time string in 24-hour format (e.g., "14:30" or "09:15")
 * @returns {string} - Time string in 12-hour format (e.g., "2:30 PM" or "9:15 AM")
 */
export const formatTo12Hour = (timeStr) => {
  if (!timeStr) return "-";

  // If already in 12-hour format (contains AM/PM), return as is
  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    return timeStr;
  }

  // Handle different time formats
  let time = timeStr;

  // If time is in HH:MM format
  if (time.includes(":")) {
    const [hours, minutes] = time.split(":");
    const hour24 = parseInt(hours, 10);
    const mins = minutes || "00";

    if (hour24 === 0) {
      return `12:${mins} AM`;
    } else if (hour24 < 12) {
      return `${hour24}:${mins} AM`;
    } else if (hour24 === 12) {
      return `12:${mins} PM`;
    } else {
      return `${hour24 - 12}:${mins} PM`;
    }
  }

  // If time is just hours (e.g., "14")
  const hour24 = parseInt(time, 10);
  if (!isNaN(hour24)) {
    if (hour24 === 0) {
      return "12:00 AM";
    } else if (hour24 < 12) {
      return `${hour24}:00 AM`;
    } else if (hour24 === 12) {
      return "12:00 PM";
    } else {
      return `${hour24 - 12}:00 PM`;
    }
  }

  return timeStr; // Return original if can't parse
};

/**
 * Format time range in 12-hour format
 * @param {string} timeIn - Start time
 * @param {string} timeOut - End time
 * @param {object} schedule - Optional schedule object with range fields
 * @returns {string} - Formatted time range
 */
export const formatTimeRange = (timeIn, timeOut, schedule = null) => {
  // If schedule object is provided and has range fields, use them
  if (
    schedule &&
    schedule.timeInStart &&
    schedule.timeInEnd &&
    schedule.timeOutStart &&
    schedule.timeOutEnd
  ) {
    const timeInRange = `${formatTo12Hour(
      schedule.timeInStart
    )} - ${formatTo12Hour(schedule.timeInEnd)}`;
    const timeOutRange = `${formatTo12Hour(
      schedule.timeOutStart
    )} - ${formatTo12Hour(schedule.timeOutEnd)}`;
    return `${timeInRange} / ${timeOutRange}`;
  }

  // Fallback to original timeIn/timeOut
  const formattedTimeIn = formatTo12Hour(timeIn);
  const formattedTimeOut = formatTo12Hour(timeOut);
  return `${formattedTimeIn} - ${formattedTimeOut}`;
};
