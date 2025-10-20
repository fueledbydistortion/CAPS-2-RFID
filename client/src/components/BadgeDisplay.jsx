import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  Paper
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { getBadgeCategoryColor, getBadgeRarity } from '../utils/badgeService';

const BadgeDisplay = ({ 
  badge, 
  earned = false, 
  showPoints = true, 
  size = 'medium',
  onClick = null
}) => {
  const { rarity, color: rarityColor } = getBadgeRarity(badge.points || 0);
  const categoryColor = getBadgeCategoryColor(badge.category);
  
  // Size configurations
  const sizeConfig = {
    small: {
      cardWidth: 120,
      iconSize: '2rem',
      titleSize: '0.75rem',
      descSize: '0.65rem'
    },
    medium: {
      cardWidth: 160,
      iconSize: '3rem',
      titleSize: '0.9rem',
      descSize: '0.75rem'
    },
    large: {
      cardWidth: 200,
      iconSize: '4rem',
      titleSize: '1.1rem',
      descSize: '0.85rem'
    }
  };
  
  const config = sizeConfig[size];
  
  return (
    <Tooltip 
      title={earned ? badge.description : 'Not yet earned'}
      arrow
      placement="top"
    >
      <Card
        sx={{
          width: config.cardWidth,
          height: 'auto',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          transition: 'all 0.3s ease',
          opacity: earned ? 1 : 0.5,
          background: earned 
            ? `linear-gradient(135deg, ${categoryColor}15 0%, ${rarityColor}15 100%)`
            : '#f5f5f5',
          border: earned ? `2px solid ${categoryColor}` : '2px solid #e0e0e0',
          '&:hover': onClick ? {
            transform: 'translateY(-5px)',
            boxShadow: 6
          } : {}
        }}
        onClick={onClick}
      >
        <CardContent
          sx={{
            textAlign: 'center',
            p: 2,
            pb: '16px !important'
          }}
        >
          {/* Badge Icon */}
          <Box
            sx={{
              fontSize: config.iconSize,
              mb: 1,
              position: 'relative',
              display: 'inline-block'
            }}
          >
            {earned ? (
              <span style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}>
                {badge.icon}
              </span>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: config.iconSize,
                  height: config.iconSize,
                  background: '#e0e0e0',
                  borderRadius: '50%',
                  margin: '0 auto'
                }}
              >
                <LockIcon sx={{ fontSize: '1.5rem', color: '#999' }} />
              </Box>
            )}
          </Box>
          
          {/* Badge Name */}
          <Typography
            variant="h6"
            sx={{
              fontSize: config.titleSize,
              fontWeight: 600,
              mb: 0.5,
              color: earned ? 'text.primary' : 'text.secondary'
            }}
          >
            {badge.name}
          </Typography>
          
          {/* Badge Description */}
          <Typography
            variant="body2"
            sx={{
              fontSize: config.descSize,
              color: earned ? 'text.secondary' : 'text.disabled',
              mb: 1,
              minHeight: '2.5em'
            }}
          >
            {badge.description}
          </Typography>
          
          {/* Badge Metadata */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
            {showPoints && (
              <Chip
                label={`${badge.points} pts`}
                size="small"
                icon={<TrophyIcon />}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: earned ? rarityColor : '#e0e0e0',
                  color: earned ? '#fff' : '#999',
                  '& .MuiChip-icon': {
                    color: earned ? '#fff' : '#999',
                    fontSize: '0.9rem'
                  }
                }}
              />
            )}
            
            {earned && badge.category && (
              <Chip
                label={badge.category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: categoryColor,
                  color: '#fff',
                  textTransform: 'capitalize'
                }}
              />
            )}
          </Box>
          
          {/* Earned Date */}
          {earned && badge.earnedAt && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 1,
                color: 'text.secondary',
                fontSize: '0.65rem'
              }}
            >
              Earned {new Date(badge.earnedAt).toLocaleDateString()}
            </Typography>
          )}
          
          {/* Rarity Badge (for earned badges) */}
          {earned && size !== 'small' && (
            <Paper
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: rarityColor,
                color: '#fff',
                px: 1,
                py: 0.25,
                fontSize: '0.65rem',
                fontWeight: 600,
                borderRadius: '4px'
              }}
            >
              {rarity}
            </Paper>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default BadgeDisplay;

