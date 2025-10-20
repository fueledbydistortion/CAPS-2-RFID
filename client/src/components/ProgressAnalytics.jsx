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
  RadialLinearScale
} from 'chart.js'
import { Radar, PolarArea } from 'react-chartjs-2'
import { Box, Paper, Typography, Card, CardContent, Chip } from '@mui/material'
import { TrendingUp, School, Assessment, CheckCircle } from '@mui/icons-material'

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
  ArcElement,
  RadialLinearScale
)

const ProgressAnalytics = ({ progressData }) => {
  // Prepare skill-based progress data
  const prepareSkillProgressData = () => {
    const skillStats = {}
    
    progressData.parentProgress.forEach(parent => {
      parent.sections.forEach(section => {
        if (!skillStats[section.name]) {
          skillStats[section.name] = {
            totalStudents: 0,
            totalProgress: 0,
            completedLessons: 0,
            totalLessons: 0
          }
        }
        skillStats[section.name].totalStudents++
        skillStats[section.name].totalProgress += parent.averageProgress
        skillStats[section.name].completedLessons += parent.completedLessons
        skillStats[section.name].totalLessons += parent.totalLessons
      })
    })

    const skills = Object.keys(skillStats)
    const progressValues = skills.map(skill => 
      Math.round(skillStats[skill].totalProgress / skillStats[skill].totalStudents)
    )
    const completionValues = skills.map(skill => 
      Math.round((skillStats[skill].completedLessons / skillStats[skill].totalLessons) * 100)
    )
    const engagementValues = skills.map(skill => 
      Math.min(100, Math.round((skillStats[skill].totalProgress / skillStats[skill].totalStudents) * 1.2))
    )

    return {
      labels: skills,
      datasets: [
        {
          label: 'Progress %',
          data: progressValues,
          borderColor: 'hsl(145, 60%, 40%)',
          backgroundColor: 'rgba(31, 120, 80, 0.2)',
          borderWidth: 2
        },
        {
          label: 'Completion %',
          data: completionValues,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          borderWidth: 2
        },
        {
          label: 'Engagement %',
          data: engagementValues,
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          borderWidth: 2
        }
      ]
    }
  }

  const preparePerformanceRadarData = () => {
    const performanceMetrics = {
      'Academic Progress': 0,
      'Lesson Completion': 0,
      'Engagement Level': 0,
      'Consistency': 0,
      'Overall Performance': 0
    }

    let totalStudents = progressData.parentProgress.length
    if (totalStudents === 0) return null

    progressData.parentProgress.forEach(parent => {
      performanceMetrics['Academic Progress'] += parent.averageProgress
      performanceMetrics['Lesson Completion'] += (parent.completedLessons / parent.totalLessons) * 100
      performanceMetrics['Engagement Level'] += Math.min(100, parent.averageProgress * 1.1)
      performanceMetrics['Consistency'] += parent.averageProgress > 50 ? 80 : 40
      performanceMetrics['Overall Performance'] += parent.averageProgress
    })

    // Calculate averages
    Object.keys(performanceMetrics).forEach(key => {
      performanceMetrics[key] = Math.round(performanceMetrics[key] / totalStudents)
    })

    return {
      labels: Object.keys(performanceMetrics),
      datasets: [{
        label: 'Performance Metrics',
        data: Object.values(performanceMetrics),
        backgroundColor: 'rgba(31, 120, 80, 0.2)',
        borderColor: 'hsl(145, 60%, 40%)',
        borderWidth: 2,
        pointBackgroundColor: 'hsl(145, 60%, 40%)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'hsl(145, 60%, 40%)'
      }]
    }
  }

  const prepareEngagementPolarData = () => {
    const engagementLevels = {
      'Highly Engaged': 0,
      'Moderately Engaged': 0,
      'Low Engagement': 0,
      'Not Engaged': 0
    }

    progressData.parentProgress.forEach(parent => {
      if (parent.averageProgress >= 80) engagementLevels['Highly Engaged']++
      else if (parent.averageProgress >= 50) engagementLevels['Moderately Engaged']++
      else if (parent.averageProgress > 0) engagementLevels['Low Engagement']++
      else engagementLevels['Not Engaged']++
    })

    return {
      labels: Object.keys(engagementLevels),
      datasets: [{
        data: Object.values(engagementLevels),
        backgroundColor: [
          'rgba(76, 175, 80, 0.6)',
          'rgba(255, 152, 0, 0.6)',
          'rgba(255, 87, 34, 0.6)',
          'rgba(244, 67, 54, 0.6)'
        ],
        borderColor: [
          '#4caf50',
          '#ff9800',
          '#ff5722',
          '#f44336'
        ],
        borderWidth: 2
      }]
    }
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20
        }
      }
    }
  }

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      }
    }
  }

  const skillProgressData = prepareSkillProgressData()
  const performanceRadarData = preparePerformanceRadarData()
  const engagementPolarData = prepareEngagementPolarData()

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: 4, 
        p: 3,
        background: 'linear-gradient(135deg, rgba(31, 120, 80, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
        borderRadius: '16px',
        border: '1px solid rgba(31, 120, 80, 0.2)'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', 
          background: 'linear-gradient(45deg, hsl(152, 65%, 28%), #7b1fa2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1
        , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
          🎯 Advanced Progress Analytics
        </Typography>
        <Typography variant="body1" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#666', maxWidth: '600px', mx: 'auto' }}>
          Deep insights into student performance, engagement patterns, and learning outcomes
        </Typography>
      </Box>

      {/* Key Insights Cards - Top Priority */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        justifyContent: 'center',
        mb: 4
      }}>
        <Card sx={{ 
          flex: '1 1 220px',
          minWidth: '220px',
          maxWidth: '280px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 20px 50px rgba(102, 126, 234, 0.4)'
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <TrendingUp sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              {progressData.summary.averageProgress}%
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Average Progress
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: '1 1 220px',
          minWidth: '220px',
          maxWidth: '280px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 20px 50px rgba(240, 147, 251, 0.4)'
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <School sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              {progressData.summary.totalParents}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Active Students
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: '1 1 220px',
          minWidth: '220px',
          maxWidth: '280px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 20px 50px rgba(79, 172, 254, 0.4)'
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Assessment sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              {progressData.summary.completedLessons}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Lessons Completed
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ 
          flex: '1 1 220px',
          minWidth: '220px',
          maxWidth: '280px',
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 20px 50px rgba(67, 233, 123, 0.4)'
          }
        }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <CheckCircle sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              {Math.round((progressData.summary.completedLessons / progressData.summary.totalLessons) * 100)}%
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Completion Rate
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Advanced Charts Section */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 4, 
        mb: 4,
        justifyContent: 'center'
      }}>
        {/* Performance Radar Chart */}
        {performanceRadarData && (
          <Paper sx={{ 
            flex: '1 1 500px',
            minWidth: '500px',
            p: 4, 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)', 
            backdropFilter: 'blur(20px)', 
            border: '2px solid rgba(31, 120, 80, 0.3)', 
            borderRadius: '20px', 
            boxShadow: '0 12px 40px rgba(31, 120, 80, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 20px 60px rgba(31, 120, 80, 0.3)'
            }
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', 
              color: 'hsl(152, 65%, 28%)', 
              mb: 3,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              🎯 Multi-Dimensional Performance
            </Typography>
            <Box sx={{ height: 400 }}>
              <Radar data={performanceRadarData} options={radarOptions} />
            </Box>
          </Paper>
        )}

        {/* Engagement Polar Chart */}
        {engagementPolarData && (
          <Paper sx={{ 
            flex: '1 1 500px',
            minWidth: '500px',
            p: 4, 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.95) 100%)', 
            backdropFilter: 'blur(20px)', 
            border: '2px solid rgba(255, 152, 0, 0.3)', 
            borderRadius: '20px', 
            boxShadow: '0 12px 40px rgba(255, 152, 0, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 20px 60px rgba(255, 152, 0, 0.3)'
            }
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', 
              color: '#ef6c00', 
              mb: 3,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              🔥 Student Engagement Levels
            </Typography>
            <Box sx={{ height: 400 }}>
              <PolarArea data={engagementPolarData} options={polarOptions} />
            </Box>
          </Paper>
        )}
      </Box>

      {/* Section Performance Analysis - Full Width Showcase */}
      {skillProgressData && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ 
            p: 5, 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)', 
            backdropFilter: 'blur(25px)', 
            border: '3px solid rgba(76, 175, 80, 0.3)', 
            borderRadius: '24px', 
            boxShadow: '0 15px 50px rgba(76, 175, 80, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 25px 70px rgba(76, 175, 80, 0.3)'
            }
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', 
              color: '#2e7d32', 
              mb: 4,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              📊 Comprehensive Section Analysis
            </Typography>
            <Box sx={{ height: 450 }}>
              <Radar data={skillProgressData} options={{
                ...radarOptions,
                plugins: {
                  ...radarOptions.plugins,
                  legend: {
                    ...radarOptions.plugins.legend,
                    position: 'bottom',
                    labels: {
                      ...radarOptions.plugins.legend.labels,
                      padding: 30,
                      font: {
                        size: 14,
                        weight: 'bold'
                      }
                    }
                  }
                }
              }} />
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  )
}

export default ProgressAnalytics

