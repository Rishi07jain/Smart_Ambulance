import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  CircularProgress, 
  Box, 
  Button,
  InputAdornment,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { searchMaharashtraDistricts } from '../services/api';

const LocationSelector = ({ onLocationSelected }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  // Fetch suggestions when input changes
  const fetchSuggestions = async (value) => {
    if (!value || value.length < 2) {
      setOptions([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await searchMaharashtraDistricts(value);
      
      // Filter results to prioritize Maharashtra districts
      const filteredResults = response.results.filter(place => 
        place.formatted_address.toLowerCase().includes('maharashtra') ||
        place.name.toLowerCase().includes('district')
      );
      
      setOptions(filteredResults || []);
    } catch (error) {
      console.error('Error fetching district suggestions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handlePlaceSelect = (event, newValue) => {
    setSelectedPlace(newValue);
    
    if (newValue) {
      // Extract location data when a place is selected
      const location = {
        lat: newValue.geometry.location.lat,
        lng: newValue.geometry.location.lng
      };
      
      // Pass the selected location up to parent component
      onLocationSelected(location, newValue.name);
    }
  };

  const handleSearch = () => {
    // Trigger search with current selection if available
    if (selectedPlace) {
      const location = {
        lat: selectedPlace.geometry.location.lat,
        lng: selectedPlace.geometry.location.lng
      };
      onLocationSelected(location, selectedPlace.name);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
      <Autocomplete
        id="district-search"
        sx={{ flex: 1 }}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
        getOptionLabel={(option) => option.name}
        options={options}
        loading={loading}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={handlePlaceSelect}
        filterOptions={(x) => x} // Disable default filtering
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search for a district in Maharashtra"
            placeholder="Type a district name..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body1">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.formatted_address}
              </Typography>
            </Box>
          </li>
        )}
      />
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleSearch}
        disabled={!selectedPlace}
        startIcon={<SearchIcon />}
        sx={{ height: { sm: '56px' } }}
      >
        Find Hospitals
      </Button>
    </Box>
  );
};

export default LocationSelector;