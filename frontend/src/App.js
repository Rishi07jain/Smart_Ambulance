import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Button, Typography, Container, CssBaseline, Box } from '@mui/material';
import EmergencyPage from './pages/EmergencyPage';
import HospitalSearchPage from './pages/HospitalSearchPage';

// Create custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#e91e63',
    },
    secondary: {
      main: '#03a9f4',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 1, 
                  color: 'primary.main',
                  fontWeight: 'bold'
                }}
              >
                Ambulance Vibe
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  color="primary" 
                  component={Link} 
                  to="/"
                >
                  Emergency
                </Button>
                <Button 
                  color="secondary" 
                  component={Link} 
                  to="/hospitals"
                >
                  Find Hospitals
                </Button>
              </Box>
            </Toolbar>
          </AppBar>
          
          <Container component="main" sx={{ flexGrow: 1, py: 2 }}>
            <Routes>
              <Route path="/" element={<EmergencyPage />} />
              <Route path="/hospitals" element={<HospitalSearchPage />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 