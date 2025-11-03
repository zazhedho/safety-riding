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
import RoleList from './pages/roles/RoleList';
import RoleForm from './pages/roles/RoleForm';
import MenuList from './pages/menus/MenuList';
import MenuForm from './pages/menus/MenuForm';
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
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools"
            element={
              <ProtectedRoute>
                <SchoolList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/education-stats"
            element={
              <ProtectedRoute>
                <SchoolEducationStats />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/new"
            element={
              <ProtectedRoute>
                <SchoolForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/:id"
            element={
              <ProtectedRoute>
                <SchoolDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schools/:id/edit"
            element={
              <ProtectedRoute>
                <SchoolForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <EventList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/new"
            element={
              <ProtectedRoute>
                <EventForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <EventDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id/edit"
            element={
              <ProtectedRoute>
                <EventForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents"
            element={
              <ProtectedRoute>
                <AccidentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents/new"
            element={
              <ProtectedRoute>
                <AccidentForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents/:id"
            element={
              <ProtectedRoute>
                <AccidentDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/accidents/:id/edit"
            element={
              <ProtectedRoute>
                <AccidentForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <BudgetList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets/new"
            element={
              <ProtectedRoute>
                <BudgetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets/:id/edit"
            element={
              <ProtectedRoute>
                <BudgetForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/new"
            element={
              <ProtectedRoute>
                <UserForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users/:id/edit"
            element={
              <ProtectedRoute>
                <UserForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <RoleList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles/new"
            element={
              <ProtectedRoute>
                <RoleForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles/:id/edit"
            element={
              <ProtectedRoute>
                <RoleForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menus"
            element={
              <ProtectedRoute>
                <MenuList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menus/new"
            element={
              <ProtectedRoute>
                <MenuForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/menus/:id/edit"
            element={
              <ProtectedRoute>
                <MenuForm />
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
