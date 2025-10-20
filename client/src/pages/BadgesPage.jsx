import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tab,
  Tabs,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Leaderboard as LeaderboardIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import BadgeGallery from '../components/BadgeGallery';
import {
  getLeaderboard,
  getUserRank,
  getUserBadgeStats
} from '../utils/badgeService';

const BadgesPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [selectedTab, setSelectedTab] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [badgeStats, setBadgeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is a parent
  if (userProfile && userProfile.role !== 'parent') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1">
            The Badges system is only available for parent/student accounts. This feature helps parents and students track their learning achievements and progress.
          </Typography>
        </Alert>
      </Container>
    );
  }

  useEffect(() => {
    loadBadgeData();
  }, [currentUser]);

  const loadBadgeData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Load user's badge stats
      const statsResult = await getUserBadgeStats(currentUser.uid);
      if (statsResult.success) {
        setBadgeStats(statsResult.data);
      }

      // Load leaderboard
      const leaderboardResult = await getLeaderboard(50);
      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.data);
      }

      // Load user's rank
      const rankResult = await getUserRank(currentUser.uid);
      if (rankResult.success) {
        setUserRank(rankResult.data);
      }
    } catch (err) {
      console.error('Error loading badge data:', err);
      setError('Failed to load badge data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
            background: 'linear-gradient(45deg, #FF6B6B, #FFD93D, #6BCF7F)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          🏆 Badges & Achievements
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track your progress and compete with others
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* User Stats Card */}
      {badgeStats && userRank && (
        <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, hsl(152, 65%, 28%) 0%, hsl(145, 60%, 40%) 100%)' }}>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3,
            justifyContent: 'space-around'
          }}>
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center', 
              color: 'white' 
            }}>
              <TrophyIcon sx={{ fontSize: 48, mb: 1, color: 'white' }} />
              <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'white' }}>
                {badgeStats.totalBadges}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Badges Earned
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center', 
              color: 'white' 
            }}>
              <StarIcon sx={{ fontSize: 48, mb: 1, color: 'white' }} />
              <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'white' }}>
                {badgeStats.totalPoints}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Total Points
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center', 
              color: 'white' 
            }}>
              <LeaderboardIcon sx={{ fontSize: 48, mb: 1, color: 'white' }} />
              <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'white' }}>
                {getRankEmoji(userRank.rank)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Your Rank
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: '1 1 150px',
              minWidth: 150,
              textAlign: 'center', 
              color: 'white' 
            }}>
              <TrendingUpIcon sx={{ fontSize: 48, mb: 1, color: 'white' }} />
              <Typography variant="h4" sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, color: 'white' }}>
                {userRank.percentile}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Top Percentile
              </Typography>
            </Box>
          </Box>
          
          {/* Progress Bar */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                Collection Progress
              </Typography>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {badgeStats.completionPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={badgeStats.completionPercentage}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'rgba(255,255,255,0.8)'
                }
              }}
            />
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          centered
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              minHeight: 64
            }
          }}
        >
          <Tab label="My Badges" icon={<TrophyIcon />} />
          <Tab label="Leaderboard" icon={<LeaderboardIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Box>
          {currentUser && (
            <BadgeGallery userId={currentUser.uid} showCheckButton={true} />
          )}
        </Box>
      )}

      {selectedTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LeaderboardIcon color="primary" />
            Top Students
          </Typography>

          {leaderboard.length > 0 ? (
            <List>
              {leaderboard.map((entry, index) => (
                <React.Fragment key={entry.userId}>
                  <ListItem
                    sx={{
                      py: 2,
                      backgroundColor: entry.userId === currentUser?.uid ? 'rgba(31, 120, 80, 0.1)' : 'transparent',
                      borderRadius: 2,
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          fontSize: '1.5rem',
                          background: entry.rank <= 3
                            ? 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      >
                        {getRankEmoji(entry.rank)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {entry.name}
                          </Typography>
                          {entry.userId === currentUser?.uid && (
                            <Chip label="You" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            <StarIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
                            {entry.badgePoints} points
                          </Typography>
                        </Box>
                      }
                    />
                    {entry.rank <= 3 && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '2rem'
                        }}
                      >
                        {entry.rank === 1 && '👑'}
                        {entry.rank === 2 && '🌟'}
                        {entry.rank === 3 && '⭐'}
                      </Box>
                    )}
                  </ListItem>
                  {index < leaderboard.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No leaderboard data available yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Start earning badges to appear on the leaderboard!
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default BadgesPage;


