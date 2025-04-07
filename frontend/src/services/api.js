import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Google Places API via Django proxy
export const searchMaharashtraDistricts = async (searchQuery) => {
  const query = searchQuery ? `${searchQuery} district maharashtra` : 'district maharashtra';
  const response = await axios.get(`${API_URL}/proxy/google-places/`, {
    params: {
      query: query,
      place_search: 'text'
    }
  });
  return response.data;
};

export const searchNearbyHospitals = async (latitude, longitude, radius = 5000) => {
  const response = await axios.get(`${API_URL}/proxy/google-places/`, {
    params: {
      lat: latitude,
      lng: longitude,
      radius: radius
    }
  });
  return response.data;
};

// Rest of your API functions remain the same
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
  api.get('/maharashtra-places/', {
    params: { search: searchTerm }
  });

// Emergency API
export const getEmergencies = () => api.get('/emergencies/');
export const createEmergency = (data) => api.post('/emergencies/', data);
export const assignNearestServices = (id) => api.post(`/emergencies/${id}/assign_nearest/`);
export const updateEmergencyStatus = (id, data) =>
  api.patch(`/emergencies/${id}/`, { status: data.status });

export default api;
