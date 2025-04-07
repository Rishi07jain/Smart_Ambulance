import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getEmergencies } from '../services/api';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  CircularProgress,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';

const EmergencyDetails = ({ emergencyId }) => {
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!emergencyId) return;
    
    const fetchEmergencyDetails = async () => {
      try {
        setLoading(true);
        const response = await getEmergencies();
        const emergencies = response.data;
        
        const found = emergencies.find((e) => e.id === emergencyId);
        if (found) {
          setEmergency(found);
          setError(null);
        } else {
          setError(`Emergency with ID ${emergencyId} not found`);
        }
      } catch (err) {
        console.error('Error fetching emergency details:', err);
        setError('Failed to fetch emergency details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmergencyDetails();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchEmergencyDetails, 5000);
    return () => clearInterval(interval);
  }, [emergencyId]);
  
  if (!emergencyId) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="body1" textAlign="center" color="text.secondary">
          No emergency request has been initiated
        </Typography>
      </Paper>
    );
  }
  
  if (loading && !emergency) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: '#fff8f8' }}>
        <Typography variant="body1" color="error" textAlign="center">
          {error}
        </Typography>
      </Paper>
    );
  }
  
  if (!emergency) return null;
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    const statusMap = {
      requested: 'warning',
      dispatched: 'info',
      picked_up: 'secondary',
      en_route_hospital: 'secondary',
      arrived_hospital: 'info',
      completed: 'success',
      cancelled: 'error',
    };
    
    return statusMap[status] || 'default';
  };
  
  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card elevation={4} sx={{ mt: 3, overflow: 'visible', borderRadius: 2 }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.main', 
          color: 'white',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            Emergency #{emergency.id}
          </Typography>
          <Chip 
            label={emergency.status.replace('_', ' ').toUpperCase()} 
            color={getStatusColor(emergency.status)}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <CardContent>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            spacing={3} 
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  Patient Information
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                  <Typography variant="body1">
                    <strong>Name:</strong> {emergency.patient_details.name}
                  </Typography>
                  {emergency.patient_details.contact_number && (
                    <Typography variant="body2">
                      <strong>Contact:</strong> {emergency.patient_details.contact_number}
                    </Typography>
                  )}
                </Paper>
              </Box>
              
              {emergency.ambulance_details && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DirectionsCarIcon color="primary" sx={{ mr: 1 }} />
                    Ambulance Details
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body1">
                      <strong>Vehicle:</strong> {emergency.ambulance_details.registration_number}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Driver:</strong> {emergency.ambulance_details.driver_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contact:</strong> {emergency.ambulance_details.contact_number}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
            
            <Box sx={{ flex: 1 }}>
              {emergency.hospital_details && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalHospitalIcon color="primary" sx={{ mr: 1 }} />
                    Hospital Details
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body1">
                      <strong>Name:</strong> {emergency.hospital_details.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong> {emergency.hospital_details.address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Contact:</strong> {emergency.hospital_details.contact_number}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Box>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                  Timeline
                </Typography>
                <Paper elevation={1} sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2"><strong>Request Time:</strong></Typography>
                    <Typography variant="body2">{formatTime(emergency.request_time)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2"><strong>Pickup Time:</strong></Typography>
                    <Typography variant="body2">{formatTime(emergency.pickup_time)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2"><strong>Hospital Arrival:</strong></Typography>
                    <Typography variant="body2">{formatTime(emergency.hospital_arrival_time)}</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Stack>
          
          {emergency.notes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">Notes:</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{emergency.notes}</Typography>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmergencyDetails; 