import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import { Box, Paper, Typography } from '@mui/material'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const AttendanceCharts = ({ attendanceData }) => {
  // Prepare attendance comparison data
  const prepareAttendanceComparisonData = () => {
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0
    }

    attendanceData.forEach(record => {
      if (record.status === 'present') statusCounts.present++
      else if (record.status === 'late') statusCounts.late++
      else if (record.status === 'absent') statusCounts.absent++
    })

    return {
      labels: ['Present', 'Late', 'Absent'],
      datasets: [{
        data: [statusCounts.present, statusCounts.late, statusCounts.absent],
        backgroundColor: [
          '#4caf50',
          '#ff9800',
          '#f44336'
        ],
        borderColor: [
          '#388e3c',
          '#f57c00',
          '#d32f2f'
        ],
        borderWidth: 2
      }]
    }
  }



  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'hsl(145, 60%, 40%)',
        borderWidth: 1
      }
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'row',
      gap: 3,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {/* Attendance Comparison */}
      <Paper sx={{ 
        flex: '1 1 400px',
        minWidth: '400px',
        p: 4, 
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)', 
        backdropFilter: 'blur(20px)', 
        border: '3px solid rgba(31, 120, 80, 0.3)', 
        borderRadius: '20px', 
        boxShadow: '0 12px 40px rgba(31, 120, 80, 0.2)',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 15px 50px rgba(31, 120, 80, 0.3)'
        }
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', 
          color: 'hsl(152, 65%, 28%)', 
          mb: 3,
          textShadow: '0 2px 4px rgba(31, 120, 80, 0.1)'
        , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
          📈 Attendance Comparison
        </Typography>
        <Box sx={{ height: 300 }}>
          <Doughnut data={prepareAttendanceComparisonData()} options={doughnutOptions} />
        </Box>
      </Paper>
    </Box>
  )
}

export default AttendanceCharts

