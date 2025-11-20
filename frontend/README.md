# Promotion & Safety Riding Management - Frontend

A comprehensive web application for managing safety riding programs, schools, events, accidents, and budgets with a white-red themed dashboard.

## Features

- **Dashboard**: Overview with statistics for schools, events, accidents, and budgets
- **School Management**: CRUD operations with interactive map showing school locations
- **Event Management**: Manage safety riding events with photo support
- **Accident Records**: Track and manage accident data with police reports
- **Budget Management**: Track event budgets with monthly/yearly summaries
- **Role-Based Access Control**: Admin and staff roles with different permissions
- **White-Red Theme**: Professional dashboard with gradient red sidebar
- **Free Maps**: Uses OpenStreetMap (Leaflet) - no API key or billing required

## Prerequisites

- Node.js 16+ and npm
- Backend API running (default: http://localhost:8080)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration:
```env
VITE_API_BASE_URL=http://localhost:8080
```

## Development

Run the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

## Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── DashboardLayout.jsx    # Main dashboard layout with sidebar
│   │   └── ProtectedRoute.jsx     # Route protection component
│   └── maps/
│       └── SchoolMap.jsx           # Google Maps integration
├── contexts/
│   └── AuthContext.jsx             # Authentication context
├── pages/
│   ├── auth/
│   │   └── Login.jsx               # Login page
│   ├── schools/
│   │   └── SchoolList.jsx          # Schools list with map view
│   ├── events/
│   │   └── EventList.jsx           # Events management
│   ├── accidents/
│   │   └── AccidentList.jsx        # Accident records
│   ├── budgets/
│   │   └── BudgetList.jsx          # Budget tracking
│   └── Dashboard.jsx               # Dashboard home
├── services/
│   ├── api.js                      # Axios instance with interceptors
│   ├── authService.js              # Authentication API calls
│   ├── schoolService.js            # School API calls
│   ├── eventService.js             # Event API calls
│   ├── accidentService.js          # Accident API calls
│   ├── budgetService.js            # Budget API calls
│   └── locationService.js          # Location API calls
├── styles/
│   └── theme.css                   # White-red theme styles
└── App.jsx                         # Main app with routing
```

## User Roles

- **Admin**: Full access to all features including budget management
- **Staff**: Access to schools, events, and accidents (no budget access)

## API Integration

The frontend integrates with the following backend endpoints:

- `/auth/login` - User authentication
- `/schools` - School CRUD operations
- `/events` - Event management with photos
- `/accidents` - Accident records
- `/budgets` - Budget tracking with summaries
- `/province`, `/city`, `/district` - Location data from Indonesian government API

## Interactive Maps Integration

Schools with latitude and longitude coordinates are displayed on an interactive map with:
- **Leaflet + OpenStreetMap** (100% free, no API key needed)
- Red marker pins for each school
- Popup windows showing school details on marker click
- Toggle between table and map view
- Zoom and pan functionality

## Technologies Used

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **Bootstrap 5** - UI framework
- **Bootstrap Icons** - Icon library
- **React Toastify** - Toast notifications
- **Leaflet + React Leaflet** - Free maps with OpenStreetMap

## Authentication

The application uses JWT token-based authentication:
- Token stored in localStorage
- Automatic token injection in API requests
- Auto-redirect on 401 unauthorized responses
- Protected routes based on user roles

## Notes

- Make sure the backend API is running before starting the frontend
- Maps are provided by OpenStreetMap - completely free, no API key required
- The theme uses CSS custom properties for easy color customization
- All API calls include error handling with toast notifications
