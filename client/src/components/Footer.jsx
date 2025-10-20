import React, { useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Link,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material'
import { 
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material'

function Footer() {
  const [privacyDialogOpen, setPrivacyDialogOpen] = useState(false)
  const [termsDialogOpen, setTermsDialogOpen] = useState(false)

  return (
    <>
      {/* Privacy Policy Dialog */}
      <Dialog
        open={privacyDialogOpen}
        onClose={() => setPrivacyDialogOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 600,
          color: '#001f3f',
          borderBottom: '2px solid rgba(0, 31, 63, 0.1)',
          pb: 2
        }}>
          Privacy Policy
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666', fontStyle: 'italic' }}>
            Effective Date: January 2025
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            Welcome to Smart Child Care. We are a team of 4th-year students from STI College Caloocan, and this website is a project created specifically for Kapitbahayan Daycare in Navotas City as part of our academic requirements. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our website.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            1. Information We Collect
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#001f3f', lineHeight: 1.8 }}>
            We may collect the following types of information:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1, color: '#001f3f', lineHeight: 1.6 } }}>
            <li>
              <Typography variant="body2">
                <strong>Personal Data:</strong> Such as names, contact details, and other information voluntarily provided by users related to daycare activities.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Account Information:</strong> If applicable, details like usernames and passwords for accessing the website.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Daycare-Related Information:</strong> Details relevant to the daycare's operations, such as schedules, attendance, and child-related information, only as necessary and with appropriate authorization.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Usage Data:</strong> Information automatically collected, like IP addresses, browser types, and usage patterns.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Cookies:</strong> We may use cookies to improve your experience on our website.
              </Typography>
            </li>
          </Box>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#001f3f', lineHeight: 1.8 }}>
            We use your information solely to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1, color: '#001f3f', lineHeight: 1.6 } }}>
            <li>Provide and improve the services for Kapitbahayan Daycare.</li>
            <li>Manage user accounts (if applicable).</li>
            <li>Ensure the website functions as intended for daycare needs.</li>
            <li>Communicate with users regarding the project.</li>
          </Box>
          <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            We will not use your information for any commercial purposes or share it outside the scope of this academic project.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            3. Sharing Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#001f3f', lineHeight: 1.8 }}>
            Your information may only be shared:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3, '& li': { mb: 1, color: '#001f3f', lineHeight: 1.6 } }}>
            <li>With our academic supervisors or instructors for project evaluation.</li>
            <li>With authorized personnel at Kapitbahayan Daycare.</li>
            <li>If required by law.</li>
          </Box>
          <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            We do not sell or commercially share your personal information.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            4. Data Security
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            We strive to use reasonable measures to protect your data, but as students, our resources are limited. Please use the website with the understanding that absolute security cannot be guaranteed.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            5. Children's Privacy
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            Our website is used by or on behalf of Kapitbahayan Daycare. We do not knowingly collect information directly from children without the consent of their parent or guardian.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            6. Your Rights
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            You may request to review, correct, or delete your personal information by contacting us or the Kapitbahayan Daycare staff.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            7. Changes to This Policy
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            This Privacy Policy may be updated for accuracy or to reflect project changes. The latest version will always be posted here.
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#001f3f', fontWeight: 600 }}>
            8. Contact Us
          </Typography>
          <Typography variant="body2" sx={{ mb: 1, color: '#001f3f', lineHeight: 1.8 }}>
            If you have questions, please contact us at:
          </Typography>
          <Box sx={{ pl: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ color: '#001f3f', mb: 0.5 }}>
              <strong>Email:</strong> cassyyesl@gmail.com
            </Typography>
            <Typography variant="body2" sx={{ color: '#001f3f' }}>
              <strong>Address:</strong> STI College Caloocan
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mt: 3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <Typography variant="body2">
              This is a student project created for educational purposes as part of our academic requirements at STI College Caloocan.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid rgba(0, 31, 63, 0.1)' }}>
          <Button 
            onClick={() => setPrivacyDialogOpen(false)}
            variant="contained"
            sx={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: 'linear-gradient(45deg, #001f3f, #003366)',
              '&:hover': {
                background: 'linear-gradient(45deg, #003366, #001f3f)',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog
        open={termsDialogOpen}
        onClose={() => setTermsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 600,
          color: '#001f3f',
          borderBottom: '2px solid rgba(0, 31, 63, 0.1)',
          pb: 2
        }}>
          Terms of Service
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 3, color: '#001f3f', lineHeight: 1.8 }}>
            By accessing and using the SmartChildcare website, you acknowledge and agree to the following Terms and Conditions:
          </Typography>

          <Box component="ol" sx={{ pl: 2, '& li': { mb: 2, color: '#001f3f', lineHeight: 1.8 } }}>
            <li>
              <Typography variant="body2">
                This website is a student project developed by 4th-year students for the exclusive use of Kapitbahayan Daycare in Navotas City.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                All information you provide will be used solely for daycare management and handled according to our Privacy Policy.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Your data will not be shared or sold outside the project scope, except as required by law or for academic evaluation.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                The website is provided "as is" as a non-commercial, educational project and may have limitations.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                You are responsible for keeping your account credentials secure.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                You agree to use the website only for legitimate daycare activities. Any misuse may result in loss of access.
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                For more information, please read our full{' '}
                <Link
                  component="button"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setTermsDialogOpen(false)
                    setPrivacyDialogOpen(true)
                  }}
                  sx={{
                    color: '#003366',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    font: 'inherit',
                    '&:hover': {
                      color: '#001f3f'
                    }
                  }}
                >
                  Privacy Policy
                </Link>
                .
              </Typography>
            </li>
          </Box>

          <Alert severity="info" sx={{ mt: 3, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              By using this website, you confirm that you have read, understood, and agree to these Terms of Service.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid rgba(0, 31, 63, 0.1)' }}>
          <Button 
            onClick={() => setTermsDialogOpen(false)}
            variant="contained"
            sx={{ 
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: 'linear-gradient(45deg, #001f3f, #003366)',
              '&:hover': {
                background: 'linear-gradient(45deg, #003366, #001f3f)',
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer Content */}
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #061224 0%, #0a1a3a 50%, #1a2b4a 100%)',
        color: 'white',
        py: 6,
        mt: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            mb: 4 
          }}
        >
          {/* Company Info */}
          <Box sx={{ flex: { xs: '1', md: '1.5' } }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                mb: 3,
                background: 'linear-gradient(45deg, #ffffff, hsl(38, 92%, 50%))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Smart Child Care
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#b3d9ff',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Empowering Kapitbahayan Child Development Center with innovative 
              technology solutions for modern childcare management.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box sx={{ flex: { xs: '1', md: '0.8' } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                mb: 3,
                color: '#ffffff'
              }}
            >
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="/"
                sx={{
                  color: '#b3d9ff',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#4facfe',
                    textDecoration: 'underline'
                  },
                  transition: 'color 0.3s ease'
                }}
              >
                Home
              </Link>
              <Link
                href="/about"
                sx={{
                  color: '#b3d9ff',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#4facfe',
                    textDecoration: 'underline'
                  },
                  transition: 'color 0.3s ease'
                }}
              >
                About Us
              </Link>
              <Link
                href="/contact"
                sx={{
                  color: '#b3d9ff',
                  textDecoration: 'none',
                  '&:hover': {
                    color: '#4facfe',
                    textDecoration: 'underline'
                  },
                  transition: 'color 0.3s ease'
                }}
              >
                Contact
              </Link>
            </Box>
          </Box>


          {/* Contact Info */}
          <Box sx={{ flex: { xs: '1', md: '1.2' } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                mb: 3,
                color: '#ffffff'
              }}
            >
              Contact Info
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: '#4facfe', fontSize: '1.2rem' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#b3d9ff',
                    fontSize: '0.9rem'
                  }}
                >
                  roman.claire210@gmail.com / jansonsalve@gmail.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ color: '#4facfe', fontSize: '1.2rem' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#b3d9ff',
                    fontSize: '0.9rem'
                  }}
                >
                  09270442494
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ color: '#4facfe', fontSize: '1.2rem' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#b3d9ff',
                    fontSize: '0.9rem'
                  }}
                >
                  Navotas City, Metro Manila, PH 1485
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />

        {/* Bottom Footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#80b3ff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              opacity: 0.8
            }}
          >
            © 2025 Smart Child Care. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link
              component="button"
              onClick={() => setPrivacyDialogOpen(true)}
              sx={{
                color: '#80b3ff',
                textDecoration: 'none',
                fontSize: '0.9rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                '&:hover': {
                  color: '#4facfe'
                },
                transition: 'color 0.3s ease'
              }}
            >
              Privacy Policy
            </Link>
            <Link
              component="button"
              onClick={() => setTermsDialogOpen(true)}
              sx={{
                color: '#80b3ff',
                textDecoration: 'none',
                fontSize: '0.9rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                '&:hover': {
                  color: '#4facfe'
                },
                transition: 'color 0.3s ease'
              }}
            >
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
    </>
  )
}

export default Footer
