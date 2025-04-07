from rest_framework import serializers
from .models import Ambulance, Hospital, Patient, Emergency

class AmbulanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ambulance
        fields = '__all__'

class HospitalSerializer(serializers.ModelSerializer):
    has_capacity = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Hospital
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'

class EmergencySerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    ambulance_details = AmbulanceSerializer(source='ambulance', read_only=True)
    hospital_details = HospitalSerializer(source='hospital', read_only=True)
    
    class Meta:
        model = Emergency
        fields = '__all__'
        
class EmergencyCreateSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(write_only=True)
    patient_contact = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Emergency
        fields = ['patient_name', 'patient_contact', 'patient_latitude', 'patient_longitude', 'notes']
        
    def create(self, validated_data):
        patient_name = validated_data.pop('patient_name')
        patient_contact = validated_data.pop('patient_contact', '')
        
        # Create patient or get existing one
        patient, created = Patient.objects.get_or_create(
            name=patient_name,
            defaults={'contact_number': patient_contact}
        )
        
        # Create emergency
        emergency = Emergency.objects.create(
            patient=patient,
            **validated_data
        )
        
        return emergency 