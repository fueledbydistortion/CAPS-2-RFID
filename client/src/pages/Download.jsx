import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Download as DownloadIcon,
  Android as AndroidIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon
} from '@mui/icons-material'

const Download = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleDownload = () => {
    // In a real app, this would trigger the actual APK download
    // For now, we'll just show an alert
    alert('Download will start shortly!')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%)',
        py: 8,
        px: 2
      }}
    >
      <Box
        sx={{
          maxWidth: '1200px',
          mx: 'auto',
          textAlign: 'center'
        }}
        data-aos="fade-down"
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            mb: 3,
            background: 'linear-gradient(45deg, #1565c0, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Download SmartChildcare
        </Typography>
        
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            opacity: 0.9,
            lineHeight: 1.6
          }}
        >
          Join thousands of parents and educators who trust SmartChildcare 
          for their child development management needs on Android devices.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 6
          }}
        >
          <Card
            sx={{
              maxWidth: 400,
              textAlign: 'center',
              p: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
              border: '2px solid rgba(33, 150, 243, 0.1)'
            }}
            data-aos="zoom-in"
          >
            <CardContent>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(135deg, #2196f3, #42a5f5)',
                  fontSize: '2rem'
                }}
              >
                <AndroidIcon fontSize="large" />
              </Avatar>
              
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Android App
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                Version 1.0.0 • 25.4 MB
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2196f3, #42a5f5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(33, 150, 243, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Download APK
              </Button>
            </CardContent>
          </Card>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 3,
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {[
            {
              icon: <SecurityIcon />,
              title: 'Secure',
              description: 'Your data is protected with enterprise-grade security'
            },
            {
              icon: <SpeedIcon />,
              title: 'Fast',
              description: 'Lightning-fast performance for all your needs'
            },
            {
              icon: <SupportIcon />,
              title: 'Support',
              description: '24/7 customer support whenever you need help'
            }
          ].map((feature, index) => (
            <Card
              key={index}
              sx={{
                flex: '1 1 300px',
                maxWidth: 300,
                textAlign: 'center',
                p: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                border: '2px solid rgba(33, 150, 243, 0.1)'
              }}
              data-aos="fade-up"
              data-aos-delay={200 * (index + 1)}
            >
              <CardContent>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    mx: 'auto',
                    mb: 2,
                    background: 'linear-gradient(135deg, #2196f3, #42a5f5)'
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box
          sx={{
            mt: 6,
            p: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            borderRadius: 3,
            border: '2px solid rgba(33, 150, 243, 0.1)'
          }}
          data-aos="fade-up"
          data-aos-delay="800"
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            System Requirements
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Chip
              label="Android 6.0+"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label="2GB RAM"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label="50MB Storage"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label="Internet Connection"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Download



