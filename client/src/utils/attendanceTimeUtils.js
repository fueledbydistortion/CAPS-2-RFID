/**
 * Utility functions for determining attendance type based on time and schedule
 */

/**
 * Convert 12-hour time format to minutes for comparison
 * @param {string} timeStr - Time string in 12-hour format (e.g., "9:00 AM", "2:30 PM")
 * @returns {number} - Time in minutes from midnight
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;

  // If already in 24-hour format (HH:MM), convert to 12-hour first
  if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    timeStr = `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  }

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

/**
 * Get current time in minutes from midnight
 * @returns {number} - Current time in minutes
 */
export const getCurrentTimeInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/**
 * Determine if current time is within a time range
 * @param {string} startTime - Start time in 12-hour format
 * @param {string} endTime - End time in 12-hour format
 * @returns {boolean} - True if current time is within range
 */
export const isTimeInRange = (startTime, endTime) => {
  const currentMinutes = getCurrentTimeInMinutes();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

/**
 * Determine attendance type based on current time and schedule
 * @param {Object} schedule - Schedule object with time ranges
 * @param {string} currentDay - Current day of the week
 * @returns {Object} - { type: 'timeIn'|'timeOut'|'outside', message: string }
 */
export const determineAttendanceType = (schedule, currentDay) => {
  // Check if it's the correct day
  if (schedule.day !== currentDay) {
    return {
      type: "outside",
      message: `No schedule for ${currentDay}. Schedule is for ${schedule.day}.`,
    };
  }

  const currentMinutes = getCurrentTimeInMinutes();
  const timeInStartMinutes = timeToMinutes(schedule.timeInStart);
  const timeInEndMinutes = timeToMinutes(schedule.timeInEnd);
  const timeOutStartMinutes = timeToMinutes(schedule.timeOutStart);
  const timeOutEndMinutes = timeToMinutes(schedule.timeOutEnd);

  // Check if current time is within Time In range
  if (
    currentMinutes >= timeInStartMinutes &&
    currentMinutes <= timeInEndMinutes
  ) {
    return {
      type: "timeIn",
      message: `Time In: ${schedule.timeInStart} - ${schedule.timeInEnd}`,
    };
  }

  // Check if current time is within Time Out range
  if (
    currentMinutes >= timeOutStartMinutes &&
    currentMinutes <= timeOutEndMinutes
  ) {
    return {
      type: "timeOut",
      message: `Time Out: ${schedule.timeOutStart} - ${schedule.timeOutEnd}`,
    };
  }

  // Check if it's before Time In
  if (currentMinutes < timeInStartMinutes) {
    const timeUntilStart = timeInStartMinutes - currentMinutes;
    const hoursUntil = Math.floor(timeUntilStart / 60);
    const minutesUntil = timeUntilStart % 60;
    return {
      type: "outside",
      message: `Too early. Time In starts at ${schedule.timeInStart} (in ${hoursUntil}h ${minutesUntil}m)`,
    };
  }

  // Check if it's after Time Out
  if (currentMinutes > timeOutEndMinutes) {
    const timeSinceEnd = currentMinutes - timeOutEndMinutes;
    const hoursSince = Math.floor(timeSinceEnd / 60);
    const minutesSince = timeSinceEnd % 60;
    return {
      type: "outside",
      message: `Too late. Time Out ended at ${schedule.timeOutEnd} (${hoursSince}h ${minutesSince}m ago)`,
    };
  }

  // Check if it's between Time In and Time Out (break time)
  if (
    currentMinutes > timeInEndMinutes &&
    currentMinutes < timeOutStartMinutes
  ) {
    return {
      type: "outside",
      message: `Break time. Time Out starts at ${schedule.timeOutStart}`,
    };
  }

  return {
    type: "outside",
    message: "No valid attendance window available",
  };
};

/**
 * Get the current day of the week
 * @returns {string} - Current day (e.g., "Monday", "Tuesday", etc.)
 */
export const getCurrentDay = () => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
};

/**
 * Find the relevant schedule for a student based on current day and time
 * @param {Array} schedules - Array of schedule objects
 * @param {string} studentId - Student ID to find schedule for
 * @returns {Object|null} - Relevant schedule or null
 */
export const findRelevantSchedule = (schedules, studentId) => {
  const currentDay = getCurrentDay();

  // Find schedules for today
  const todaySchedules = schedules.filter(
    (schedule) => schedule.day === currentDay
  );

  if (todaySchedules.length === 0) {
    return null;
  }

  // If there's only one schedule for today, return it
  if (todaySchedules.length === 1) {
    return todaySchedules[0];
  }

  // If multiple schedules, find the one that matches the student's section
  // This would require additional logic to match student to section
  // For now, return the first schedule
  return todaySchedules[0];
};
