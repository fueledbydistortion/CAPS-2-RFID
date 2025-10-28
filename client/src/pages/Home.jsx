import React from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Card, 
  CardContent
} from '@mui/material'
import { 
  QrCode,
  ChildCare,
  Analytics,
  Security
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    // Navigate to the login page (signup removed)
    navigate('/login')
  }
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(210, 20%, 98%) 0%, hsl(152, 50%, 95%) 50%, hsl(145, 45%, 90%) 100%)',
        color: 'white',
        py: 4
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
            py: 6
          }}
          data-aos="fade-down"
          data-aos-delay="200"
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 800,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              mb: 3,
              background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Smart Child Care
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              color: 'hsl(220, 60%, 25%)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 600,
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.4,
              opacity: 0.9
            }}
          >
            Web-based Management System for Kapitbahayan Child Development Center with RFID
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: 'hsl(152, 65%, 28%)',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 500,
              mb: 6,
              maxWidth: '900px',
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0.85
            }}
          >
            Streamline your childcare operations with our comprehensive digital platform designed 
            to enhance efficiency, security, and communication.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{
              background: 'linear-gradient(45deg, hsl(152, 65%, 28%), hsl(145, 60%, 40%))',
              color: 'white',
              px: 4,
              py: 2,
              fontSize: '1.2rem',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700,
              borderRadius: '30px',
              boxShadow: '0 8px 25px rgba(31, 120, 80, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(45deg, hsl(145, 60%, 40%), hsl(152, 65%, 28%))',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 35px rgba(31, 120, 80, 0.6)'
              }
            }}
          >
            Get Started Today
          </Button>
        </Box>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            mb: 6,
            fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            color: 'hsl(152, 65%, 28%)',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)'
          }}
          data-aos="fade-up"
          data-aos-delay="300"
        >
          Why Choose Smart Child Care?
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            justifyContent: 'center',
            alignItems: 'stretch'
          }}
        >
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(31, 120, 80, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '300px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(31, 120, 80, 0.3)',
                borderColor: 'hsl(38, 92%, 50%)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <QrCode
                sx={{
                  fontSize: '4rem',
                  color: 'hsl(152, 65%, 28%)',
                  mb: 3,
                  filter: 'drop-shadow(2px 2px 4px rgba(31, 120, 80, 0.3))'
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: 'hsl(152, 65%, 28%)'
                }}
              >
                QR Code Integration
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'hsl(220, 60%, 25%)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  lineHeight: 1.6
                }}
              >
                Quick and secure check-ins with QR code technology for parents and staff
              </Typography>
            </CardContent>
          </Card>
          
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(31, 120, 80, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '300px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(31, 120, 80, 0.3)',
                borderColor: 'hsl(38, 92%, 50%)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="500"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ChildCare
                sx={{
                  fontSize: '4rem',
                  color: 'hsl(152, 65%, 28%)',
                  mb: 3,
                  filter: 'drop-shadow(2px 2px 4px rgba(31, 120, 80, 0.3))'
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: 'hsl(152, 65%, 28%)'
                }}
              >
                Child Development Tracking
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'hsl(220, 60%, 25%)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  lineHeight: 1.6
                }}
              >
                Monitor progress and milestones with comprehensive development assessments
              </Typography>
            </CardContent>
          </Card>
          
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(31, 120, 80, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '300px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(31, 120, 80, 0.3)',
                borderColor: 'hsl(38, 92%, 50%)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="600"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Analytics
                sx={{
                  fontSize: '4rem',
                  color: 'hsl(152, 65%, 28%)',
                  mb: 3,
                  filter: 'drop-shadow(2px 2px 4px rgba(31, 120, 80, 0.3))'
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: 'hsl(152, 65%, 28%)'
                }}
              >
                Advanced Analytics
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'hsl(220, 60%, 25%)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  lineHeight: 1.6
                }}
              >
                Data-driven insights to improve operations and child outcomes
              </Typography>
            </CardContent>
          </Card>
          
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(31, 120, 80, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '300px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(31, 120, 80, 0.3)',
                borderColor: 'hsl(38, 92%, 50%)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="700"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Security
                sx={{
                  fontSize: '4rem',
                  color: 'hsl(152, 65%, 28%)',
                  mb: 3,
                  filter: 'drop-shadow(2px 2px 4px rgba(31, 120, 80, 0.3))'
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: 'hsl(152, 65%, 28%)'
                }}
              >
                Enterprise Security
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'hsl(220, 60%, 25%)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  lineHeight: 1.6
                }}
              >
                Bank-level security to protect sensitive child and family information
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}

export default Home
