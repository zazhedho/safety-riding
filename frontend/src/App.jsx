import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/schools/SchoolList';
import SchoolForm from './pages/schools/SchoolForm';
import SchoolDetail from './pages/schools/SchoolDetail';
import SchoolEducationStats from './pages/schools/SchoolEducationStats';
import EventList from './pages/events/EventList';
import EventForm from './pages/events/EventForm';
import EventDetail from './pages/events/EventDetail';
import AccidentList from './pages/accidents/AccidentList';
import AccidentForm from './pages/accidents/AccidentForm';
import AccidentDetail from './pages/accidents/AccidentDetail';
import BudgetList from './pages/budgets/BudgetList';
import BudgetForm from './pages/budgets/BudgetForm';
import UserList from './pages/users/UserList';
import UserForm from './pages/users/UserForm';
import Profile from './pages/users/Profile';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/theme.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <SchoolList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/education-stats"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <SchoolEducationStats />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/new"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <SchoolForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/:id"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <SchoolDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/:id/edit"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <SchoolForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <EventList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/new"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <EventForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <EventDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <EventForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <AccidentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents/new"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <AccidentForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents/:id"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <AccidentDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents/:id/edit"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <AccidentForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <BudgetList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets/new"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <BudgetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets/:id/edit"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <BudgetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/new"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute roles={['admin']}>
                <UserForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={['admin', 'staff', 'viewer']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <h1 style={{ color: '#6a9ae0', fontSize: '4rem' }}>403</h1>
                  <h3>Unauthorized Access</h3>
                  <p className="text-muted">You don't have permission to access this page.</p>
                  <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
                </div>
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <h1 style={{ color: '#6a9ae0', fontSize: '4rem' }}>404</h1>
                  <h3>Page Not Found</h3>
                  <p className="text-muted">The page you're looking for doesn't exist.</p>
                  <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
                </div>
              </div>
            }
          />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
