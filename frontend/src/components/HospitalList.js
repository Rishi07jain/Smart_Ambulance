import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  CircularProgress, 
  Rating, 
  Alert
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PhoneIcon from '@mui/icons-material/Phone';
import DirectionsIcon from '@mui/icons-material/Directions';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const HospitalList = ({ hospitals, loading, error, selectedLocation, isGoogleData }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!selectedLocation) {
    return (
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: '#fafafa' }}>
        <Typography align="center" color="text.secondary">
          Search for a district to see hospitals in that area
        </Typography>
      </Paper>
    );
  }

  if (hospitals.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: '#fafafa' }}>
        <Typography align="center" color="text.secondary">
          No hospitals found in this area. Try increasing the search radius.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, maxHeight: '500px', overflow: 'auto' }}>
      <List disablePadding>
        {hospitals.map((hospital, index) => (
          <React.Fragment key={hospital.place_id || hospital.id || index}>
            <ListItem 
              alignItems="flex-start" 
              sx={{ 
                py: 2,
                px: 3,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <LocalHospitalIcon />
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    {hospital.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {isGoogleData && hospital.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating 
                          value={hospital.rating} 
                          precision={0.1} 
                          size="small" 
                          readOnly 
                        />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {hospital.rating} ({hospital.user_ratings_total || 0})
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {hospital.vicinity || hospital.address || 'Address not available'}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Distance: {hospital.distance ? hospital.distance.toFixed(1) : '?'} km
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {hospital.opening_hours && (
                        <Chip 
                          size="small" 
                          icon={<AccessTimeIcon fontSize="small" />} 
                          label={hospital.opening_hours.open_now ? "Open Now" : "Closed"} 
                          color={hospital.opening_hours.open_now ? "success" : "default"}
                        />
                      )}
                      
                      {hospital.phone && (
                        <Chip 
                          size="small" 
                          icon={<PhoneIcon fontSize="small" />} 
                          label="Call" 
                          onClick={() => window.open(`tel:${hospital.phone}`)}
                        />
                      )}
                      
                      <Chip 
                        size="small" 
                        icon={<DirectionsIcon fontSize="small" />} 
                        label="Directions" 
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospital.name)}&destination_place_id=${hospital.place_id}`)}
                      />
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            {index < hospitals.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default HospitalList;