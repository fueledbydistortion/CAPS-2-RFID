import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Box, Paper, Typography } from '@mui/material'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const ProgressCharts = ({ progressData }) => {
  // Prepare data for charts
  const prepareProgressDistributionData = () => {
    const statusCounts = {
      completed: 0,
      in_progress: 0,
      started: 0,
      not_started: 0
    }

    progressData.parentProgress.forEach(parent => {
      if (parent.averageProgress >= 100) statusCounts.completed++
      else if (parent.averageProgress >= 50) statusCounts.in_progress++
      else if (parent.averageProgress > 0) statusCounts.started++
      else statusCounts.not_started++
    })

    return {
      labels: ['Completed', 'In Progress', 'Started', 'Not Started'],
      datasets: [{
        data: [statusCounts.completed, statusCounts.in_progress, statusCounts.started, statusCounts.not_started],
        backgroundColor: [
          '#4caf50',
          '#ff9800',
          'hsl(145, 60%, 40%)',
          '#f44336'
        ],
        borderColor: [
          '#388e3c',
          '#f57c00',
          'hsl(220, 60%, 25%)',
          '#d32f2f'
        ],
        borderWidth: 2
      }]
    }
  }

  const prepareSectionComparisonData = () => {
    const sectionStats = {}
    
    progressData.parentProgress.forEach(parent => {
      parent.sections.forEach(section => {
        if (!sectionStats[section.name]) {
          sectionStats[section.name] = {
            totalStudents: 0,
            totalProgress: 0,
            completedLessons: 0,
            totalLessons: 0
          }
        }
        sectionStats[section.name].totalStudents++
        sectionStats[section.name].totalProgress += parent.averageProgress
        sectionStats[section.name].completedLessons += parent.completedLessons
        sectionStats[section.name].totalLessons += parent.totalLessons
      })
    })

    const sections = Object.keys(sectionStats)
    const averageProgress = sections.map(section => 
      Math.round(sectionStats[section].totalProgress / sectionStats[section].totalStudents)
    )
    const completionRates = sections.map(section => 
      Math.round((sectionStats[section].completedLessons / sectionStats[section].totalLessons) * 100)
    )

    return {
      labels: sections,
      datasets: [
        {
          label: 'Average Progress %',
          data: averageProgress,
          backgroundColor: 'rgba(31, 120, 80, 0.6)',
          borderColor: 'hsl(145, 60%, 40%)',
          borderWidth: 2
        },
        {
          label: 'Completion Rate %',
          data: completionRates,
          backgroundColor: 'rgba(76, 175, 80, 0.6)',
          borderColor: '#4caf50',
          borderWidth: 2
        }
      ]
    }
  }

  const prepareProgressTrendData = () => {
    // Mock data for progress trends over time (in a real app, this would come from historical data)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const averageProgress = [45, 52, 58, 65, 72, progressData.summary.averageProgress]
    
    return {
      labels: months,
      datasets: [{
        label: 'Average Progress %',
        data: averageProgress,
        borderColor: 'hsl(145, 60%, 40%)',
        backgroundColor: 'rgba(31, 120, 80, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    }
  }

  const prepareStudentPerformanceData = () => {
    const performanceRanges = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      '60-69%': 0,
      'Below 60%': 0
    }

    progressData.parentProgress.forEach(parent => {
      const progress = parent.averageProgress
      if (progress >= 90) performanceRanges['90-100%']++
      else if (progress >= 80) performanceRanges['80-89%']++
      else if (progress >= 70) performanceRanges['70-79%']++
      else if (progress >= 60) performanceRanges['60-69%']++
      else performanceRanges['Below 60%']++
    })

    return {
      labels: Object.keys(performanceRanges),
      datasets: [{
        data: Object.values(performanceRanges),
        backgroundColor: [
          '#4caf50',
          '#8bc34a',
          '#ffc107',
          '#ff9800',
          '#f44336'
        ],
        borderColor: [
          '#388e3c',
          '#689f38',
          '#f57c00',
          '#f57c00',
          '#d32f2f'
        ],
        borderWidth: 2
      }]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%'
          }
        }
      }
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
      {/* Charts Section - Row Layout */}
        {/* Overall Progress Distribution */}
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
            📊 Overall Progress Distribution
          </Typography>
          <Box sx={{ height: 200 }}>
            <Doughnut data={prepareProgressDistributionData()} options={doughnutOptions} />
          </Box>
        </Paper>

        {/* Section Performance Comparison */}
        <Paper sx={{ 
          flex: '1 1 400px',
          minWidth: '400px',
          p: 4, 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(15px)', 
          border: '2px solid rgba(76, 175, 80, 0.3)', 
          borderRadius: '16px', 
          boxShadow: '0 8px 30px rgba(76, 175, 80, 0.15)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 15px 40px rgba(76, 175, 80, 0.25)'
          }
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', 
            color: '#2e7d32', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: 'center'
          , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
            📈 Section Performance Comparison
          </Typography>
          <Box sx={{ height: 200 }}>
            <Bar data={prepareSectionComparisonData()} options={chartOptions} />
          </Box>
        </Paper>
    </Box>
  )
}

export default ProgressCharts

