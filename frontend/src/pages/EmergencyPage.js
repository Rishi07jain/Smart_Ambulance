import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Container,
  Typography,
  Paper,
  Box,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Divider,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyMap from '../components/EmergencyMap';
import EmergencyDetails from '../components/EmergencyDetails';
import { getEmergencies, getNearbyHospitals } from '../services/api';

const EmergencyPage = () => {
  const [emergencyId, setEmergencyId] = useState(null);
  const [patientLocation, setPatientLocation] = useState(undefined);
  const [emergency, setEmergency] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Request user's location on page load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPatientLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError('Unable to get your location. Some features may be limited.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Some features may be limited.');
    }
  }, []);
  
  // Handler for when emergency is created
  const handleEmergencyCreated = (id) => {
    setEmergencyId(id);
  };
  
  // Fetch emergency details when ID changes
  useEffect(() => {
    if (!emergencyId) return;
    
    const fetchEmergencyDetails = async () => {
      try {
        const response = await getEmergencies();
        const emergencies = response.data;
        
        const found = emergencies.find((e) => e.id === emergencyId);
        if (found) {
          setEmergency(found);
          setPatientLocation({
            lat: found.patient_latitude,
            lng: found.patient_longitude
          });
          
          // Pre-fetch nearby hospitals based on patient location
          if (patientLocation) {
            try {
              await getNearbyHospitals(patientLocation.lat, patientLocation.lng);
            } catch (err) {
              console.error('Error fetching nearby hospitals:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching emergency details:', err);
      }
    };
    
    fetchEmergencyDetails();
    
    // Poll for updates
    const interval = setInterval(fetchEmergencyDetails, 5000);
    return () => clearInterval(interval);
  }, [emergencyId, patientLocation]);
  
  // Animation variants for components
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Box component="span" sx={{ color: 'error.main' }}>Smart</Box> Ambulance System
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {locationError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {locationError}
          </Alert>
        )}
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', mb: 4, borderRadius: 2 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Emergency Medical Assistance
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
                Press the emergency button to request immediate medical assistance.
                Our system will locate the nearest available ambulance and hospital.
              </Typography>
              
              {patientLocation && (
                <Card sx={{ maxWidth: 300, mx: 'auto', mt: 2, mb: 3, bgcolor: '#f8f8f8' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      Your Current Location
                    </Typography>
                    <Typography variant="body2">
                      Lat: {patientLocation.lat.toFixed(6)}<br />
                      Lng: {patientLocation.lng.toFixed(6)}
                    </Typography>
                  </CardContent>
                </Card>
              )}
              
              <EmergencyButton onEmergencyCreated={handleEmergencyCreated} />
            </Paper>
          </motion.div>
          
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
            <motion.div variants={itemVariants} style={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', px: 1 }}>
                Real-time Location
              </Typography>
              <EmergencyMap 
                patientLocation={patientLocation}
                selectedAmbulance={emergency?.ambulance_details || undefined}
                selectedHospital={emergency?.hospital_details || undefined}
              />
            </motion.div>
            
            {isMobile && <Divider sx={{ my: 3 }} />}
            
            <motion.div variants={itemVariants} style={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', px: 1 }}>
                Emergency Status
              </Typography>
              <EmergencyDetails emergencyId={emergencyId} />
            </motion.div>
          </Box>
        </motion.div>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 4, bgcolor: '#fff', borderTop: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Smart Ambulance System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default EmergencyPage; 