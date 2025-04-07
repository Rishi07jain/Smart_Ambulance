import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getAvailableAmbulances, getHospitalsWithCapacity, getNearbyHospitals } from '../services/api';
import { Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';

// Custom icons
const ambulanceIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/462/462732.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const hospitalIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/33/33777.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const patientIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3596/3596156.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Component to recenter map when patient location changes
const MapController = ({ center, markers }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 13, {
        animate: true,
        duration: 1.5
      });
    }
    
    // If we have multiple markers, fit bounds to include all
    if (markers.length > 1) {
      const bounds = markers.reduce((acc, curr) => {
        acc.extend(curr);
        return acc;
      }, map.getBounds());
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [center, markers, map]);
  
  return null;
};

const EmergencyMap = ({ patientLocation, selectedAmbulance, selectedHospital }) => {
  const [ambulances, setAmbulances] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [defaultLocation, setDefaultLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current location if possible
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setDefaultLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        }
        
        // Fetch ambulances and hospitals
        const [ambulancesRes, hospitalsRes] = await Promise.all([
          getAvailableAmbulances(),
          getHospitalsWithCapacity()
        ]);
        
        setAmbulances(ambulancesRes.data);
        setHospitals(hospitalsRes.data);
        setError(null);
        
        // If patient location is provided, fetch nearby hospitals from Geoapify
        if (patientLocation) {
          try {
            const nearbyRes = await getNearbyHospitals(
              patientLocation.lat, 
              patientLocation.lng,
              5000 // 5km radius
            );
            
            if (nearbyRes.data) {
              setNearbyHospitals(nearbyRes.data);
            }
          } catch (err) {
            console.error('Error fetching nearby hospitals:', err);
            // Don't set the main error for this, just log it
          }
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [patientLocation]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }
  
  // Use patient location or selected ambulance location or default
  const mapCenter = patientLocation || 
                   (selectedAmbulance ? 
                     { lat: selectedAmbulance.current_latitude, lng: selectedAmbulance.current_longitude } : 
                     defaultLocation);
  
  // Collect all marker coordinates for bounds calculation
  const allMarkers = [];
  
  if (patientLocation) {
    allMarkers.push([patientLocation.lat, patientLocation.lng]);
  }
  
  if (selectedAmbulance) {
    allMarkers.push([selectedAmbulance.current_latitude, selectedAmbulance.current_longitude]);
  }
  
  if (selectedHospital) {
    allMarkers.push([selectedHospital.latitude, selectedHospital.longitude]);
  }
  
  // Add nearby hospitals to markers list
  if (nearbyHospitals.hospitals) {
    nearbyHospitals.hospitals.forEach(hospital => {
      if (hospital.latitude && hospital.longitude) {
        allMarkers.push([hospital.latitude, hospital.longitude]);
      }
    });
  }
  
  return (
    <Box sx={{ height: '500px', width: '100%', mt: 3 }}>
      <MapContainer 
        center={[mapCenter.lat, mapCenter.lng]} 
        zoom={13} 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={mapCenter} markers={allMarkers} />
        
        {/* Patient Marker with Circle */}
        {patientLocation && (
          <>
            <Marker 
              position={[patientLocation.lat, patientLocation.lng]}
              icon={patientIcon}
            >
              <Popup>
                <Typography variant="body1"><strong>Patient Location</strong></Typography>
                <Typography variant="body2">
                  Lat: {patientLocation.lat.toFixed(6)}<br />
                  Lng: {patientLocation.lng.toFixed(6)}
                </Typography>
              </Popup>
            </Marker>
            <Circle 
              center={[patientLocation.lat, patientLocation.lng]}
              radius={5000} // 5km radius
              pathOptions={{ color: 'rgba(255, 0, 0, 0.2)', fillColor: 'rgba(255, 0, 0, 0.1)' }}
            />
          </>
        )}
        
        {/* Selected Ambulance */}
        {selectedAmbulance && (
          <Marker 
            position={[selectedAmbulance.current_latitude, selectedAmbulance.current_longitude]}
            icon={ambulanceIcon}
          >
            <Popup>
              <Typography variant="subtitle1">{selectedAmbulance.registration_number}</Typography>
              <Typography variant="body2">Driver: {selectedAmbulance.driver_name}</Typography>
              <Typography variant="body2">Contact: {selectedAmbulance.contact_number}</Typography>
            </Popup>
          </Marker>
        )}
        
        {/* Selected Hospital */}
        {selectedHospital && (
          <Marker 
            position={[selectedHospital.latitude, selectedHospital.longitude]}
            icon={hospitalIcon}
          >
            <Popup>
              <Typography variant="subtitle1">{selectedHospital.name}</Typography>
              <Typography variant="body2">{selectedHospital.address}</Typography>
              <Typography variant="body2">
                Capacity: {selectedHospital.current_occupancy}/{selectedHospital.emergency_capacity}
              </Typography>
            </Popup>
          </Marker>
        )}
        
        {/* Nearby Hospitals from API */}
        {nearbyHospitals.hospitals && nearbyHospitals.hospitals.map((hospital, index) => (
          <Marker 
            key={`nearby-${index}`}
            position={[hospital.latitude, hospital.longitude]}
            icon={hospitalIcon}
            opacity={selectedHospital ? 0.5 : 0.7}
          >
            <Popup>
              <Typography variant="subtitle1">{hospital.name}</Typography>
              <Typography variant="body2">{hospital.address}</Typography>
              {hospital.contact_number && (
                <Typography variant="body2">Phone: {hospital.contact_number}</Typography>
              )}
              {hospital.distance && (
                <Typography variant="body2">
                  Distance: {hospital.distance.toFixed(2)} km
                </Typography>
              )}
            </Popup>
          </Marker>
        ))}
        
        {/* All available ambulances (dimmed if one is selected) */}
        {!selectedAmbulance && ambulances.map(ambulance => (
          <Marker 
            key={ambulance.id}
            position={[ambulance.current_latitude, ambulance.current_longitude]}
            icon={ambulanceIcon}
            opacity={0.7}
          >
            <Popup>
              <Typography variant="subtitle1">{ambulance.registration_number}</Typography>
              <Typography variant="body2">Driver: {ambulance.driver_name}</Typography>
              <Typography variant="body2">Status: Available</Typography>
            </Popup>
          </Marker>
        ))}
        
        {/* All hospitals with capacity (dimmed if one is selected) */}
        {!selectedHospital && hospitals.map(hospital => (
          <Marker 
            key={hospital.id}
            position={[hospital.latitude, hospital.longitude]}
            icon={hospitalIcon}
            opacity={0.7}
          >
            <Popup>
              <Typography variant="subtitle1">{hospital.name}</Typography>
              <Typography variant="body2">{hospital.address}</Typography>
              <Typography variant="body2">
                Capacity: {hospital.current_occupancy}/{hospital.emergency_capacity}
              </Typography>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default EmergencyMap; 