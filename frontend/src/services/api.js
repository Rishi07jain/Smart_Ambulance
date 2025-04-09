import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const GOOGLE_API_KEY = 'AIzaSyDsp62a7XqtLn1cCr3EfbD5tj_aX9mvk_E';
// Using a public CORS proxy for development - in production, you would use your own proxy
const CORS_PROXY = 'https://corsproxy.io/?';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Google Places API
export const searchMaharashtraDistricts = async (searchQuery) => {
  try {
    const query = searchQuery ? `${searchQuery} district maharashtra` : 'district maharashtra';
    const response = await api.get('/google-places/', {
      params: {
        query: query,
        type: 'textsearch'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching districts:', error);
    // Return empty results on error
    return { results: [] };
  }
};

export const searchNearbyHospitals = async (latitude, longitude, radius = 5000) => {
  try {
    const response = await api.get('/google-places/', {
      params: {
        lat: latitude,
        lng: longitude,
        radius: radius,
        type: 'nearbysearch',
        keyword: 'hospital'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching hospitals:', error);
    // Return empty results on error
    return { results: [] };
  }
};

// Ambulance API
export const getAmbulances = () => api.get('/ambulances/');
export const getAvailableAmbulances = () => api.get('/ambulances/available/');
export const updateAmbulanceLocation = (id, data) => 
  api.post(`/ambulances/${id}/update_location/`, data);

// Hospital API
export const getHospitals = () => api.get('/hospitals/');
export const getHospitalsWithCapacity = () => api.get('/hospitals/with_capacity/');
export const getNearbyHospitals = (latitude, longitude, buffer = 3000) => 
  api.get('/nearby-hospitals/', {
    params: { latitude, longitude, buffer }
  });

// State and District API
export const getStates = () => api.get('/states/');
export const getDistricts = (state) => 
  api.get('/districts/', {
    params: { state }
  });

// Place suggestions API
export const getMaharashtraPlaces = (searchTerm) => 
  api.get('/places/', {
    params: { search: searchTerm }
  });

// Emergency API
export const getEmergencies = () => api.get('/emergencies/');
export const createEmergency = (data) => {
  console.log('Creating emergency with data:', data);
  return api.post('/emergencies/', data);
};
export const assignNearestServices = (id) => api.post(`/emergencies/${id}/assign_nearest/`);
export const updateEmergencyStatus = (id, data) => 
  api.patch(`/emergencies/${id}/`, { status: data.status });

export default api;
