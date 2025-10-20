import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AutoAwesome,
  CheckCircle,
  Schedule,
  TrendingUp,
  DataUsage,
  Refresh,
  CloudSync,
  Analytics,
  Assessment
} from '@mui/icons-material';
import { generateDashboardReport } from '../utils/reportingService';

const AutoDataCollection = () => {
  const [collectionStatus, setCollectionStatus] = useState('idle'); // idle, collecting, completed, error
  const [lastCollection, setLastCollection] = useState(null);
  const [collectionStats, setCollectionStats] = useState({
    attendanceRecords: 0,
    progressRecords: 0,
    totalStudents: 0,
    dataQuality: 0
  });
  const [autoCollectionEnabled, setAutoCollectionEnabled] = useState(true);
  const [collectionHistory, setCollectionHistory] = useState([]);

  useEffect(() => {
    // Initialize auto collection
    initializeAutoCollection();
    
    // Set up automatic data collection every hour
    const interval = setInterval(() => {
      if (autoCollectionEnabled) {
        performAutoCollection();
      }
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [autoCollectionEnabled]);

  const initializeAutoCollection = async () => {
    try {
      // Load last collection data
      const lastCollectionData = localStorage.getItem('lastAutoCollection');
      if (lastCollectionData) {
        setLastCollection(JSON.parse(lastCollectionData));
      }

      // Load collection history
      const historyData = localStorage.getItem('collectionHistory');
      if (historyData) {
        setCollectionHistory(JSON.parse(historyData));
      }

      // Perform initial collection
      await performAutoCollection();
    } catch (error) {
      console.error('Failed to initialize auto collection:', error);
    }
  };

  const performAutoCollection = async () => {
    if (collectionStatus === 'collecting') return;

    setCollectionStatus('collecting');
    
    try {
      console.log('🔄 Starting automatic data collection...');
      
      // Simulate data collection process
      const startTime = Date.now();
      
      // Step 1: Collect attendance data
      await new Promise(resolve => setTimeout(resolve, 1000));
      const attendanceRecords = await collectAttendanceData();
      
      // Step 2: Collect progress data
      await new Promise(resolve => setTimeout(resolve, 1000));
      const progressRecords = await collectProgressData();
      
      // Step 3: Generate comprehensive report
      await new Promise(resolve => setTimeout(resolve, 1500));
      const reportData = await generateDashboardReport('day');
      
      // Step 4: Analyze data quality
      const dataQuality = analyzeDataQuality(attendanceRecords, progressRecords);
      
      const endTime = Date.now();
      const collectionDuration = endTime - startTime;
      
      // Update collection stats
      const newStats = {
        attendanceRecords: attendanceRecords.length,
        progressRecords: progressRecords.length,
        totalStudents: reportData.data?.demographics?.totalStudents || 0,
        dataQuality: dataQuality
      };
      
      setCollectionStats(newStats);
      
      // Update last collection time
      const collectionInfo = {
        timestamp: new Date().toISOString(),
        duration: collectionDuration,
        stats: newStats,
        status: 'completed'
      };
      
      setLastCollection(collectionInfo);
      localStorage.setItem('lastAutoCollection', JSON.stringify(collectionInfo));
      
      // Add to collection history
      const newHistory = [
        collectionInfo,
        ...collectionHistory.slice(0, 9) // Keep last 10 entries
      ];
      setCollectionHistory(newHistory);
      localStorage.setItem('collectionHistory', JSON.stringify(newHistory));
      
      console.log('✅ Automatic data collection completed successfully');
      setCollectionStatus('completed');
      
      // Reset status after 3 seconds
      setTimeout(() => setCollectionStatus('idle'), 3000);
      
    } catch (error) {
      console.error('❌ Automatic data collection failed:', error);
      setCollectionStatus('error');
      setTimeout(() => setCollectionStatus('idle'), 5000);
    }
  };

  const collectAttendanceData = async () => {
    // Simulate collecting attendance records
    // In real implementation, this would fetch from Firebase
    return [
      { id: '1', date: '2024-01-15', studentId: 's1', status: 'present' },
      { id: '2', date: '2024-01-15', studentId: 's2', status: 'late' },
      { id: '3', date: '2024-01-15', studentId: 's3', status: 'present' },
      // ... more records
    ];
  };

  const collectProgressData = async () => {
    // Simulate collecting progress records
    // In real implementation, this would fetch from Firebase
    return [
      { id: '1', userId: 's1', lessonId: 'l1', percentage: 100 },
      { id: '2', userId: 's2', lessonId: 'l1', percentage: 75 },
      { id: '3', userId: 's3', lessonId: 'l1', percentage: 50 },
      // ... more records
    ];
  };

  const analyzeDataQuality = (attendanceRecords, progressRecords) => {
    // Simple data quality analysis
    const totalRecords = attendanceRecords.length + progressRecords.length;
    const validRecords = attendanceRecords.filter(r => r.status).length + 
                        progressRecords.filter(r => r.percentage !== undefined).length;
    
    return totalRecords > 0 ? Math.round((validRecords / totalRecords) * 100) : 100;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'collecting': return 'primary';
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'collecting': return <CircularProgress size={20} />;
      case 'completed': return <CheckCircle />;
      case 'error': return <Schedule />;
      default: return <DataUsage />;
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Paper sx={{ p: 3, background: '#ffffff', border: '1px solid #e9ecef' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoAwesome sx={{ color: '#495057', mr: 2, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#495057' }}>
            🤖 Automatic Daily Record Collection
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={autoCollectionEnabled ? 'Enabled' : 'Disabled'}
            variant="outlined"
            size="small"
            sx={{ 
              borderColor: '#6c757d', 
              color: '#6c757d',
              '& .MuiChip-label': { color: '#6c757d' }
            }}
          />
          <IconButton
            onClick={performAutoCollection}
            disabled={collectionStatus === 'collecting'}
            size="small"
          >
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The system automatically collects and analyzes daily records to track each child's growth and activities accurately. 
        This ensures comprehensive data for better decision-making and improved childcare services.
      </Typography>

      {/* Current Status */}
      <Card sx={{ mb: 3, background: '#f8f9fa', border: '1px solid #e9ecef' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#495057' }}>
              Collection Status
            </Typography>
            <Chip
              icon={getStatusIcon(collectionStatus)}
              label={collectionStatus.charAt(0).toUpperCase() + collectionStatus.slice(1)}
              color={getStatusColor(collectionStatus)}
              variant={collectionStatus === 'collecting' ? 'outlined' : 'filled'}
            />
          </Box>
          
          {lastCollection && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  Last Collection
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#495057' }}>
                  {formatTimestamp(lastCollection.timestamp)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  Duration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#495057' }}>
                  {formatDuration(lastCollection.duration)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" sx={{ color: '#6c757d' }}>
                  Data Quality
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#495057' }}>
                  {collectionStats.dataQuality}%
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Collection Statistics */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 3,
        '& > *': {
          flex: '1 1 calc(25% - 12px)',
          minWidth: '200px'
        }
      }}>
        <Card sx={{ textAlign: 'center', p: 2, background: '#ffffff', border: '1px solid #e9ecef' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
            {collectionStats.attendanceRecords}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6c757d' }}>
            Attendance Records
          </Typography>
        </Card>
        
        <Card sx={{ textAlign: 'center', p: 2, background: '#ffffff', border: '1px solid #e9ecef' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
            {collectionStats.progressRecords}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6c757d' }}>
            Progress Records
          </Typography>
        </Card>
        
        <Card sx={{ textAlign: 'center', p: 2, background: '#ffffff', border: '1px solid #e9ecef' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
            {collectionStats.totalStudents}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6c757d' }}>
            Total Students
          </Typography>
        </Card>
        
        <Card sx={{ textAlign: 'center', p: 2, background: '#ffffff', border: '1px solid #e9ecef' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#495057', mb: 1 }}>
            {collectionStats.dataQuality}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#6c757d' }}>
            Data Quality
          </Typography>
        </Card>
      </Box>

      {/* Collection History */}
      {collectionHistory.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', color: '#495057' }}>
            <Analytics sx={{ mr: 1, fontSize: 20, color: '#495057' }} />
            Collection History
          </Typography>
          
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {collectionHistory.map((entry, index) => (
              <ListItem key={index} sx={{ py: 1 }}>
                <ListItemIcon>
                  <Chip
                    icon={<CheckCircle />}
                    label={entry.status}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderColor: '#6c757d', 
                      color: '#6c757d',
                      '& .MuiChip-label': { color: '#6c757d' }
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ color: '#495057' }}>{formatTimestamp(entry.timestamp)}</Typography>}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="caption" sx={{ color: '#6c757d' }}>
                        Duration: {formatDuration(entry.duration)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6c757d' }}>
                        Records: {entry.stats.attendanceRecords + entry.stats.progressRecords}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6c757d' }}>
                        Quality: {entry.stats.dataQuality}%
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Auto Collection Benefits */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Benefits of Automatic Collection:</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          • Real-time data collection and analysis<br/>
          • Automatic trend detection and insights<br/>
          • Improved accuracy in tracking student growth<br/>
          • Reduced manual data entry and errors<br/>
          • Enhanced decision-making capabilities
        </Typography>
      </Alert>
    </Paper>
  );
};

export default AutoDataCollection;
