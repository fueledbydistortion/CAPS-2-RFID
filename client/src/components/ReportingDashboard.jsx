import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  ListItemButton
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  People,
  School,
  Refresh,
  Download,
  FilterList,
  Insights,
  Lightbulb,
  Timeline,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import {
  generateAttendanceReport,
  generateProgressReport,
  generateDashboardReport,
  analyzeAttendanceTrends,
  analyzeProgressTrends,
  generateInsights,
  generateRecommendations,
  formatDataForCharts
} from '../utils/reportingService';
import { getAllUsers } from '../utils/userService';
import { handleExportReport } from '../utils/exportService';

const ReportingDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [period, setPeriod] = useState('week');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sectionId: '',
    studentId: ''
  });
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (reportData) {
      const newInsights = generateInsights(reportData.attendance, reportData.progress);
      const newRecommendations = generateRecommendations(newInsights, reportData.attendance, reportData.progress);
      setInsights(newInsights);
      setRecommendations(newRecommendations);
    }
  }, [reportData]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load users for filters
      const usersResult = await getAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }
      
      // Load all initial reports
      await loadAllReports();
    } catch (error) {
      setError('Failed to load initial data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllReports = async () => {
    setLoading(true);
    try {
      // Load dashboard report
      const dashboardResult = await generateDashboardReport(period);
      if (dashboardResult.success) {
        setReportData(dashboardResult.data);
        setError(null);
      }

      // Load attendance report
      const attendanceResult = await generateAttendanceReport(filters);
      if (attendanceResult.success) {
        setReportData(prev => ({
          ...prev,
          attendance: attendanceResult.data
        }));
      }

      // Load progress report
      const progressResult = await generateProgressReport(filters);
      if (progressResult.success) {
        setReportData(prev => ({
          ...prev,
          progress: progressResult.data
        }));
      }
    } catch (error) {
      setError('Failed to load reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardReport = async () => {
    setLoading(true);
    try {
      const result = await generateDashboardReport(period);
      if (result.success) {
        setReportData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load dashboard report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceReport = async () => {
    setLoading(true);
    try {
      const result = await generateAttendanceReport(filters);
      if (result.success) {
        setReportData(prev => ({
          ...prev,
          attendance: result.data
        }));
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load attendance report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProgressReport = async () => {
    setLoading(true);
    try {
      const result = await generateProgressReport(filters);
      if (result.success) {
        setReportData(prev => ({
          ...prev,
          progress: result.data
        }));
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load progress report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    loadAllReports();
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = (format) => {
    handleExportClose();
    const result = handleExportReport(reportData, period, insights, recommendations, format);
    if (result.success) {
      setExportSuccess(result.message);
      setTimeout(() => setExportSuccess(null), 3000);
    } else {
      setError(result.error);
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'excellent': return <CheckCircle color="success" />;
      case 'good': return <TrendingUp color="primary" />;
      case 'concern': return <Warning color="warning" />;
      default: return <Assessment />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'concern': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (loading && !reportData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>Loading comprehensive reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'hsl(152, 65%, 28%)', mb: 1 , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
            📊 Comprehensive Reporting Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Detailed insights on student attendance and developmental progress with data analysis
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => handlePeriodChange(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton onClick={loadAllReports} disabled={loading}>
            <Refresh />
          </IconButton>
          
          <Button
            variant="contained"
            startIcon={<Download />}
            disabled={!reportData}
            onClick={handleExportClick}
          >
            Export Report
          </Button>

          {/* Export Menu */}
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => handleExport('excel')}>
              <ListItemIcon>
                <TableChart fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export to Excel</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>
              <ListItemIcon>
                <PictureAsPdf fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export to PDF</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleExport('both')}>
              <ListItemIcon>
                <Download fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export Both Formats</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {exportSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Overview */}
      {reportData && (
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 3, 
          mb: 4,
          '& > *': {
            flex: '1 1 calc(25% - 18px)',
            minWidth: '250px'
          }
        }}>
          <Card sx={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1, color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.attendance?.attendanceRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                    Attendance Rate
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: '#6c757d', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1, color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.progress?.completionRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                    Completion Rate
                  </Typography>
                </Box>
                <School sx={{ fontSize: 40, color: '#6c757d', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1, color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.demographics?.totalStudents || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                    Total Students
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: '#6c757d', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1, color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.demographics?.totalTeachers || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                    Total Teachers
                  </Typography>
                </Box>
                <School sx={{ fontSize: 40, color: '#6c757d', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Insights Section */}
      {insights.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, background: '#ffffff', border: '1px solid #e9ecef' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Insights sx={{ color: '#495057', mr: 2, fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              Key Insights & Analysis
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2,
            '& > *': {
              flex: '1 1 calc(50% - 8px)',
              minWidth: '300px'
            }
          }}>
            {insights.map((insight, index) => (
              <Card key={index} sx={{ 
                border: '1px solid #e9ecef',
                background: '#f8f9fa'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getInsightIcon(insight.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1, color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                        {insight.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                        {insight.message}
                      </Typography>
                    </Box>
                    <Chip
                      label={insight.priority}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        ml: 1, 
                        borderColor: '#6c757d', 
                        color: '#6c757d',
                        '& .MuiChip-label': { color: '#6c757d' }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, background: '#ffffff', border: '1px solid #e9ecef' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Lightbulb sx={{ color: '#495057', mr: 2, fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              Actionable Recommendations
            </Typography>
          </Box>
          
          <List>
            {recommendations.map((rec, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ alignItems: 'flex-start', py: 2 }}>
                  <ListItemIcon sx={{ mt: 1 }}>
                    <Tooltip title={`Priority: ${rec.priority}`}>
                      <Chip
                        label={rec.priority}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: '#6c757d', 
                          color: '#6c757d',
                          '& .MuiChip-label': { color: '#6c757d' }
                        }}
                      />
                    </Tooltip>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', mb: 1, color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                        {rec.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                          <strong>Action:</strong> {rec.action}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                          <strong>Description:</strong> {rec.description}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                          <strong>Timeline:</strong> {rec.timeline}
                        </Typography>
                        {rec.resources && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' }}>
                              Resources Needed:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {rec.resources.map((resource, idx) => (
                                <Chip
                                  key={idx}
                                  label={resource}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    borderColor: '#6c757d', 
                                    color: '#6c757d',
                                    '& .MuiChip-label': { color: '#6c757d' }
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < recommendations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Detailed Reports Section */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        '& > *': {
          flex: '1 1 calc(50% - 12px)',
          minWidth: '400px'
        }
      }}>
        <Paper sx={{ p: 3, height: '100%', background: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              📈 Attendance Analysis
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterList />}
              onClick={loadAttendanceReport}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          
          {reportData?.attendance ? (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                '& > *': {
                  flex: '1 1 33.333%'
                }
              }}>
                <Box sx={{ textAlign: 'center', p: 2, background: '#ffffff', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.attendance.summary?.presentCount || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                    Present
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, background: '#ffffff', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.attendance.summary?.lateCount || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                    Late
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, background: '#ffffff', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.attendance.summary?.absentCount || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                    Absent
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                Total Records: {reportData.attendance.summary?.totalRecords || 0}
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary">No attendance data available</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3, height: '100%', background: '#f8f9fa', border: '1px solid #e9ecef' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
              🎯 Progress Analysis
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterList />}
              onClick={loadProgressReport}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          
          {reportData?.progress ? (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                '& > *': {
                  flex: '1 1 50%'
                }
              }}>
                <Box sx={{ textAlign: 'center', p: 2, background: '#ffffff', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.progress.summary?.completedLessons || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                    Completed
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 2, background: '#ffffff', borderRadius: 2, border: '1px solid #e9ecef' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#495057' , fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700}}>
                    {reportData.progress.summary?.averageProgress || 0}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                    Avg Progress
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#6c757d' }}>
                Total Lessons: {reportData.progress.summary?.totalLessons || 0}
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary">No progress data available</Typography>
          )}
        </Paper>
      </Box>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6">Generating comprehensive reports...</Typography>
            <Typography variant="body2" color="text.secondary">
              Analyzing attendance and progress data
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ReportingDashboard;

