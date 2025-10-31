import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu clicked. Current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    console.log('Closing mobile menu');
    setIsMobileMenuOpen(false);
  };

  // Debug: Log when menu state changes
  useEffect(() => {
    console.log('Mobile menu state changed:', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-menu-toggle')) {
        closeMobileMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', roles: ['admin', 'staff', 'viewer'] },
    { path: '/profile', label: 'Profile', icon: 'bi-person-circle', roles: ['admin', 'staff', 'viewer'] },
    { path: '/schools', label: 'Schools', icon: 'bi-building', roles: ['admin', 'staff', 'viewer'] },
    { path: '/events', label: 'Events', icon: 'bi-calendar-event', roles: ['admin', 'staff', 'viewer'] },
    { path: '/accidents', label: 'Accidents', icon: 'bi-exclamation-triangle', roles: ['admin', 'staff', 'viewer'] },
    { path: '/budgets', label: 'Budgets', icon: 'bi-cash-stack', roles: ['admin', 'staff', 'viewer'] },
    { path: '/users', label: 'Users', icon: 'bi-people', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item =>
    !item.roles || (user && user.role && item.roles.includes(user.role))
  );

  return (
    <div className={`layout-wrapper ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Menu Toggle Button */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
      </button>

      {/* Mobile Overlay */}
      <div
        className="sidebar-overlay"
        onClick={closeMobileMenu}
      ></div>

      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/astra-motor.png" alt="Astra Motor Logo" style={{ width: '150px', marginBottom: '10px' }} />
          <h3>Safety Riding</h3>
          <small>Management System</small>
        </div>
        <div className="sidebar-menu">
          {filteredMenu.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-menu-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="top-nav">
          <h5 className="mb-0">Welcome, {user?.name || 'User'} !</h5>
          <div className="top-nav-user d-flex align-items-center">
            {user?.role && <span className="badge badge-red me-3">{user.role.toUpperCase()}</span>}
            <div className="dropdown">
              <button
                className="btn btn-outline-danger btn-sm dropdown-toggle"
                type="button"
                id="userMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle me-2"></i>
                {user?.name || 'User'}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-pencil-square me-2"></i>Edit Profile
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </button>
                </li>
              </ul>
            </div>
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
