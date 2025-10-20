import React from 'react'
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent,
  Avatar,
  Paper
} from '@mui/material'
import { 
  School as SchoolIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon
} from '@mui/icons-material'

function About() {
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
              fontWeight: 800,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              mb: 3,
              background: 'linear-gradient(45deg, #001f3f, #003366)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            About Smart Child Care
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
            Empowering Kapitbahayan Child Development Center with innovative technology solutions
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
            We are dedicated to revolutionizing childcare management through our comprehensive web-based platform, 
            designed specifically to meet the unique needs of early childhood development centers.
          </Typography>
        </Box>
      </Container>

      {/* Mission & Vision Section */}
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
              maxWidth: { xs: '100%', md: '500px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0, 31, 63, 0.3)'
              }
            }}
            data-aos="fade-right"
            data-aos-delay="300"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <SchoolIcon
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
                  color: '#001f3f'
                }}
              >
                Our Mission
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#003366',
                  lineHeight: 1.8,
                  fontSize: '1.1rem'
                }}
              >
                Our mission is to develop a reliable and easy-to-use childcare management system that helps improve coordination among teachers, parents, and administrators.
                <br /><br />
                Smart Child Care aims to simplify daily tasks such as attendance tracking, scheduling, and communication, allowing childcare providers to focus more on the children's growth and well-being.
                <br /><br />
                Through this system, we seek to make childcare management more organized, efficient, and accessible.
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
              maxWidth: { xs: '100%', md: '500px' },
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 40px rgba(0, 31, 63, 0.3)'
              }
            }}
            data-aos="fade-left"
            data-aos-delay="400"
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <TrendingUpIcon
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
                  color: '#001f3f'
                }}
              >
                Our Vision
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#003366',
                  lineHeight: 1.8,
                  fontSize: '1.1rem'
                }}
              >
                Our vision is for Smart Child Care to serve as a practical and innovative tool that supports childcare centers in providing better care and education.
                <br /><br />
                We aspire to promote a connected and nurturing environment where technology helps educators and parents work together for every child's development and success.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Values Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h2"
          sx={{
            textAlign: 'center',
            mb: 6,
            fontWeight: 600,
            color: '#1565c0',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)'
          }}
          data-aos="fade-up"
          data-aos-delay="500"
        >
          Our Core Values
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'center',
            alignItems: 'stretch'
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' },
              maxWidth: { xs: '100%', sm: '300px', md: '250px' }
            }}
            data-aos="zoom-in"
            data-aos-delay="600"
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(45deg, #001f3f, #003366)',
                boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
              }}
            >
              <SecurityIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: '#1565c0'
              }}
            >
              Security
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#1976d2',
                opacity: 0.9
              }}
            >
              Protecting sensitive information with enterprise-grade security measures
            </Typography>
          </Box>
          
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' },
              maxWidth: { xs: '100%', sm: '300px', md: '250px' }
            }}
            data-aos="zoom-in"
            data-aos-delay="700"
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(45deg, #001f3f, #003366)',
                boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
              }}
            >
              <GroupIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: '#1565c0'
              }}
            >
              Growth
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#1976d2',
                opacity: 0.9
              }}
            >
              Supporting continuous learning and development for all
            </Typography>
          </Box>
          
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' },
              maxWidth: { xs: '100%', sm: '300px', md: '250px' }
            }}
            data-aos="zoom-in"
            data-aos-delay="800"
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(45deg, #001f3f, #003366)',
                boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
              }}
            >
              <SchoolIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: '#1565c0'
              }}
            >
              Excellence
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#1976d2',
                opacity: 0.9
              }}
            >
              Committed to delivering the highest quality solutions and support
            </Typography>
          </Box>
          
          <Box
            sx={{
              textAlign: 'center',
              p: 3,
              flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 24px)' },
              maxWidth: { xs: '100%', sm: '300px', md: '250px' }
            }}
            data-aos="zoom-in"
            data-aos-delay="900"
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                background: 'linear-gradient(45deg, #001f3f, #003366)',
                boxShadow: '0 4px 20px rgba(0, 31, 63, 0.4)'
              }}
            >
              <TrendingUpIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: '#1565c0'
              }}
            >
              Innovation
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#1976d2',
                opacity: 0.9
              }}
            >
              Continuously evolving our platform with cutting-edge technology
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default About
