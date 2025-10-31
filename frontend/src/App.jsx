import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/schools/SchoolList';
import EventList from './pages/events/EventList';
import AccidentList from './pages/accidents/AccidentList';
import BudgetList from './pages/budgets/BudgetList';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/theme.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <SchoolList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <EventList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <AccidentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <ProtectedRoute roles={['admin']}>
                <BudgetList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <h1 className="text-danger">403</h1>
                  <h3>Unauthorized Access</h3>
                  <p className="text-muted">You don't have permission to access this page.</p>
                  <a href="/dashboard" className="btn btn-danger">Go to Dashboard</a>
                </div>
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <h1 className="text-danger">404</h1>
                  <h3>Page Not Found</h3>
                  <p className="text-muted">The page you're looking for doesn't exist.</p>
                  <a href="/dashboard" className="btn btn-danger">Go to Dashboard</a>
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
