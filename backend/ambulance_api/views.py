from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import Ambulance, Hospital, Patient, Emergency
from .serializers import (
    AmbulanceSerializer, 
    HospitalSerializer, 
    PatientSerializer, 
    EmergencySerializer,
    EmergencyCreateSerializer
)
import math
from django.db import models
import requests
from django.conf import settings
from django.http import JsonResponse

class AmbulanceViewSet(viewsets.ModelViewSet):
    queryset = Ambulance.objects.all()
    serializer_class = AmbulanceSerializer
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        ambulances = Ambulance.objects.filter(is_available=True)
        serializer = self.get_serializer(ambulances, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_location(self, request, pk=None):
        ambulance = self.get_object()
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is not None and longitude is not None:
            ambulance.current_latitude = latitude
            ambulance.current_longitude = longitude
            ambulance.save()
            return Response({'status': 'location updated'})
        return Response({'error': 'latitude and longitude required'}, status=status.HTTP_400_BAD_REQUEST)

class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    
    @action(detail=False, methods=['get'])
    def with_capacity(self, request):
        hospitals = Hospital.objects.filter(current_occupancy__lt=models.F('emergency_capacity'))
        serializer = self.get_serializer(hospitals, many=True)
        return Response(serializer.data)

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

class EmergencyViewSet(viewsets.ModelViewSet):
    queryset = Emergency.objects.all().order_by('-request_time')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EmergencyCreateSerializer
        return EmergencySerializer
    
    @action(detail=True, methods=['post'])
    def assign_nearest(self, request, pk=None):
        emergency = self.get_object()
        
        # Find nearest available ambulance
        nearest_ambulance = find_nearest_ambulance(emergency.patient_latitude, emergency.patient_longitude)
        
        # Find nearest hospital with capacity
        nearest_hospital = find_nearest_hospital(emergency.patient_latitude, emergency.patient_longitude)
        
        if nearest_ambulance and nearest_hospital:
            emergency.ambulance = nearest_ambulance
            emergency.hospital = nearest_hospital
            emergency.status = 'dispatched'
            emergency.save()
            
            # Update ambulance availability
            nearest_ambulance.is_available = False
            nearest_ambulance.save()
            
            return Response({
                'status': 'success',
                'message': 'Assigned nearest ambulance and hospital',
                'ambulance': AmbulanceSerializer(nearest_ambulance).data,
                'hospital': HospitalSerializer(nearest_hospital).data
            })
        
        return Response({
            'status': 'error',
            'message': 'No available ambulances or hospitals found'
        }, status=status.HTTP_400_BAD_REQUEST)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth radius in kilometers
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2) * math.sin(dlat/2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon/2) * math.sin(dlon/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    return distance

def find_nearest_ambulance(latitude, longitude):
    """Find the nearest available ambulance"""
    available_ambulances = Ambulance.objects.filter(is_available=True)
    
    if available_ambulances:
        nearest_ambulance = None
        min_distance = float('inf')
        
        for ambulance in available_ambulances:
            distance = calculate_distance(
                latitude, longitude,
                ambulance.current_latitude, ambulance.current_longitude
            )
            
            if distance < min_distance:
                min_distance = distance
                nearest_ambulance = ambulance
        
        return nearest_ambulance
    
    # If no available ambulances in the database and using dummy data
    if settings.USE_DUMMY_DATA:
        # Create a dummy ambulance
        dummy_ambulance = Ambulance.objects.create(
            registration_number=f'MH-{100 + Ambulance.objects.count()}',
            driver_name='Emergency Driver',
            contact_number='+91 98765 43210',
            current_latitude=latitude - 0.01,  # Roughly 1km away
            current_longitude=longitude - 0.01,
            is_available=True
        )
        return dummy_ambulance
    
    return None

# Dummy data for Maharashtra region
DUMMY_HOSPITALS = [
    {
        'id': 1,
        'name': 'Apollo Hospital Mumbai',
        'address': 'Central Mumbai, Maharashtra',
        'contact_number': '022-23456789',
        'latitude': 19.0760,
        'longitude': 72.8777,
        'emergency_capacity': 40,
        'current_occupancy': 15,
        'distance': 1.2
    },
    {
        'id': 2,
        'name': 'Fortis Hospital Mulund',
        'address': 'Mulund, Mumbai, Maharashtra',
        'contact_number': '022-23456790',
        'latitude': 19.1724,
        'longitude': 72.9425,
        'emergency_capacity': 30,
        'current_occupancy': 10,
        'distance': 2.5
    },
    {
        'id': 3,
        'name': 'Lilavati Hospital',
        'address': 'Bandra, Mumbai, Maharashtra',
        'contact_number': '022-23456796',
        'latitude': 19.0509,
        'longitude': 72.8294,
        'emergency_capacity': 35,
        'current_occupancy': 18,
        'distance': 3.1
    },
    {
        'id': 4,
        'name': 'Bombay Hospital',
        'address': 'Marine Lines, Mumbai, Maharashtra',
        'contact_number': '022-23456797',
        'latitude': 18.9432,
        'longitude': 72.8290,
        'emergency_capacity': 30,
        'current_occupancy': 12,
        'distance': 3.8
    },
    {
        'id': 5,
        'name': 'Nanavati Hospital',
        'address': 'Vile Parle, Mumbai, Maharashtra',
        'contact_number': '022-23456798',
        'latitude': 19.0995,
        'longitude': 72.8465,
        'emergency_capacity': 25,
        'current_occupancy': 10,
        'distance': 4.2
    }
]

DUMMY_AMBULANCES = [
    {
        'id': 1,
        'registration_number': 'MH-01-1001',
        'driver_name': 'Rakesh Kumar',
        'contact_number': '9876543210',
        'latitude': 19.0760,
        'longitude': 72.8777,
        'is_available': True,
        'distance': 0.8
    },
    {
        'id': 2,
        'registration_number': 'MH-01-1002',
        'driver_name': 'Sunil Patil',
        'contact_number': '9876543211',
        'latitude': 19.0330,
        'longitude': 73.0297,
        'is_available': True,
        'distance': 1.4
    },
    {
        'id': 3,
        'registration_number': 'MH-01-1003',
        'driver_name': 'Ajay Singh',
        'contact_number': '9876543212',
        'latitude': 19.2183,
        'longitude': 72.9781,
        'is_available': True,
        'distance': 2.0
    }
]

# Expanded list of Maharashtra places
MAHARASHTRA_PLACES = [
    {'name': 'Mumbai', 'latitude': 19.0760, 'longitude': 72.8777},
    {'name': 'Pune', 'latitude': 18.5204, 'longitude': 73.8567},
    {'name': 'Nagpur', 'latitude': 21.1458, 'longitude': 79.0882},
    {'name': 'Thane', 'latitude': 19.2183, 'longitude': 72.9781},
    {'name': 'Nashik', 'latitude': 19.9975, 'longitude': 73.7898},
    {'name': 'Aurangabad', 'latitude': 19.8762, 'longitude': 75.3433},
    {'name': 'Solapur', 'latitude': 17.6599, 'longitude': 75.9064},
    {'name': 'Navi Mumbai', 'latitude': 19.0330, 'longitude': 73.0297},
    {'name': 'Kolhapur', 'latitude': 16.7050, 'longitude': 74.2433},
    {'name': 'Sangli', 'latitude': 16.8524, 'longitude': 74.5815},
    {'name': 'Amravati', 'latitude': 20.9320, 'longitude': 77.7523},
    {'name': 'Akola', 'latitude': 20.7002, 'longitude': 77.0082},
    {'name': 'Malegaon', 'latitude': 20.5579, 'longitude': 74.5089},
    {'name': 'Jalgaon', 'latitude': 21.0077, 'longitude': 75.5626},
    {'name': 'Dhule', 'latitude': 20.9042, 'longitude': 74.7749},
    {'name': 'Latur', 'latitude': 18.4088, 'longitude': 76.5604},
    {'name': 'Ahmednagar', 'latitude': 19.0948, 'longitude': 74.7480},
    {'name': 'Chandrapur', 'latitude': 19.9615, 'longitude': 79.2961},
    {'name': 'Parbhani', 'latitude': 19.2704, 'longitude': 76.7747},
    {'name': 'Ichalkaranji', 'latitude': 16.6910, 'longitude': 74.4673},
    {'name': 'Jalna', 'latitude': 19.8347, 'longitude': 75.8816},
    {'name': 'Ambernath', 'latitude': 19.2032, 'longitude': 73.1860},
    {'name': 'Bhiwandi', 'latitude': 19.2960, 'longitude': 73.0632},
    {'name': 'Panvel', 'latitude': 18.9894, 'longitude': 73.1175},
    {'name': 'Kalyan', 'latitude': 19.2403, 'longitude': 73.1305}
]

# Maharashtra districts with coordinates
MAHARASHTRA_DISTRICTS = [
    {'name': 'Mumbai', 'latitude': 19.0760, 'longitude': 72.8777},
    {'name': 'Pune', 'latitude': 18.5204, 'longitude': 73.8567},
    {'name': 'Nagpur', 'latitude': 21.1458, 'longitude': 79.0882},
    {'name': 'Thane', 'latitude': 19.2183, 'longitude': 72.9781},
    {'name': 'Nashik', 'latitude': 19.9975, 'longitude': 73.7898},
    {'name': 'Aurangabad', 'latitude': 19.8762, 'longitude': 75.3433},
    {'name': 'Solapur', 'latitude': 17.6599, 'longitude': 75.9064},
    {'name': 'Ahmednagar', 'latitude': 19.0948, 'longitude': 74.7480},
    {'name': 'Kolhapur', 'latitude': 16.7050, 'longitude': 74.2433},
    {'name': 'Sangli', 'latitude': 16.8524, 'longitude': 74.5815},
    {'name': 'Amravati', 'latitude': 20.9320, 'longitude': 77.7523},
    {'name': 'Akola', 'latitude': 20.7002, 'longitude': 77.0082},
    {'name': 'Jalgaon', 'latitude': 21.0077, 'longitude': 75.5626},
    {'name': 'Dhule', 'latitude': 20.9042, 'longitude': 74.7749},
    {'name': 'Ratnagiri', 'latitude': 16.9902, 'longitude': 73.3120},
    {'name': 'Satara', 'latitude': 17.6805, 'longitude': 74.0183},
    {'name': 'Chandrapur', 'latitude': 19.9615, 'longitude': 79.2961},
    {'name': 'Beed', 'latitude': 18.9891, 'longitude': 75.7601},
    {'name': 'Latur', 'latitude': 18.4088, 'longitude': 76.5604},
    {'name': 'Parbhani', 'latitude': 19.2704, 'longitude': 76.7747},
    {'name': 'Nanded', 'latitude': 19.1383, 'longitude': 77.3210},
    {'name': 'Buldhana', 'latitude': 20.5292, 'longitude': 76.1842},
    {'name': 'Yavatmal', 'latitude': 20.3899, 'longitude': 78.1307},
    {'name': 'Raigad', 'latitude': 18.5158, 'longitude': 73.1821},
    {'name': 'Osmanabad', 'latitude': 18.1818, 'longitude': 76.0350},
    {'name': 'Nandurbar', 'latitude': 21.3675, 'longitude': 74.2425},
    {'name': 'Wardha', 'latitude': 20.7453, 'longitude': 78.6022},
    {'name': 'Washim', 'latitude': 20.1120, 'longitude': 77.1565},
    {'name': 'Hingoli', 'latitude': 19.7173, 'longitude': 77.1494},
    {'name': 'Gondia', 'latitude': 21.4624, 'longitude': 80.1965},
    {'name': 'Bhandara', 'latitude': 21.1669, 'longitude': 79.6500},
    {'name': 'Gadchiroli', 'latitude': 20.1809, 'longitude': 80.0000},
    {'name': 'Sindhudurg', 'latitude': 16.3492, 'longitude': 73.5594},
    {'name': 'Palghar', 'latitude': 19.6970, 'longitude': 72.7693},
]

STATES = [
    {'name': 'Maharashtra', 'districts': MAHARASHTRA_DISTRICTS}
]

# Use Bhuvan API token from settings
BHUVAN_API_TOKEN = getattr(settings, 'BHUVAN_API_TOKEN', 'your-bhuvan-api-token-here')

# Use Google Places API key from settings
GOOGLE_PLACES_API_KEY = getattr(settings, 'GOOGLE_PLACES_API_KEY', 'AIzaSyDsp62a7XqtLn1cCr3EfbD5tj_aX9mvk_E')

@api_view(['GET'])
def nearby_hospitals(request):
    """Get hospitals near a specified location"""
    try:
        lat = float(request.GET.get('latitude', 0))
        lng = float(request.GET.get('longitude', 0))
        buffer = int(request.GET.get('buffer', 3000))  # Default 3km buffer
        
        if settings.USE_DUMMY_DATA:
            # Return dummy data for testing
            for hospital in DUMMY_HOSPITALS:
                # Calculate a fake distance for sorting based on proximity to the query point
                hospital_dist = calculate_distance(lat, lng, hospital['latitude'], hospital['longitude'])
                hospital['distance'] = round(hospital_dist, 1)
            
            # Sort hospitals by distance
            sorted_hospitals = sorted(DUMMY_HOSPITALS, key=lambda x: x['distance'])
            return Response({'hospitals': sorted_hospitals[:5]})
        
        # Use Bhuvan API to get real hospital data
        try:
            bhuvan_api_url = f"https://bhuvan-app1.nrsc.gov.in/api/api_proximity/curl_hos_pos_prox.php"
            params = {
                'theme': 'hospital',
                'lat': lat,
                'lon': lng,
                'buffer': buffer,
                'token': BHUVAN_API_TOKEN
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            response = requests.get(bhuvan_api_url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if data is False:  # API returns False if no data found
                    return Response({'hospitals': []})
                
                # Process and format hospital data
                hospitals = []
                for hospital in data:
                    try:
                        # Try to get the latitude and longitude from the API response
                        hospital_lat = float(hospital.get('lon', 0))  # Note: the API has lat/lon swapped
                        hospital_lng = float(hospital.get('lat', 0))  # Note: the API has lat/lon swapped
                        
                        hospitals.append({
                            'id': hospital.get('facilityid', 'unknown'),
                            'name': hospital.get('facilityname', 'Unknown Hospital'),
                            'address': hospital.get('facilityaddress', ''),
                            'contact_number': hospital.get('facilityphone', ''),
                            'latitude': hospital_lat,
                            'longitude': hospital_lng,
                            'distance': calculate_distance(lat, lng, hospital_lat, hospital_lng),
                            'category': hospital.get('facilitycategory', ''),
                            'district': hospital.get('dname', ''),
                            'division': hospital.get('divison', '')
                        })
                    except (ValueError, TypeError) as e:
                        # Skip hospitals with invalid data
                        continue
                
                # Sort hospitals by distance
                sorted_hospitals = sorted(hospitals, key=lambda x: x['distance'])
                return Response({'hospitals': sorted_hospitals[:10]})
            else:
                # If API call fails, fall back to dummy data
                for hospital in DUMMY_HOSPITALS:
                    hospital_dist = calculate_distance(lat, lng, hospital['latitude'], hospital['longitude'])
                    hospital['distance'] = round(hospital_dist, 1)
                
                sorted_hospitals = sorted(DUMMY_HOSPITALS, key=lambda x: x['distance'])
                return Response({'hospitals': sorted_hospitals[:5]})
        
        except Exception as e:
            # If any error occurs with the API call, fall back to dummy data
            for hospital in DUMMY_HOSPITALS:
                hospital_dist = calculate_distance(lat, lng, hospital['latitude'], hospital['longitude'])
                hospital['distance'] = round(hospital_dist, 1)
            
            sorted_hospitals = sorted(DUMMY_HOSPITALS, key=lambda x: x['distance'])
            return Response({'hospitals': sorted_hospitals[:5]})
    
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def get_states(request):
    """Get a list of available states"""
    return Response([{'name': state['name']} for state in STATES])

@api_view(['GET'])
def get_districts(request):
    """Get districts for a specific state"""
    state_name = request.GET.get('state', '')
    
    if not state_name:
        return Response({'error': 'State parameter is required'}, status=400)
    
    # Find the state in our data
    for state in STATES:
        if state['name'].lower() == state_name.lower():
            # Return list of districts for this state
            return Response(state['districts'])
    
    # If state not found
    return Response({'error': f'State "{state_name}" not found'}, status=404)

@api_view(['GET'])
def find_nearest_hospital(request):
    """Find the nearest hospital to a location"""
    try:
        lat = float(request.GET.get('latitude', 0))
        lng = float(request.GET.get('longitude', 0))
        
        if settings.USE_DUMMY_DATA:
            # Return dummy data for testing
            # Calculate distances for each hospital
            for hospital in DUMMY_HOSPITALS:
                hospital_dist = calculate_distance(lat, lng, hospital['latitude'], hospital['longitude'])
                hospital['distance'] = round(hospital_dist, 1)
            
            # Sort hospitals by distance and return the closest one
            sorted_hospitals = sorted(DUMMY_HOSPITALS, key=lambda x: x['distance'])
            if sorted_hospitals:
                return Response(sorted_hospitals[0])
            return Response({'error': 'No hospitals found'}, status=404)
        
        # Real implementation (existing code)
        # For now, just return the dummy data even if USE_DUMMY_DATA is False
        for hospital in DUMMY_HOSPITALS:
            hospital_dist = calculate_distance(lat, lng, hospital['latitude'], hospital['longitude'])
            hospital['distance'] = round(hospital_dist, 1)
        
        sorted_hospitals = sorted(DUMMY_HOSPITALS, key=lambda x: x['distance'])
        if sorted_hospitals:
            return Response(sorted_hospitals[0])
        return Response({'error': 'No hospitals found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def find_nearest_ambulance(request):
    """Find the nearest available ambulance to a location"""
    try:
        lat = float(request.GET.get('latitude', 0))
        lng = float(request.GET.get('longitude', 0))
        
        if settings.USE_DUMMY_DATA:
            # Return dummy data for testing
            # Calculate distances for each ambulance
            for ambulance in DUMMY_AMBULANCES:
                ambulance_dist = calculate_distance(lat, lng, ambulance['latitude'], ambulance['longitude'])
                ambulance['distance'] = round(ambulance_dist, 1)
            
            # Sort ambulances by distance and return the closest one
            sorted_ambulances = sorted([a for a in DUMMY_AMBULANCES if a['is_available']], key=lambda x: x['distance'])
            if sorted_ambulances:
                return Response(sorted_ambulances[0])
            return Response({'error': 'No available ambulances found'}, status=404)
        
        # Real implementation (existing code)
        # For now, just return the dummy data even if USE_DUMMY_DATA is False
        for ambulance in DUMMY_AMBULANCES:
            ambulance_dist = calculate_distance(lat, lng, ambulance['latitude'], ambulance['longitude'])
            ambulance['distance'] = round(ambulance_dist, 1)
        
        sorted_ambulances = sorted([a for a in DUMMY_AMBULANCES if a['is_available']], key=lambda x: x['distance'])
        if sorted_ambulances:
            return Response(sorted_ambulances[0])
        return Response({'error': 'No available ambulances found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def maharashtra_places(request):
    """Get a list of places in Maharashtra filtered by search term"""
    search_term = request.GET.get('search', '').lower()
    
    if not search_term:
        # Return top 10 places if no search term provided
        return Response(MAHARASHTRA_PLACES[:10])
    
    # Filter places by search term
    filtered_places = [place for place in MAHARASHTRA_PLACES 
                      if search_term in place['name'].lower()]
    
    # Sort by name and return top 10 results
    sorted_places = sorted(filtered_places, key=lambda x: x['name'])
    return Response(sorted_places[:10])

@api_view(['GET'])
def proxy_google_places(request):
    """Proxy requests to Google Places API to avoid CORS and hide API key"""
    
    # Get parameters from request
    query = request.GET.get('query', '')
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    radius = request.GET.get('radius', '5000')  # Default 5km radius
    
    # Google API key - from settings or fallback to provided key
    api_key = GOOGLE_PLACES_API_KEY
    
    if request.GET.get('place_search') == 'text':
        # Text search for districts
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json"
        params = {
            'query': query,
            'key': api_key
        }
    else:
        # Nearby search for hospitals
        url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f"{lat},{lng}",
            'radius': radius,
            'type': 'hospital',
            'key': api_key
        }
    
    try:
        response = requests.get(url, params=params)
        return JsonResponse(response.json())
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
