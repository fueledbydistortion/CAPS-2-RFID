const axios = require('axios');

// IPROG SMS API configuration
// Update (Oct 6, 2025): Now using provider 2 which supports all networks!
const IPROG_API_TOKEN = 'fe874d7afa8e3442c0e29304ad6f49a53ceb6e7d'; // Replace with your actual IPROG API token from https://sms.iprogtech.com
const IPROG_BASE_URL = 'https://sms.iprogtech.com/api/v1';

// Helper function to format time to 12-hour format
const formatTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  
  // If already in 12-hour format (contains AM/PM), return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  
  // If in 24-hour format (HH:MM), convert to 12-hour
  if (timeStr.includes(':')) {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }
  
  return timeStr;
};

// Rate limiting: 120 calls per minute (2 calls per second max)
const RATE_LIMIT = 120; // calls per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
let requestTimes = [];

/**
 * Send SMS using IPROG SMS API
 * @param {string} phoneNumber - Recipient's phone number (format: +639xxxxxxxxx or 09xxxxxxxxx)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - API response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Rate limiting check
    const now = Date.now();
    requestTimes = requestTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (requestTimes.length >= RATE_LIMIT) {
      const oldestRequest = Math.min(...requestTimes);
      const waitTime = RATE_LIMIT_WINDOW - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds`);
    }
    
    requestTimes.push(now);
    
    // Validate API token
    if (!IPROG_API_TOKEN || IPROG_API_TOKEN === 'YOUR_IPROG_API_TOKEN_HERE') {
      throw new Error('IPROG API token not configured. Please set your API token in smsService.js');
    }

    // Validate phone number format
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Use phone number as-is without conversion
    const formattedPhoneNumber = phoneNumber;

    console.log(`SMS: Using phone number as-is: ${formattedPhoneNumber}`);
    
    // Validate message doesn't start with "TEST" (IPROG might ignore these)
    if (message.toUpperCase().startsWith('TEST')) {
      throw new Error('Messages starting with "TEST" are silently ignored by IPROG API');
    }
    
    // Prepare IPROG API request
    // Update (Oct 6, 2025): Using new service provider that supports all networks
    const requestData = {
      api_token: IPROG_API_TOKEN,
      phone_number: formattedPhoneNumber,
      message: message,
      sms_provider: 2 // New provider that supports all networks
    };

    const response = await axios.post(`${IPROG_BASE_URL}/sms_messages`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Handle IPROG API response
    const responseData = response.data;
    console.log('SMS API Response:', responseData);
    
    // Check if response indicates success
    if (responseData.status === 200) {
      return {
        success: true,
        data: responseData,
        message: 'SMS sent successfully',
        messageId: responseData.message_id
      };
    } else {
      return {
        success: false,
        error: responseData.message || 'SMS delivery failed',
        data: responseData
      };
    }
  } catch (error) {
    console.error('SMS sending error:', error.response?.data || error.message);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return {
        success: false,
        error: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
        retryAfter: retryAfter
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      statusCode: error.response?.status
    };
  }
};

/**
 * Send attendance notification SMS
 * @param {Object} attendanceData - Attendance information
 * @param {string} attendanceData.studentName - Student's name
 * @param {string} attendanceData.parentPhone - Parent's phone number
 * @param {string} attendanceData.attendanceType - 'timeIn' or 'timeOut'
 * @param {string} attendanceData.time - Time of attendance
 * @param {string} attendanceData.scheduleDay - Day of the schedule
 * @param {string} attendanceData.scheduleTime - Schedule time range
 * @param {string} attendanceData.subjectName - Subject/Skill name
 * @returns {Promise<Object>} - SMS sending result
 */
const sendAttendanceNotification = async (attendanceData) => {
  const {
    studentName,
    parentPhone,
    attendanceType,
    time,
    scheduleDay,
    scheduleTime,
    subjectName
  } = attendanceData;

  console.log('SMS Notification Request:', {
    studentName,
    parentPhone,
    attendanceType,
    time,
    scheduleDay,
    scheduleTime,
    subjectName
  });

  if (!parentPhone) {
    console.log('SMS Error: No parent phone number provided');
    return {
      success: false,
      error: 'Parent phone number not available'
    };
  }

  const attendanceText = attendanceType === 'timeIn' ? 'checked in' : 'checked out';
  // Times are already in 12-hour format from the database, so use them as-is
  const formattedTime = time; // Already in 12-hour format - this is the actual scan time
  const formattedScheduleTime = scheduleTime; // Already in 12-hour format - this is the scheduled time
  
  console.log('SMS Time Debug:', {
    attendanceType,
    actualScanTime: formattedTime,
    scheduledTime: formattedScheduleTime,
    timeSource: 'This is the actual time when the QR was scanned'
  });
  
  // Create a more detailed message showing both check-in and check-out info
  const message = `SmartChildcare Notification

Your child ${studentName} has ${attendanceText} for ${subjectName} class.

Day: ${scheduleDay}
Class Schedule: ${formattedScheduleTime}
Actual ${attendanceType === 'timeIn' ? 'Check-in' : 'Check-out'} Time: ${formattedTime}

${attendanceType === 'timeIn' ? 
  'Your child has successfully checked in. They can now participate in the class activities.' : 
  'Your child has successfully checked out. Thank you for using SmartChildcare services.'}

Thank you for using SmartChildcare!`;

  return await sendSMS(parentPhone, message);
};

/**
 * Check account balance and status
 * @returns {Promise<Object>} - Account information
 */
const checkAccount = async () => {
  try {
    const response = await axios.get(`${IPROG_BASE_URL}/account/sms_credits`, {
      params: {
        api_token: IPROG_API_TOKEN
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Account check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Check SMS status by message ID
 * @param {string} messageId - Message ID to check
 * @returns {Promise<Object>} - Message status information
 */
const checkSMSStatus = async (messageId) => {
  try {
    const response = await axios.get(`${IPROG_BASE_URL}/sms_messages/status`, {
      params: {
        api_token: IPROG_API_TOKEN,
        message_id: messageId
      }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('SMS status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

module.exports = {
  sendSMS,
  sendAttendanceNotification,
  checkAccount,
  checkSMSStatus
};
