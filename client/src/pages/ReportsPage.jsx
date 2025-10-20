import React from 'react';
import { Box, Divider } from '@mui/material';
import ReportingDashboard from '../components/ReportingDashboard';
import AutoDataCollection from '../components/AutoDataCollection';
import StudentProgressOverview from '../components/StudentProgressOverview';

const ReportsPage = () => {
  return (
    <Box>
      {/* Student Progress Overview Section - Charts & Analytics */}
      <Box sx={{ mb: 4 }}>
        <StudentProgressOverview />
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 4 }} />

      {/* Comprehensive Reporting Dashboard Section */}
      <Box sx={{ mb: 4 }}>
        <ReportingDashboard />
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 4 }} />

      {/* Automatic Daily Record Collection Section */}
      <Box>
        <AutoDataCollection />
      </Box>
    </Box>
  );
};

export default ReportsPage;

