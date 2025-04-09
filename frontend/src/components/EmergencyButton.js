import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createEmergency, assignNearestServices, searchMaharashtraDistricts, searchNearbyHospitals } from '../services/api';
import { 
  Button, 
  Typography, 
  Box, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Alert, 
  Snackbar,
  TextField,
  Autocomplete
} from '@mui/material';

const EmergencyButton = ({ onEmergencyCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [patientLocation, setPatientLocation] = useState(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [places, setPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showPlaceSelector, setShowPlaceSelector] = useState(false);
  const [nearestHospital, setNearestHospital] = useState(null);

  // Fetch Maharashtra districts when search term changes
  useEffect(() => {
    if (searchTerm.trim().length < 2) return;
    
    const fetchDistricts = async () => {
      try {
        const response = await searchMaharashtraDistricts(searchTerm);
        if (response.results && response.results.length > 0) {
          const formattedPlaces = response.results.map(place => ({
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            placeId: place.place_id,
            address: place.formatted_address || ''
          }));
          setPlaces(formattedPlaces);
        }
      } catch (err) {
        console.error('Error fetching places:', err);
      }
    };
    
    // Add debounce
    const timer = setTimeout(fetchDistricts, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleGetLocation = async () => {
    setLocationStatus("Getting your location...");
    setError(null);
    
    try {
      const position = await getCurrentPosition();
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setPatientLocation(location);
      setLocationStatus("Location acquired successfully");
      
      // Find nearest hospital
      await findNearestHospital(location);
      
      setShowConfirmDialog(true);
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Failed to get your location. Please select a place from the dropdown.');
      setLocationStatus(null);
      setShowPlaceSelector(true);
    }
  };
  
  const findNearestHospital = async (location) => {
    try {
      const response = await searchNearbyHospitals(location.lat, location.lng, 5000);
      if (response.results && response.results.length > 0) {
        // Calculate distances
        const hospitalsWithDistance = response.results.map(hospital => {
          const lat1 = location.lat;
          const lon1 = location.lng;
          const lat2 = hospital.geometry.location.lat;
          const lon2 = hospital.geometry.location.lng;
          
          // Calculate distance in km
          const R = 6371; // Radius of the earth in km
          const dLat = deg2rad(lat2 - lat1);
          const dLon = deg2rad(lon2 - lon1);
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2)
          ; 
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
          const distance = R * c; // Distance in km
          
          return {
            ...hospital,
            distance
          };
        });
        
        // Sort by distance and take the closest
        hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
        setNearestHospital(hospitalsWithDistance[0]);
      }
    } catch (err) {
      console.error('Error finding nearest hospital:', err);
    }
  };
  
  // Function to convert degrees to radians
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  const handlePlaceSelect = (place) => {
    setSelectedPlace(place);
    if (place) {
      const location = {
        lat: place.latitude,
        lng: place.longitude
      };
      setPatientLocation(location);
      setLocationStatus(`Selected location: ${place.name}`);
      
      // Find nearest hospital
      findNearestHospital(location);
    }
  };
  
  const handleConfirmPlace = () => {
    if (!patientLocation) return;
    
    setShowPlaceSelector(false);
    setShowConfirmDialog(true);
  };
  
  const handleConfirmEmergency = async () => {
    if (!patientLocation) return;
    
    setLoading(true);
    setError(null);
    setShowConfirmDialog(false);
    
    try {
      // Create emergency request
      const emergencyData = {
        patient_name: 'Emergency User', // In a real app, you'd get this from user profile
        patient_contact: '555-1234', // In a real app, you'd get this from user profile
        patient_latitude: patientLocation.lat,
        patient_longitude: patientLocation.lng,
        notes: selectedPlace ? 
          `Emergency at ${selectedPlace.name}${nearestHospital ? `. Nearest hospital: ${nearestHospital.name}` : ''}` : 
          `Emergency request from mobile app${nearestHospital ? `. Nearest hospital: ${nearestHospital.name}` : ''}`
      };
      
      console.log('Sending emergency request with data:', emergencyData);
      
      // Create emergency
      const response = await createEmergency(emergencyData);
      console.log('Emergency created:', response.data);
      const emergencyId = response.data.id;
      
      // Assign nearest ambulance and hospital
      console.log('Assigning services to emergency ID:', emergencyId);
      await assignNearestServices(emergencyId);
      
      // Notify parent component
      onEmergencyCreated(emergencyId);
      setShowSuccessSnackbar(true);
    } catch (err) {
      console.error('Error creating emergency:', err);
      let errorMsg = 'Failed to create emergency. Please try again.';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        errorMsg += ` Server responded with status: ${err.response.status}`;
        if (err.response.data && err.response.data.detail) {
          errorMsg += ` - ${err.response.data.detail}`;
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        errorMsg = 'No response from server. Please check your internet connection.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
      setLocationStatus(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setShowPlaceSelector(false);
    setPatientLocation(null);
    setLocationStatus(null);
    setSelectedPlace(null);
    setNearestHospital(null);
  };
  
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });
  };
  
  return (
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="contained"
          color="error"
          size="large"
          disabled={loading}
          onClick={handleGetLocation}
          sx={{
            borderRadius: '50%',
            width: 200,
            height: 200,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
            '&:hover': {
              boxShadow: '0 0 30px rgba(255, 0, 0, 0.7)',
            },
            animation: loading ? 'none' : 'pulse 2s infinite'
          }}
        >
          {loading ? (
            <CircularProgress color="inherit" size={60} />
          ) : (
            <Typography variant="h5" component="span">
              EMERGENCY
            </Typography>
          )}
        </Button>
      </motion.div>
      
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Press the button to get immediate assistance
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Or select a location in Maharashtra:
        </Typography>
        
        <Autocomplete
          sx={{ width: 300, mt: 1 }}
          options={places}
          getOptionLabel={(option) => option.name}
          value={selectedPlace}
          onChange={(_, newValue) => handlePlaceSelect(newValue)}
          onInputChange={(_, newValue) => setSearchTerm(newValue)}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Search places in Maharashtra" 
              variant="outlined" 
              size="small"
            />
          )}
          noOptionsText="Type to search for places"
        />
        
        {selectedPlace && (
          <Button 
            variant="contained" 
            color="primary" 
            size="small" 
            sx={{ mt: 1 }}
            onClick={handleConfirmPlace}
          >
            Use this location
          </Button>
        )}
      </Box>
      
      {locationStatus && (
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          {locationStatus}
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
          {error}
        </Alert>
      )}

      {/* Place Selector Dialog */}
      <Dialog 
        open={showPlaceSelector}
        onClose={handleCancel}
      >
        <DialogTitle>Select a Location in Maharashtra</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Please select a location in Maharashtra for the emergency:
          </Typography>
          <Autocomplete
            sx={{ width: '100%', mt: 2 }}
            options={places}
            getOptionLabel={(option) => option.name}
            value={selectedPlace}
            onChange={(_, newValue) => handlePlaceSelect(newValue)}
            onInputChange={(_, newValue) => setSearchTerm(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label="Search places in Maharashtra" 
                variant="outlined" 
                fullWidth
              />
            )}
            noOptionsText="Type to search for places"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button 
            onClick={handleConfirmPlace} 
            color="primary" 
            variant="contained" 
            disabled={!selectedPlace}
          >
            Confirm Location
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmDialog}
        onClose={handleCancel}
      >
        <DialogTitle>Confirm Emergency Request</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {selectedPlace ? `Selected Location: ${selectedPlace.name}` : "We've located you at:"}
          </Typography>
          {patientLocation && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              Latitude: {patientLocation.lat.toFixed(6)}<br />
              Longitude: {patientLocation.lng.toFixed(6)}
            </Typography>
          )}
          
          {nearestHospital && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body1" fontWeight="bold" color="primary">
                Nearest Hospital:
              </Typography>
              <Typography variant="body2">
                {nearestHospital.name}
                {nearestHospital.vicinity && (
                  <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                    {nearestHospital.vicinity}
                  </Box>
                )}
                {nearestHospital.distance && (
                  <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                    Distance: {nearestHospital.distance.toFixed(2)} km
                  </Box>
                )}
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" sx={{ mt: 2 }}>
            Do you want to request emergency assistance at this location?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirmEmergency} color="error" variant="contained" autoFocus>
            Confirm Emergency
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Emergency request created successfully. Help is on the way!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmergencyButton; 