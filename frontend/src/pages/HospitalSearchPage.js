import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Slider, AppBar, Toolbar, Divider, Alert } from '@mui/material';
import LocationSelector from '../components/LocationSelector';
import HospitalList from '../components/HospitalList';
import { searchNearbyHospitals } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Create custom hospital icon
const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/33/33777.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

// Map recenter component
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
};

const HospitalSearchPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(3000); // 3km default
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]); // Mumbai by default
  const [apiCallCount, setApiCallCount] = useState(0);
  const [showApiWarning, setShowApiWarning] = useState(false);

  const handleLocationSelected = async (location, placeName) => {
    setSearchLocation(location);
    setSelectedLocation(placeName);
    setMapCenter([location.lat, location.lng]);
    await searchHospitals(location);
  };

  const handleRadiusChange = (_event, newValue) => {
    setSearchRadius(newValue);
  };

  const handleRadiusChangeCommitted = async (_event, _newValue) => {
    if (searchLocation) {
      await searchHospitals(searchLocation);
    }
  };

  // Function to calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };
  
  // Function to convert degrees to radians
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const searchHospitals = async (location) => {
    try {
      // Check API call limits to prevent exceeding quota
      if (apiCallCount >= 9) {
        setShowApiWarning(true);
        // Still perform the search but warn the user
      }
      
      setLoading(true);
      setError(null);
      
      const response = await searchNearbyHospitals(location.lat, location.lng, searchRadius);
      setApiCallCount(prev => prev + 1);
      
      if (response.results && response.results.length > 0) {
        // Add distance property to each hospital
        const hospitalsWithDistance = response.results.map(hospital => {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            hospital.geometry.location.lat,
            hospital.geometry.location.lng
          );
          
          return {
            ...hospital,
            distance
          };
        });
        
        // Sort by distance
        hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
        
        setHospitals(hospitalsWithDistance);
      } else {
        setHospitals([]);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError('Failed to fetch hospitals. Please try again.');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Box component="span" sx={{ color: 'primary.main' }}>Hospital</Box> Finder
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {showApiWarning && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You're approaching the limit of free API calls. Some features may be restricted to prevent exceeding quota limits.
          </Alert>
        )}
      
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Find Hospitals in Maharashtra
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Search for a district in Maharashtra to find nearby hospitals. You can adjust the search radius to see more or fewer results.
          </Typography>

          <LocationSelector onLocationSelected={handleLocationSelected} />

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography id="radius-slider" gutterBottom>
              Search Radius: {(searchRadius / 1000).toFixed(1)} km
            </Typography>
            <Slider
              value={searchRadius}
              onChange={handleRadiusChange}
              onChangeCommitted={handleRadiusChangeCommitted}
              min={1000}
              max={10000}
              step={500}
              marks={[
                { value: 1000, label: '1km' },
                { value: 5000, label: '5km' },
                { value: 10000, label: '10km' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${(value / 1000).toFixed(1)}km`}
              disabled={!searchLocation}
              aria-labelledby="radius-slider"
            />
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ px: 1 }}>
              Hospital Map
            </Typography>
            
            <Box sx={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
              <MapContainer 
                center={mapCenter} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapUpdater center={mapCenter} />
                
                {searchLocation && (
                  <>
                    <Marker position={[searchLocation.lat, searchLocation.lng]}>
                      <Popup>
                        <Typography variant="body1"><strong>{selectedLocation}</strong></Typography>
                        <Typography variant="body2">
                          Selected location
                        </Typography>
                      </Popup>
                    </Marker>
                    
                    <Circle 
                      center={[searchLocation.lat, searchLocation.lng]}
                      radius={searchRadius}
                      pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                    />
                  </>
                )}
                
                {hospitals.map((hospital, index) => (
                  <Marker 
                    key={hospital.place_id || index}
                    position={[hospital.geometry.location.lat, hospital.geometry.location.lng]}
                    icon={hospitalIcon}
                  >
                    <Popup>
                      <Typography variant="subtitle1">{hospital.name}</Typography>
                      {hospital.vicinity && (
                        <Typography variant="body2">{hospital.vicinity}</Typography>
                      )}
                      {hospital.distance && (
                        <Typography variant="body2">
                          Distance: {hospital.distance.toFixed(1)} km
                        </Typography>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ px: 1 }}>
              Hospital Results
            </Typography>
            
            <HospitalList 
              hospitals={hospitals}
              loading={loading}
              error={error}
              selectedLocation={selectedLocation}
              isGoogleData={true}
            />
          </Box>
        </Box>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 4, bgcolor: '#fff', borderTop: '1px solid #e0e0e0' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Hospital Finder - Powered by Google Places API
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HospitalSearchPage;