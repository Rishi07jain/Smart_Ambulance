from django.core.management.base import BaseCommand
from ambulance_api.models import Ambulance, Hospital, Patient, Emergency
import random

class Command(BaseCommand):
    help = 'Adds sample data to the database'

    def handle(self, *args, **options):
        # Clear existing data first
        self.stdout.write('Clearing existing data...')
        Ambulance.objects.all().delete()
        Hospital.objects.all().delete()
        Patient.objects.all().delete()
        Emergency.objects.all().delete()
        
        # Create ambulances in Maharashtra region
        self.stdout.write('Creating sample ambulances...')
        
        # Mumbai area ambulances
        self.create_ambulance('MH-01-1001', 'Rakesh Kumar', '9876543210', 19.0760, 72.8777)  # Mumbai city center
        self.create_ambulance('MH-01-1002', 'Sunil Patil', '9876543211', 19.0330, 73.0297)   # Navi Mumbai
        self.create_ambulance('MH-01-1003', 'Ajay Singh', '9876543212', 19.2183, 72.9781)    # Thane
        
        # Pune area ambulances
        self.create_ambulance('MH-12-1004', 'Rajesh Sharma', '9876543213', 18.5204, 73.8567) # Pune city center
        self.create_ambulance('MH-12-1005', 'Deepak Verma', '9876543214', 18.6297, 73.7997)  # Chinchwad
        
        # Nagpur area ambulances
        self.create_ambulance('MH-31-1006', 'Vikram Yadav', '9876543215', 21.1458, 79.0882)  # Nagpur city center
        
        # Nashik area ambulances
        self.create_ambulance('MH-15-1007', 'Anil Gupta', '9876543216', 19.9975, 73.7898)    # Nashik city center
        
        # Aurangabad area ambulances
        self.create_ambulance('MH-20-1008', 'Sanjay Dubey', '9876543217', 19.8762, 75.3433)  # Aurangabad city center
        
        # Create hospitals in Maharashtra
        self.stdout.write('Creating sample hospitals...')
        hospital_data = [
            {
                'name': 'Apollo Hospital Mumbai',
                'address': 'Central Mumbai, Maharashtra',
                'contact_number': '022-23456789',
                'latitude': 19.0760,
                'longitude': 72.8777,
                'emergency_capacity': 40,
                'current_occupancy': 15
            },
            {
                'name': 'Fortis Hospital Mulund',
                'address': 'Mulund, Mumbai, Maharashtra',
                'contact_number': '022-23456790',
                'latitude': 19.1724,
                'longitude': 72.9425,
                'emergency_capacity': 30,
                'current_occupancy': 10
            },
            {
                'name': 'Ruby Hall Clinic',
                'address': 'Pune, Maharashtra',
                'contact_number': '020-23456791',
                'latitude': 18.5308,
                'longitude': 73.8711,
                'emergency_capacity': 25,
                'current_occupancy': 8
            },
            {
                'name': 'Jehangir Hospital',
                'address': 'Pune, Maharashtra',
                'contact_number': '020-23456792',
                'latitude': 18.5284,
                'longitude': 73.8739,
                'emergency_capacity': 20,
                'current_occupancy': 5
            },
            {
                'name': 'Alexis Hospital',
                'address': 'Nagpur, Maharashtra',
                'contact_number': '0712-23456793',
                'latitude': 21.1458,
                'longitude': 79.0882,
                'emergency_capacity': 15,
                'current_occupancy': 3
            },
            {
                'name': 'Wockhardt Hospital',
                'address': 'Nashik, Maharashtra',
                'contact_number': '0253-23456794',
                'latitude': 19.9975,
                'longitude': 73.7898,
                'emergency_capacity': 18,
                'current_occupancy': 6
            },
            {
                'name': 'MGM Hospital',
                'address': 'Aurangabad, Maharashtra',
                'contact_number': '0240-23456795',
                'latitude': 19.8762,
                'longitude': 75.3433,
                'emergency_capacity': 22,
                'current_occupancy': 9
            },
            {
                'name': 'Lilavati Hospital',
                'address': 'Bandra, Mumbai, Maharashtra',
                'contact_number': '022-23456796',
                'latitude': 19.0509,
                'longitude': 72.8294,
                'emergency_capacity': 35,
                'current_occupancy': 18
            },
            {
                'name': 'Bombay Hospital',
                'address': 'Marine Lines, Mumbai, Maharashtra',
                'contact_number': '022-23456797',
                'latitude': 18.9432,
                'longitude': 72.8290,
                'emergency_capacity': 30,
                'current_occupancy': 12
            },
            {
                'name': 'Nanavati Hospital',
                'address': 'Vile Parle, Mumbai, Maharashtra',
                'contact_number': '022-23456798',
                'latitude': 19.0995,
                'longitude': 72.8465,
                'emergency_capacity': 25,
                'current_occupancy': 10
            }
        ]
        
        for hospital in hospital_data:
            Hospital.objects.create(**hospital)
        
        # Create patients
        self.stdout.write('Creating sample patients...')
        patient_names = [
            'Amit Patel', 'Sneha Sharma', 'Rahul Singh', 'Priya Desai', 
            'Vikram Joshi', 'Neha Verma', 'Sanjay Gupta', 'Anita Reddy',
            'Rajesh Kumar', 'Kavita Mehta', 'Deepak Malhotra', 'Sunita Tiwari'
        ]
        
        for name in patient_names:
            Patient.objects.create(
                name=name,
                contact_number=f'+91-{random.randint(7000000000, 9999999999)}',
                address=f'{random.randint(1, 999)} Sample St, {random.choice(["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"])}',
                medical_notes=random.choice([None, 'Diabetes', 'Hypertension', 'Asthma', 'Allergy to penicillin'])
            )
        
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))
    
    def create_ambulance(self, reg_number, driver, contact, lat, lng):
        """Helper method to create an ambulance with the given details"""
        return Ambulance.objects.create(
            registration_number=reg_number,
            driver_name=driver,
            contact_number=contact,
            current_latitude=lat,
            current_longitude=lng,
            is_available=True
        ) 