import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedLayout from './components/common/ProtectedLayout';
import Loading from './components/common/Loading';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/theme.css';

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Schools
const SchoolList = lazy(() => import('./pages/schools/SchoolList'));
const SchoolForm = lazy(() => import('./pages/schools/SchoolForm'));
const SchoolDetail = lazy(() => import('./pages/schools/SchoolDetail'));
const EducationStats = lazy(() => import('./pages/schools/EducationStats'));
const EducationPriority = lazy(() => import('./pages/schools/EducationPriority'));

// Publics
const PublicList = lazy(() => import('./pages/publics/PublicList'));
const PublicForm = lazy(() => import('./pages/publics/PublicForm'));
const PublicDetail = lazy(() => import('./pages/publics/PublicDetail'));

// Events
const EventList = lazy(() => import('./pages/events/EventList'));
const EventForm = lazy(() => import('./pages/events/EventForm'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));

// Accidents
const AccidentList = lazy(() => import('./pages/accidents/AccidentList'));
const AccidentForm = lazy(() => import('./pages/accidents/AccidentForm'));
const AccidentDetail = lazy(() => import('./pages/accidents/AccidentDetail'));

// Budgets
const BudgetList = lazy(() => import('./pages/budgets/BudgetList'));
const BudgetForm = lazy(() => import('./pages/budgets/BudgetForm'));
const BudgetDetail = lazy(() => import('./pages/budgets/BudgetDetail'));

// Market Share
const MarketShareList = lazy(() => import('./pages/marketshare/MarketShareList'));
const MarketShareForm = lazy(() => import('./pages/marketshare/MarketShareForm'));
const MarketShareDetail = lazy(() => import('./pages/marketshare/MarketShareDetail'));

// Users
const UserList = lazy(() => import('./pages/users/UserList'));
const UserForm = lazy(() => import('./pages/users/UserForm'));
const Profile = lazy(() => import('./pages/users/Profile'));

// Roles
const RoleList = lazy(() => import('./pages/roles/RoleList'));
const RoleForm = lazy(() => import('./pages/roles/RoleForm'));

// Menus
const MenuList = lazy(() => import('./pages/menus/MenuList'));
const MenuForm = lazy(() => import('./pages/menus/MenuForm'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected routes with shared layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Schools */}
              <Route path="/schools" element={<SchoolList />} />
              <Route path="/schools/new" element={<SchoolForm />} />
              <Route path="/schools/:id" element={<SchoolDetail />} />
              <Route path="/schools/:id/edit" element={<SchoolForm />} />

              {/* Education */}
              <Route path="/education/stats" element={<EducationStats />} />
              <Route path="/education/priority" element={<EducationPriority />} />

              {/* Public Entities */}
              <Route path="/publics" element={<PublicList />} />
              <Route path="/publics/new" element={<PublicForm />} />
              <Route path="/publics/:id" element={<PublicDetail />} />
              <Route path="/publics/:id/edit" element={<PublicForm />} />

              {/* Events */}
              <Route path="/events" element={<EventList />} />
              <Route path="/events/new" element={<EventForm />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/events/:id/edit" element={<EventForm />} />

              {/* Accidents */}
              <Route path="/accidents" element={<AccidentList />} />
              <Route path="/accidents/new" element={<AccidentForm />} />
              <Route path="/accidents/:id" element={<AccidentDetail />} />
              <Route path="/accidents/:id/edit" element={<AccidentForm />} />

              {/* Budgets */}
              <Route path="/budgets" element={<BudgetList />} />
              <Route path="/budgets/new" element={<BudgetForm />} />
              <Route path="/budgets/:id" element={<BudgetDetail />} />
              <Route path="/budgets/:id/edit" element={<BudgetForm />} />

              {/* Market Share */}
              <Route path="/marketshare" element={<MarketShareList />} />
              <Route path="/marketshare/add" element={<MarketShareForm />} />
              <Route path="/marketshare/:id" element={<MarketShareDetail />} />
              <Route path="/marketshare/:id/edit" element={<MarketShareForm />} />

              {/* Users */}
              <Route path="/users" element={<UserList />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id/edit" element={<UserForm />} />
              <Route path="/profile" element={<Profile />} />

              {/* Roles */}
              <Route path="/roles" element={<RoleList />} />
              <Route path="/roles/new" element={<RoleForm />} />
              <Route path="/roles/:id/edit" element={<RoleForm />} />

              {/* Menus */}
              <Route path="/menus" element={<MenuList />} />
              <Route path="/menus/new" element={<MenuForm />} />
              <Route path="/menus/:id/edit" element={<MenuForm />} />
            </Route>

            {/* Error pages */}
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
        </Suspense>

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
