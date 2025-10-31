# Safety Riding Frontend - Complete Structure Guide

## ✅ Already Created

### API Services (`src/services/`)
- ✅ `api.js` - Base Axios configuration with interceptors
- ✅ `authService.js` - Authentication service
- ✅ `schoolService.js` - Schools CRUD operations
- ✅ `eventService.js` - Events and photos management
- ✅ `accidentService.js` - Accidents management
- ✅ `budgetService.js` - Budget with aggregations
- ✅ `locationService.js` - Provinces, cities, districts

### Contexts
- ✅ `AuthContext.jsx` - Authentication state management

### Common Components
- ✅ `ProtectedRoute.jsx` - Route protection with role-based access

### Styles
- ✅ `theme.css` - White-Red theme for dashboard

### Packages Installed
- ✅ @react-google-maps/api
- ✅ react-toastify
- ✅ axios, react-router-dom, react-bootstrap

## 📝 Files to Create

### 1. Dashboard Layout (`src/components/common/DashboardLayout.jsx`)
```jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/theme.css';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: 'fa-home', label: 'Dashboard', roles: ['admin', 'staff'] },
    { path: '/schools', icon: 'fa-school', label: 'Schools', roles: ['admin', 'staff'] },
    { path: '/events', icon: 'fa-calendar', label: 'Events', roles: ['admin', 'staff'] },
    { path: '/accidents', icon: 'fa-car-crash', label: 'Accidents', roles: ['admin', 'staff'] },
    { path: '/budgets', icon: 'fa-money-bill', label: 'Budgets', roles: ['admin', 'staff'] },
    { path: '/users', icon: 'fa-users', label: 'Users', roles: ['admin'] },
  ];

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3><i className="fas fa-motorcycle"></i> Safety Riding</h3>
          <small>Dashboard Management</small>
        </div>
        <div className="sidebar-menu">
          {menuItems.map((item) => (
            (!item.roles || (user && item.roles.includes(user.role))) && (
              <Link
                key={item.path}
                to={item.path}
                className={\`sidebar-menu-item \${location.pathname === item.path ? 'active' : ''}\`}
              >
                <i className={\`fas \${item.icon}\`}></i>
                <span>{item.label}</span>
              </Link>
            )
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <div>
            <h5 className="mb-0">Welcome, {user?.name || user?.username}</h5>
            <small className="text-muted">Role: {user?.role}</small>
          </div>
          <div className="top-nav-user">
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
```

