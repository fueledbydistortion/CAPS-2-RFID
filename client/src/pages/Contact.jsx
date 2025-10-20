import React from 'react'
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent,
  Paper,
  Avatar
} from '@mui/material'
import { 
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon
} from '@mui/icons-material'

function Contact() {
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
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              background: 'linear-gradient(45deg, #001f3f, #003366)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            Contact Us
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: '#001f3f',
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              opacity: 0.9
            }}
          >
            Get in touch with our team for support, inquiries, or partnership opportunities
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.2rem',
              color: '#003366',
              maxWidth: '900px',
              mx: 'auto',
              lineHeight: 1.8,
              opacity: 0.8
            }}
          >
            We're here to help you make the most of Smart Child Care and ensure your childcare center 
            has everything it needs to succeed.
          </Typography>
        </Box>
      </Container>

      {/* Contact Information */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
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
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(0, 31, 63, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '350px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0, 31, 63, 0.3)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(45deg, #001f3f, #003366)',
                  boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
                }}
              >
                <EmailIcon sx={{ fontSize: '2.5rem' }} />
              </Avatar>
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: '#001f3f'
                }}
              >
                Email Us
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#001f3f',
                  mb: 2
                }}
              >
                jansonsalve@gmail.com
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#003366',
                  opacity: 0.8
                }}
              >
                We typically respond within 24 hours
              </Typography>
            </CardContent>
          </Card>
          
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(0, 31, 63, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '350px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0, 31, 63, 0.3)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(45deg, #001f3f, #003366)',
                  boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
                }}
              >
                <PhoneIcon sx={{ fontSize: '2.5rem' }} />
              </Avatar>
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: '#001f3f'
                }}
              >
                Call Us
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#001f3f',
                  mb: 2
                }}
              >
                09270442494
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#003366',
                  opacity: 0.8
                }}
              >
                Monday - Friday, 9:00 AM - 6:00 PM
              </Typography>
            </CardContent>
          </Card>
          
          <Card
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(0, 31, 63, 0.2)',
              borderRadius: '20px',
              flex: 1,
              maxWidth: { xs: '100%', md: '350px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0, 31, 63, 0.3)'
              }
            }}
            data-aos="fade-up"
            data-aos-delay="500"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(45deg, #001f3f, #003366)',
                  boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
                }}
              >
                <LocationIcon sx={{ fontSize: '2.5rem' }} />
              </Avatar>
              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: '#001f3f'
                }}
              >
                Visit Us
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#001f3f',
                  mb: 2
                }}
              >
                Kapitbahayan Daycare Head Teacher
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#003366',
                  opacity: 0.8
                }}
              >
                Bangus St., Kapitbahayan, NBBS Kaunlaran, Navotas City
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Additional Info */}
      <Container maxWidth="lg">
        <Paper
          sx={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '20px',
            p: 6,
            textAlign: 'center'
          }}
          data-aos="fade-up"
          data-aos-delay="600"
        >
          <BusinessIcon
            sx={{
              fontSize: '4rem',
              color: '#001f3f',
              mb: 3,
              filter: 'drop-shadow(2px 2px 4px rgba(0, 31, 63, 0.3))'
            }}
          />
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 600,
              color: '#1565c0',
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            Ready to Get Started?
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#001f3f',
              lineHeight: 1.8,
              fontSize: '1.1rem',
              maxWidth: '800px',
              mx: 'auto',
              mb: 4
            }}
          >
            Whether you're looking to implement SmartChildcare in your center or have questions about 
            our platform, we're here to help you every step of the way.
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: '#003366',
              lineHeight: 1.8,
              fontSize: '1.1rem',
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
            Let's work together to create a better future for childcare management.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default Contact
