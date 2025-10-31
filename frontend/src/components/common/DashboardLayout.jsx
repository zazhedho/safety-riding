import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['admin', 'staff'] },
    { path: '/schools', label: 'Schools', icon: 'bi-building', roles: ['admin', 'staff'] },
    { path: '/events', label: 'Events', icon: 'bi-calendar-event', roles: ['admin', 'staff'] },
    { path: '/accidents', label: 'Accidents', icon: 'bi-exclamation-triangle', roles: ['admin', 'staff'] },
    { path: '/budgets', label: 'Budgets', icon: 'bi-cash-stack', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Safety Riding</h3>
          <small>Management System</small>
        </div>
        <div className="sidebar-menu">
          {filteredMenu.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <h5 className="mb-0">Welcome, {user?.name || 'User'}</h5>
          <div className="top-nav-user">
            <span className="badge badge-red">{user?.role?.toUpperCase()}</span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>Logout
            </button>
          </div>
        </div>
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
