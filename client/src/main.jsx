import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import AOS from 'aos'
import 'aos/dist/aos.css'

import App from './App.jsx'

// Initialize AOS
AOS.init({
  duration: 1000,
  easing: 'ease-in-out',
  once: true,
  offset: 100
})

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: 'hsl(152, 65%, 28%)', // Forest green from logo
      light: 'hsl(152, 65%, 45%)',
      dark: 'hsl(152, 65%, 20%)',
    },
    secondary: {
      main: 'hsl(220, 60%, 25%)', // Navy blue from logo
      light: 'hsl(220, 60%, 40%)',
      dark: 'hsl(220, 60%, 15%)',
    },
    background: {
      default: '#f0f8ff', // Alice blue
      paper: '#ffffff',
    },
    text: {
      primary: 'hsl(220, 60%, 25%)', // Navy blue from logo
      secondary: 'hsl(220, 60%, 40%)', // Lighter navy blue
    },
    success: {
      main: '#4caf50', // Green
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800', // Orange
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336', // Red
      light: '#e57373',
      dark: '#d32f2f',
    },
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    h1: { 
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 700,
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '2.5rem'
    },
    h2: { 
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '2rem'
    },
    h3: { 
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '1.75rem'
    },
    h4: { 
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '1.5rem'
    },
    h5: { 
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '1.25rem'
    },
    h6: { 
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600,
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '1.1rem'
    },
    body1: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: 'hsl(220, 60%, 25%)', // Navy blue from logo
      fontSize: '1rem'
    },
    body2: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: 'hsl(220, 60%, 40%)', // Lighter navy blue
      fontSize: '0.875rem'
    },
    button: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontWeight: 600
    },
    caption: {
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    },
    overline: {
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }
  },
  components: {
    MuiButton: { 
      styleOverrides: { 
        root: { 
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          textTransform: 'none', 
          borderRadius: '25px',
          fontWeight: 600,
          fontSize: '1rem'
        }, 
      }, 
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        head: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 600
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }
      }
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 600
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 700
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }
      }
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }
      }
    },
    MuiCard: { 
      styleOverrides: { 
        root: { 
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
          border: '2px solid rgba(33, 150, 243, 0.1)'
        }, 
      }, 
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
          border: '2px solid rgba(33, 150, 243, 0.1)'
        }
      }
    }
  },
  shape: {
    borderRadius: 16
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