### 2. Login Page (`src/pages/auth/Login.jsx`)
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/user/login', { username, password });
      await login(response.data.data.user, response.data.data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="card" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h3><i className="fas fa-motorcycle"></i> Safety Riding</h3>
            <p className="text-muted">Login to Dashboard</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

### 3. Dashboard Home (`src/pages/Dashboard.jsx`)
```jsx
import { useState, useEffect } from 'react';
import DashboardLayout from '../components/common/DashboardLayout';
import schoolService from '../services/schoolService';
import eventService from '../services/eventService';
import accidentService from '../services/accidentService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    events: 0,
    accidents: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [schools, events, accidents] = await Promise.all([
        schoolService.getAll({ limit: 1 }),
        eventService.getAll({ limit: 1 }),
        accidentService.getAll({ limit: 1 }),
      ]);

      setStats({
        schools: schools.data.pagination?.total || 0,
        events: events.data.pagination?.total || 0,
        accidents: accidents.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <h2 className="mb-4">Dashboard Overview</h2>

      <div className="row">
        <div className="col-md-4">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Total Schools</h6>
                <div className="stats-number">{stats.schools}</div>
              </div>
              <i className="fas fa-school fa-3x text-danger opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Total Events</h6>
                <div className="stats-number">{stats.events}</div>
              </div>
              <i className="fas fa-calendar fa-3x text-danger opacity-50"></i>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-2">Total Accidents</h6>
                <div className="stats-number">{stats.accidents}</div>
              </div>
              <i className="fas fa-car-crash fa-3x text-danger opacity-50"></i>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
```

### 4. Schools Page with Google Maps (`src/pages/schools/SchoolList.jsx`)
```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import SchoolMap from '../../components/maps/SchoolMap';
import schoolService from '../../services/schoolService';
import { toast } from 'react-toastify';

const SchoolList = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSchools();
  }, [search]);

  const loadSchools = async () => {
    try {
      const response = await schoolService.getAll({ search, limit: 50 });
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await schoolService.delete(id);
        toast.success('School deleted successfully');
        loadSchools();
      } catch (error) {
        toast.error('Failed to delete school');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Schools Management</h2>
        <div>
          <button
            className="btn btn-outline-primary me-2"
            onClick={() => setShowMap(!showMap)}
          >
            <i className={\`fas fa-\${showMap ? 'list' : 'map'}\`}></i>
            {showMap ? ' List View' : ' Map View'}
          </button>
          <Link to="/schools/new" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add School
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <input
            type="text"
            className="form-control"
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="card-body">
          {showMap ? (
            <SchoolMap schools={schools} />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>NPSN</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                  ) : schools.length === 0 ? (
                    <tr><td colSpan="6" className="text-center">No schools found</td></tr>
                  ) : (
                    schools.map((school) => (
                      <tr key={school.id}>
                        <td>{school.name}</td>
                        <td>{school.npsn}</td>
                        <td>{school.address}</td>
                        <td>{school.phone}</td>
                        <td>{school.student_count}</td>
                        <td>
                          <Link
                            to={\`/schools/\${school.id}\`}
                            className="btn btn-sm btn-outline-primary me-2"
                          >
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            to={\`/schools/edit/\${school.id}\`}
                            className="btn btn-sm btn-outline-warning me-2"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(school.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolList;
```

### 5. Google Maps Component (`src/components/maps/SchoolMap.jsx`)
```jsx
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';

const SchoolMap = ({ schools }) => {
  const [selectedSchool, setSelectedSchool] = useState(null);

  const mapStyles = {
    height: '600px',
    width: '100%'
  };

  const defaultCenter = {
    lat: -2.5489, // Indonesia center
    lng: 118.0149
  };

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={5}
        center={defaultCenter}
      >
        {schools.map((school) => (
          school.latitude && school.longitude && (
            <Marker
              key={school.id}
              position={{
                lat: parseFloat(school.latitude),
                lng: parseFloat(school.longitude)
              }}
              onClick={() => setSelectedSchool(school)}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }}
            />
          )
        ))}

        {selectedSchool && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedSchool.latitude),
              lng: parseFloat(selectedSchool.longitude)
            }}
            onCloseClick={() => setSelectedSchool(null)}
          >
            <div style={{ padding: '10px' }}>
              <h6 className="mb-2">{selectedSchool.name}</h6>
              <p className="mb-1"><small><strong>NPSN:</strong> {selectedSchool.npsn}</small></p>
              <p className="mb-1"><small><strong>Address:</strong> {selectedSchool.address}</small></p>
              <p className="mb-0"><small><strong>Students:</strong> {selectedSchool.student_count}</small></p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default SchoolMap;
```

### 6. Main App Routes (`src/App.jsx`)
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/schools/SchoolList';
// Import other pages...

import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/theme.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/schools" element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <SchoolList />
            </ProtectedRoute>
          } />

          {/* Add more routes for Events, Accidents, Budgets, etc. */}
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
```

### 7. Environment Variables (`.env`)
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 📦 Additional Pages Needed

You'll need to create similar CRUD pages for:
- **Events** (`src/pages/events/`) - EventList, EventForm, EventDetail
- **Accidents** (`src/pages/accidents/`) - AccidentList, AccidentForm
- **Budgets** (`src/pages/budgets/`) - BudgetList, BudgetSummary, BudgetForm
- **Users** (`src/pages/users/`) - UserList, UserForm

## 🎨 Theme Colors
- Primary Red: #dc3545
- Dark Red: #c82333
- Light Red: #f8d7da
- White backgrounds with red accents

## 🔐 Role-Based Access
- **Admin**: Full access to all features
- **Staff**: Access to schools, events, accidents, budgets (no user management)

## 🗺️ Google Maps Setup
1. Get API key from Google Cloud Console
2. Enable Maps JavaScript API
3. Add key to `.env` file

## 🚀 Running the Application
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173
