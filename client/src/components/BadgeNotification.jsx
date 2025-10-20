import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  IconButton,
  Slide,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { getBadgeCategoryColor, getBadgeRarity } from '../utils/badgeService';

const SlideTransition = (props) => {
  return <Slide {...props} direction="down" />;
};

const BadgeNotification = ({ badge, open, onClose, autoHideDuration = 6000 }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!badge) {
    return null;
  }

  const categoryColor = getBadgeCategoryColor(badge.category);
  const { rarity, color: rarityColor } = getBadgeRarity(badge.points || 0);

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      sx={{ mt: 8 }}
    >
      <Paper
        elevation={8}
        sx={{
          minWidth: 320,
          maxWidth: 400,
          background: `linear-gradient(135deg, ${categoryColor}20 0%, ${rarityColor}20 100%)`,
          border: `2px solid ${categoryColor}`,
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${categoryColor} 0%, ${rarityColor} 100%)`,
            color: '#fff',
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrophyIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Badge Unlocked!
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ color: '#fff' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}
          >
            {/* Badge Icon */}
            <Box
              sx={{
                fontSize: '3rem',
                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
                animation: 'bounce 1s ease-in-out'
              }}
            >
              {badge.icon}
            </Box>

            {/* Badge Info */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {badge.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {badge.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: rarityColor,
                    color: '#fff',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontWeight: 600
                  }}
                >
                  {rarity}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: categoryColor }}>
                  +{badge.points} points
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <style>
          {`
            @keyframes bounce {
              0%, 100% {
                transform: translateY(0) scale(1);
              }
              25% {
                transform: translateY(-10px) scale(1.1);
              }
              50% {
                transform: translateY(0) scale(1);
              }
              75% {
                transform: translateY(-5px) scale(1.05);
              }
            }
          `}
        </style>
      </Paper>
    </Snackbar>
  );
};

// Component to show multiple badge notifications
export const BadgeNotificationQueue = ({ badges, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (badges && badges.length > 0) {
      setCurrentIndex(0);
      setIsOpen(true);
    }
  }, [badges]);

  const handleClose = () => {
    setIsOpen(false);
    
    // Show next badge after a delay
    setTimeout(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsOpen(true);
      } else {
        // All badges shown
        if (onClose) {
          onClose();
        }
      }
    }, 300);
  };

  if (!badges || badges.length === 0) {
    return null;
  }

  const currentBadge = badges[currentIndex];

  return (
    <>
      <BadgeNotification
        badge={currentBadge}
        open={isOpen}
        onClose={handleClose}
        autoHideDuration={5000}
      />
      
      {/* Progress indicator for multiple badges */}
      {badges.length > 1 && isOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 220,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.75rem'
          }}
        >
          {currentIndex + 1} / {badges.length}
        </Box>
      )}
    </>
  );
};

export default BadgeNotification;

