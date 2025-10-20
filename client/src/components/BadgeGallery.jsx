import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import BadgeDisplay from './BadgeDisplay';
import {
  getAllBadgeDefinitions,
  getUserBadges,
  getUserBadgeStats,
  checkAndAwardBadges,
  groupBadgesByCategory,
  getBadgeCategoryColor
} from '../utils/badgeService';

const BadgeGallery = ({ userId, showCheckButton = true }) => {
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [badgeStats, setBadgeStats] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [newBadgesMessage, setNewBadgesMessage] = useState('');

  useEffect(() => {
    loadBadgeData();
  }, [userId]);

  const loadBadgeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all badge definitions
      const definitionsResult = await getAllBadgeDefinitions();
      if (!definitionsResult.success) {
        throw new Error(definitionsResult.error);
      }

      // Load user's earned badges
      const earnedResult = await getUserBadges(userId);
      if (!earnedResult.success) {
        throw new Error(earnedResult.error);
      }

      // Load badge statistics
      const statsResult = await getUserBadgeStats(userId);
      if (!statsResult.success) {
        throw new Error(statsResult.error);
      }

      setAllBadges(definitionsResult.data);
      setEarnedBadges(earnedResult.data);
      setBadgeStats(statsResult.data);
    } catch (err) {
      console.error('Error loading badge data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckForNewBadges = async () => {
    try {
      setChecking(true);
      setNewBadgesMessage('');

      const result = await checkAndAwardBadges(userId);
      
      if (result.success) {
        const { newlyEarnedBadges, message } = result.data;
        
        if (newlyEarnedBadges && newlyEarnedBadges.length > 0) {
          setNewBadgesMessage(message);
          // Reload badge data to show newly earned badges
          await loadBadgeData();
        } else {
          setNewBadgesMessage(message);
        }
      }
    } catch (err) {
      console.error('Error checking for new badges:', err);
      setError('Failed to check for new badges');
    } finally {
      setChecking(false);
    }
  };

  const handleCategoryChange = (event, newValue) => {
    setSelectedCategory(newValue);
  };

  // Get unique categories
  const categories = ['all', ...new Set(allBadges.map(b => b.category))];

  // Filter badges by category
  const getFilteredBadges = () => {
    if (selectedCategory === 'all') {
      return allBadges;
    }
    return allBadges.filter(b => b.category === selectedCategory);
  };

  const filteredBadges = getFilteredBadges();
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stats Section */}
      {badgeStats && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrophyIcon color="primary" />
              Badge Collection
            </Typography>
            {showCheckButton && (
              <Button
                variant="contained"
                startIcon={checking ? <CircularProgress size={20} /> : <RefreshIcon />}
                onClick={handleCheckForNewBadges}
                disabled={checking}
              >
                {checking ? 'Checking...' : 'Check for New Badges'}
              </Button>
            )}
          </Box>

          {/* New badges message */}
          {newBadgesMessage && (
            <Alert 
              severity={newBadgesMessage.includes('Congratulations') ? 'success' : 'info'} 
              sx={{ mb: 2 }}
              onClose={() => setNewBadgesMessage('')}
            >
              {newBadgesMessage}
            </Alert>
          )}

          {/* Stats Flexbox */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            mb: 2,
            justifyContent: 'space-around'
          }}>
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center' 
            }}>
              <Typography variant="h4" color="primary">
                {badgeStats.totalBadges}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Badges Earned
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center' 
            }}>
              <Typography variant="h4" color="secondary">
                {badgeStats.totalPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Points
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center' 
            }}>
              <Typography variant="h4" color="success.main">
                {badgeStats.completionPercentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Collection Complete
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center' 
            }}>
              <Typography variant="h4" color="warning.main">
                {badgeStats.remainingBadges}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                To Unlock
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Overall Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {badgeStats.totalBadges} / {badgeStats.availableBadges}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={badgeStats.completionPercentage} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          {/* Category Breakdown */}
          {badgeStats.categoryCount && Object.keys(badgeStats.categoryCount).length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(badgeStats.categoryCount).map(([category, count]) => (
                <Chip
                  key={category}
                  label={`${category}: ${count}`}
                  size="small"
                  sx={{
                    backgroundColor: getBadgeCategoryColor(category),
                    color: '#fff',
                    textTransform: 'capitalize'
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Category Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map(category => (
            <Tab
              key={category}
              label={category === 'all' ? 'All Badges' : category}
              value={category}
              sx={{ textTransform: 'capitalize' }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Badge Flexbox */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2,
        justifyContent: 'flex-start'
      }}>
        {filteredBadges.length > 0 ? (
          filteredBadges.map((badge) => (
            <Box key={badge.id} sx={{ 
              flex: '0 1 auto',
              minWidth: 160,
              maxWidth: 200
            }}>
              <BadgeDisplay
                badge={badge}
                earned={earnedBadgeIds.has(badge.id)}
                size="medium"
                showPoints={true}
              />
            </Box>
          ))
        ) : (
          <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No badges found in this category
            </Typography>
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Badge Categories:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.filter(c => c !== 'all').map(category => (
            <Chip
              key={category}
              label={category}
              size="small"
              sx={{
                backgroundColor: getBadgeCategoryColor(category),
                color: '#fff',
                textTransform: 'capitalize'
              }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default BadgeGallery;

