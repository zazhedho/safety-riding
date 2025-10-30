# Workshop Management Dashboard

A modern React.js dashboard for the Workshop Management System with Bootstrap styling.

## Features

- **Authentication**: Login/Register with JWT tokens
- **Dashboard**: Overview with statistics and recent bookings
- **User Management**: View and manage users (Admin/Cashier only)
- **Vehicle Management**: CRUD operations for vehicles
- **Service Management**: CRUD operations for services (Admin only)
- **Booking Management**: Create and manage bookings with status updates
- **Profile Management**: Update user profile information
- **Responsive Design**: Mobile-friendly interface
- **Role-based Access Control**: Different permissions for different user roles

## User Roles

- **Admin**: Full access to all features
- **Cashier**: Can view users and update booking status
- **Customer**: Can manage their own vehicles and create bookings
- **Mechanic**: Basic access (can be extended)

## Tech Stack

- React.js 18
- React Router DOM
- React Bootstrap
- Axios for API calls
- FontAwesome icons
- Vite build tool

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Update the `VITE_API_URL` in `.env` to match your backend API URL.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## API Integration

The dashboard integrates with the Go backend API with the following endpoints:

- `POST /user/register` - User registration
- `POST /user/login` - User login
- `POST /user/logout` - User logout
- `GET /user` - Get current user profile
- `PUT /user` - Update user profile
- `GET /users` - Get all users (Admin/Cashier)
- `GET /vehicles` - Get vehicles
- `POST /vehicle` - Create vehicle
- `PUT /vehicle/:id` - Update vehicle
- `DELETE /vehicle/:id` - Delete vehicle
- `GET /services` - Get services
- `POST /service` - Create service (Admin)
- `PUT /service/:id` - Update service (Admin)
- `DELETE /service/:id` - Delete service (Admin)
- `GET /bookings` - Get bookings
- `POST /booking` - Create booking
- `PUT /booking/:id/status` - Update booking status

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Header.jsx
│   ├── Layout.jsx
│   ├── ProtectedRoute.jsx
│   └── Sidebar.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── pages/              # Page components
│   ├── Bookings.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Profile.jsx
│   ├── Register.jsx
│   ├── Services.jsx
│   ├── Users.jsx
│   └── Vehicles.jsx
├── services/           # API services
│   └── api.js
├── App.jsx
├── main.jsx
└── index.css
```

## Features by Role

### Admin
- Full dashboard access
- User management
- Vehicle CRUD operations
- Service CRUD operations
- Booking management and status updates
- Profile management

### Cashier
- Dashboard access
- View users
- View vehicles and services
- Booking status updates
- Profile management

### Customer
- Dashboard access
- Vehicle CRUD operations (own vehicles)
- View services
- Create bookings
- Profile management

## Styling

The dashboard uses a modern design with:
- Gradient backgrounds
- Card-based layouts
- Hover effects and animations
- Responsive design
- Bootstrap components
- FontAwesome icons
- Custom CSS for enhanced UI/UX

## Environment Variables

- `VITE_API_URL`: Backend API base URL (default: http://localhost:8080/api)