import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedLayout from './components/common/ProtectedLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/schools/SchoolList';
import SchoolForm from './pages/schools/SchoolForm';
import SchoolDetail from './pages/schools/SchoolDetail';
import EducationStats from './pages/schools/EducationStats';
import EducationPriority from './pages/schools/EducationPriority';
import PublicList from './pages/publics/PublicList';
import PublicForm from './pages/publics/PublicForm';
import PublicDetail from './pages/publics/PublicDetail';
import EventList from './pages/events/EventList';
import EventForm from './pages/events/EventForm';
import EventDetail from './pages/events/EventDetail';
import AccidentList from './pages/accidents/AccidentList';
import AccidentForm from './pages/accidents/AccidentForm';
import AccidentDetail from './pages/accidents/AccidentDetail';
import BudgetList from './pages/budgets/BudgetList';
import BudgetForm from './pages/budgets/BudgetForm';
import BudgetDetail from './pages/budgets/BudgetDetail';
import MarketShareList from './pages/marketshare/MarketShareList';
import MarketShareForm from './pages/marketshare/MarketShareForm';
import MarketShareDetail from './pages/marketshare/MarketShareDetail';
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
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
