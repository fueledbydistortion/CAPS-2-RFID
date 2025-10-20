/**
 * Demo file to test attendance status calculation
 * This file demonstrates how the attendance status logic works with different scenarios
 */

import { calculateAttendanceStatus, formatAttendanceMessage, getStatusColor } from './attendanceUtils';

// Test scenarios for attendance status calculation
export const testAttendanceScenarios = () => {
  console.log('=== Attendance Status Calculation Demo ===\n');

  const testCases = [
    {
      name: 'On Time (Present)',
      scheduledTime: '8:00 AM',
      actualTime: '8:00 AM',
      expected: 'present'
    },
    {
      name: '5 Minutes Late (Present - Within Grace Period)',
      scheduledTime: '8:00 AM',
      actualTime: '8:05 AM',
      expected: 'present'
    },
    {
      name: '15 Minutes Late (Present - At Grace Period Limit)',
      scheduledTime: '8:00 AM',
      actualTime: '8:15 AM',
      expected: 'present'
    },
    {
      name: '16 Minutes Late (Late - Beyond Grace Period)',
      scheduledTime: '8:00 AM',
      actualTime: '8:16 AM',
      expected: 'late'
    },
    {
      name: '30 Minutes Late (Late)',
      scheduledTime: '8:00 AM',
      actualTime: '8:30 AM',
      expected: 'late'
    },
    {
      name: 'Early Arrival (Present)',
      scheduledTime: '8:00 AM',
      actualTime: '7:45 AM',
      expected: 'present'
    },
    {
      name: 'Afternoon Session - On Time',
      scheduledTime: '1:00 PM',
      actualTime: '1:00 PM',
      expected: 'present'
    },
    {
      name: 'Afternoon Session - 10 Minutes Late (Present)',
      scheduledTime: '1:00 PM',
      actualTime: '1:10 PM',
      expected: 'present'
    },
    {
      name: 'Afternoon Session - 20 Minutes Late (Late)',
      scheduledTime: '1:00 PM',
      actualTime: '1:20 PM',
      expected: 'late'
    }
  ];

  testCases.forEach((testCase, index) => {
    const result = calculateAttendanceStatus(testCase.scheduledTime, testCase.actualTime, 15);
    const message = formatAttendanceMessage(result, 'timeIn');
    const color = getStatusColor(result.status);
    
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`   Scheduled: ${testCase.scheduledTime}`);
    console.log(`   Actual:    ${testCase.actualTime}`);
    console.log(`   Status:    ${result.status.toUpperCase()} (${color})`);
    console.log(`   Minutes Late: ${result.minutesLate}`);
    console.log(`   Message:   ${message}`);
    console.log(`   Expected:  ${testCase.expected}`);
    console.log(`   ✓ Test ${result.status === testCase.expected ? 'PASSED' : 'FAILED'}`);
    console.log('');
  });

  console.log('=== QR Code Scanning Flow Demo ===\n');
  
  // Simulate QR code scanning scenarios
  const qrScenarios = [
    {
      schedule: { timeIn: '8:00 AM', timeOut: '9:00 AM' },
      currentTime: '8:05 AM',
      attendanceType: 'timeIn',
      description: 'Student arrives 5 minutes late for morning session'
    },
    {
      schedule: { timeIn: '8:00 AM', timeOut: '9:00 AM' },
      currentTime: '8:20 AM',
      attendanceType: 'timeIn',
      description: 'Student arrives 20 minutes late for morning session'
    },
    {
      schedule: { timeIn: '8:00 AM', timeOut: '9:00 AM' },
      currentTime: '9:00 AM',
      attendanceType: 'timeOut',
      description: 'Student leaves exactly at scheduled time'
    }
  ];

  qrScenarios.forEach((scenario, index) => {
    const scheduledTime = scenario.attendanceType === 'timeIn' ? scenario.schedule.timeIn : scenario.schedule.timeOut;
    const result = calculateAttendanceStatus(scheduledTime, scenario.currentTime, 15);
    const message = formatAttendanceMessage(result, scenario.attendanceType);
    
    console.log(`${index + 1}. ${scenario.description}`);
    console.log(`   Schedule: ${scenario.schedule.timeIn} - ${scenario.schedule.timeOut}`);
    console.log(`   ${scenario.attendanceType === 'timeIn' ? 'Check-in' : 'Check-out'} Time: ${scheduledTime}`);
    console.log(`   Actual Time: ${scenario.currentTime}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Message: ${message}`);
    console.log('');
  });
};

// Function to get current time for testing
export const getCurrentTimeForTesting = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Function to simulate different times for testing
export const simulateAttendanceAtTime = (scheduledTime, testTime, gracePeriodMinutes = 15) => {
  const result = calculateAttendanceStatus(scheduledTime, testTime, gracePeriodMinutes);
  const message = formatAttendanceMessage(result, 'timeIn');
  const color = getStatusColor(result.status);
  
  return {
    scheduledTime,
    actualTime: testTime,
    status: result.status,
    color,
    minutesLate: result.minutesLate,
    isOnTime: result.isOnTime,
    message
  };
};

// Export for use in browser console or testing
if (typeof window !== 'undefined') {
  window.testAttendanceScenarios = testAttendanceScenarios;
  window.simulateAttendanceAtTime = simulateAttendanceAtTime;
  window.getCurrentTimeForTesting = getCurrentTimeForTesting;
}
