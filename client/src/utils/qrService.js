import QRCode from 'qrcode';

/**
 * Generate QR code data URL for a schedule with attendance type
 * @param {Object} schedule - Schedule object containing schedule details
 * @param {string} attendanceType - 'timeIn' or 'timeOut'
 * @returns {Promise<string>} - Data URL of the generated QR code
 */
export const generateScheduleQRCode = async (schedule, attendanceType = 'timeIn') => {
  try {
    // Create QR code data with schedule information
    const qrData = {
      type: 'schedule',
      attendanceType: attendanceType,
      id: schedule.id,
      day: schedule.day,
      timeIn: schedule.timeIn,
      timeOut: schedule.timeOut,
      subjectId: schedule.subjectId,
      teacherId: schedule.teacherId,
      sectionId: schedule.sectionId,
      timestamp: new Date().toISOString()
    };

    // Convert to JSON string
    const qrString = JSON.stringify(qrData);

    // Different colors for different attendance types
    const colors = {
      timeIn: {
        dark: '#4caf50', // Green for time-in
        light: '#ffffff'
      },
      timeOut: {
        dark: '#ff9800', // Orange for time-out
        light: '#ffffff'
      }
    };

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: colors[attendanceType] || colors.timeIn,
      errorCorrectionLevel: 'M'
    });

    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code data URL for a simple text/URL
 * @param {string} text - Text or URL to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} - Data URL of the generated QR code
 */
export const generateQRCode = async (text, options = {}) => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#1565c0',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const qrDataURL = await QRCode.toDataURL(text, defaultOptions);
    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as SVG string
 * @param {string} text - Text to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} - SVG string of the generated QR code
 */
export const generateQRCodeSVG = async (text, options = {}) => {
  try {
    const defaultOptions = {
      width: 200,
      margin: 2,
      color: {
        dark: '#1565c0',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M',
      ...options
    };

    const qrSVG = await QRCode.toString(text, { 
      type: 'svg',
      ...defaultOptions 
    });
    return qrSVG;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
};

/**
 * Parse QR code data from a scanned QR code
 * @param {string} qrData - QR code data string
 * @returns {Object|null} - Parsed schedule data or null if invalid
 */
export const parseScheduleQRCode = (qrData) => {
  try {
    const parsed = JSON.parse(qrData);
    
    // Validate that it's a schedule QR code
    if (parsed.type === 'schedule' && parsed.id) {
      // Set default attendance type if not present (backward compatibility)
      if (!parsed.attendanceType) {
        parsed.attendanceType = 'timeIn';
      }
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};
