from django.db import models

# Create your models here.

class Ambulance(models.Model):
    registration_number = models.CharField(max_length=50, unique=True)
    driver_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15)
    current_latitude = models.FloatField(default=0.0)
    current_longitude = models.FloatField(default=0.0)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Ambulance {self.registration_number}"

class Hospital(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    contact_number = models.CharField(max_length=15)
    latitude = models.FloatField()
    longitude = models.FloatField()
    emergency_capacity = models.IntegerField(default=10)
    current_occupancy = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name
    
    @property
    def has_capacity(self):
        return self.current_occupancy < self.emergency_capacity

class Patient(models.Model):
    name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    medical_notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.name

class Emergency(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('dispatched', 'Ambulance Dispatched'),
        ('picked_up', 'Patient Picked Up'),
        ('en_route_hospital', 'En Route to Hospital'),
        ('arrived_hospital', 'Arrived at Hospital'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='emergencies')
    ambulance = models.ForeignKey(Ambulance, on_delete=models.SET_NULL, null=True, blank=True, related_name='emergencies')
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='emergencies')
    
    request_time = models.DateTimeField(auto_now_add=True)
    pickup_time = models.DateTimeField(null=True, blank=True)
    hospital_arrival_time = models.DateTimeField(null=True, blank=True)
    completion_time = models.DateTimeField(null=True, blank=True)
    
    patient_latitude = models.FloatField()
    patient_longitude = models.FloatField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Emergency {self.id} - {self.patient.name} - {self.status}"
