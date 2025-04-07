<<<<<<< HEAD
# Smart Ambulance System

A web-based emergency medical assistance system that allows users to request an ambulance with the press of a button. The system tracks the user's location, finds the nearest available ambulance and hospital, and provides real-time updates on the emergency status.

## Features

- **One-Click Emergency Assistance**: Press the emergency button to request immediate medical help
- **Geolocation Tracking**: Automatically detects user's location coordinates
- **Nearest Service Finder**: Locates the closest available ambulance and suitable hospital
- **Real-time Map Visualization**: Displays patient, ambulance, and hospital locations on an interactive map
- **Emergency Status Updates**: Provides real-time updates on the status of the emergency request
- **Hospital Capacity Management**: Tracks hospital emergency capacity and occupancy
- **External API Integration**: Uses Geoapify to find nearby hospitals when needed

## Technology Stack

- **Frontend**: React.js with TypeScript, Material UI, Framer Motion for animations, Leaflet for maps
- **Backend**: Django with Django REST Framework
- **Database**: SQLite (for development)
- **External API**: Geoapify Places API for hospital data

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd ambulance_system/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Add your Geoapify API key:
   - Get a free API key from [Geoapify](https://www.geoapify.com/)
   - Edit `ambulance_project/settings.py` and replace `"your-geoapify-api-key-here"` with your actual API key

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Load sample data:
   ```
   python manage.py add_sample_data
   ```

7. Start the Django server:
   ```
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd ambulance_system/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and go to:
   ```
   http://localhost:3000
   ```

## How to Use

1. Open the application in your browser
2. Allow location access when prompted
3. Press the "EMERGENCY" button
4. Confirm your location in the dialog
5. The system will automatically:
   - Find the nearest available ambulance
   - Find the nearest suitable hospital
   - Display these on the map
   - Show emergency details and status updates

## API Endpoints

- `GET /api/ambulances/` - List all ambulances
- `GET /api/ambulances/available/` - List available ambulances
- `GET /api/hospitals/` - List all hospitals
- `GET /api/hospitals/with_capacity/` - List hospitals with capacity
- `GET /api/emergencies/` - List all emergencies
- `POST /api/emergencies/` - Create a new emergency
- `POST /api/emergencies/{id}/assign_nearest/` - Assign nearest ambulance and hospital
- `GET /api/nearby-hospitals/` - Get nearby hospitals using Geoapify

## License

MIT License 
=======
# Smart_Ambulance
>>>>>>> ef7814a7509929aefa12e809214b540156f25c51
