import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export report data to Excel format
 */
export const exportToExcel = (reportData, period) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Comprehensive Report Summary'],
      ['Period:', period],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Attendance Rate', `${reportData.attendance?.attendanceRate || 0}%`],
      ['Completion Rate', `${reportData.progress?.completionRate || 0}%`],
      ['Total Students', reportData.demographics?.totalStudents || 0],
      ['Total Teachers', reportData.demographics?.totalTeachers || 0]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Attendance Sheet
    if (reportData.attendance && reportData.attendance.summary) {
      const attendanceData = [
        ['Attendance Report'],
        ['Period:', period],
        [],
        ['Metric', 'Count'],
        ['Present', reportData.attendance.summary.presentCount || 0],
        ['Late', reportData.attendance.summary.lateCount || 0],
        ['Absent', reportData.attendance.summary.absentCount || 0],
        ['Total Records', reportData.attendance.summary.totalRecords || 0],
        ['Attendance Rate', `${reportData.attendance.attendanceRate || 0}%`]
      ];
      const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData);
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
    }

    // Progress Sheet
    if (reportData.progress && reportData.progress.summary) {
      const progressData = [
        ['Progress Report'],
        ['Period:', period],
        [],
        ['Metric', 'Count'],
        ['Completed Lessons', reportData.progress.summary.completedLessons || 0],
        ['Total Lessons', reportData.progress.summary.totalLessons || 0],
        ['Average Progress', `${reportData.progress.summary.averageProgress || 0}%`],
        ['Completion Rate', `${reportData.progress.completionRate || 0}%`]
      ];
      const progressSheet = XLSX.utils.aoa_to_sheet(progressData);
      XLSX.utils.book_append_sheet(workbook, progressSheet, 'Progress');
    }

    // Generate file
    const fileName = `Report_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return { success: true, message: 'Report exported to Excel successfully!' };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export report data to PDF format
 */
export const exportToPDF = (reportData, period, insights = [], recommendations = []) => {
  try {
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(21, 101, 192);
    doc.text('Comprehensive Reporting Dashboard', 20, yPosition);
    yPosition += 10;

    // Period and Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${period}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Key Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Key Metrics Overview', 20, yPosition);
    yPosition += 10;

    const metricsData = [
      ['Attendance Rate', `${reportData.attendance?.attendanceRate || 0}%`],
      ['Completion Rate', `${reportData.progress?.completionRate || 0}%`],
      ['Total Students', reportData.demographics?.totalStudents || 0],
      ['Total Teachers', reportData.demographics?.totalTeachers || 0]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [21, 101, 192] },
      margin: { left: 20, right: 20 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Attendance Analysis
    if (reportData.attendance && reportData.attendance.summary) {
      doc.setFontSize(14);
      doc.text('Attendance Analysis', 20, yPosition);
      yPosition += 10;

      const attendanceData = [
        ['Present', reportData.attendance.summary.presentCount || 0],
        ['Late', reportData.attendance.summary.lateCount || 0],
        ['Absent', reportData.attendance.summary.absentCount || 0],
        ['Total Records', reportData.attendance.summary.totalRecords || 0]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Status', 'Count']],
        body: attendanceData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Progress Analysis
    if (reportData.progress && reportData.progress.summary) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Progress Analysis', 20, yPosition);
      yPosition += 10;

      const progressData = [
        ['Completed Lessons', reportData.progress.summary.completedLessons || 0],
        ['Total Lessons', reportData.progress.summary.totalLessons || 0],
        ['Average Progress', `${reportData.progress.summary.averageProgress || 0}%`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: progressData,
        theme: 'striped',
        headStyles: { fillColor: [255, 152, 0] },
        margin: { left: 20, right: 20 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Insights Section
    if (insights && insights.length > 0) {
      // Add new page for insights
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(14);
      doc.text('Key Insights', 20, yPosition);
      yPosition += 10;

      const insightsData = insights.map(insight => [
        insight.title,
        insight.message,
        insight.priority
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Title', 'Message', 'Priority']],
        body: insightsData,
        theme: 'grid',
        headStyles: { fillColor: [103, 58, 183] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 90 },
          2: { cellWidth: 30 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Recommendations Section
    if (recommendations && recommendations.length > 0) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Recommendations', 20, yPosition);
      yPosition += 10;

      const recommendationsData = recommendations.slice(0, 5).map(rec => [
        rec.title,
        rec.action,
        rec.priority
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Title', 'Action', 'Priority']],
        body: recommendationsData,
        theme: 'striped',
        headStyles: { fillColor: [244, 143, 177] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 90 },
          2: { cellWidth: 30 }
        }
      });
    }

    // Save the PDF
    const fileName = `Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, message: 'Report exported to PDF successfully!' };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Show export options dialog
 */
export const handleExportReport = (reportData, period, insights, recommendations, format = 'both') => {
  if (!reportData) {
    return { success: false, error: 'No report data available to export' };
  }

  if (format === 'excel' || format === 'both') {
    exportToExcel(reportData, period);
  }

  if (format === 'pdf' || format === 'both') {
    exportToPDF(reportData, period, insights, recommendations);
  }

  return { success: true, message: 'Report exported successfully!' };
};

