from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'ambulances', views.AmbulanceViewSet)
router.register(r'hospitals', views.HospitalViewSet)
router.register(r'patients', views.PatientViewSet)
router.register(r'emergencies', views.EmergencyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('nearby-hospitals/', views.nearby_hospitals, name='nearby_hospitals'),
    path('nearest-hospital/', views.find_nearest_hospital, name='nearest_hospital'),
    path('nearest-ambulance/', views.find_nearest_ambulance, name='nearest_ambulance'),
    path('states/', views.get_states, name='states'),
    path('districts/', views.get_districts, name='districts'),
    path('places/', views.maharashtra_places, name='places'),
    # New endpoint for Google Places API
    path('google-places/', views.proxy_google_places, name='google_places'),
]