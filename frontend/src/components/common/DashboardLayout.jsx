import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import TopNav from './TopNav';
import menuService from '../../services/menuService';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);

  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu clicked. Current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
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

  // Fetch user menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        console.log('Fetching menus for user:', user);
        const response = await menuService.getUserMenus();
        console.log('Menus response:', response);
        const menus = response.data.data || [];

        if (menus.length === 0) {
          console.warn('No menus returned from API, using fallback based on role');
          // Fallback based on user role
          const fallbackMenus = getFallbackMenus(user?.role);
          setMenuItems(fallbackMenus);
          return;
        }

        // Transform API menu format to component format
        const transformedMenus = menus.map(menu => ({
          path: menu.path,
          label: menu.display_name,
          icon: menu.icon || 'bi-circle',
          name: menu.name,
        }));
        console.log('Transformed menus:', transformedMenus);
        setMenuItems(transformedMenus);
      } catch (error) {
        console.error('Failed to fetch menus:', error);
        console.error('Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        // Fallback to role-based menu if API fails
        const fallbackMenus = getFallbackMenus(user?.role);
        console.log('Using fallback menus:', fallbackMenus);
        setMenuItems(fallbackMenus);
      }
    };

    if (user) {
      fetchMenus();
    }
  }, [user]);

  const getFallbackMenus = (role) => {
    const baseMenus = [
      { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', name: 'dashboard' },
      { path: '/profile', label: 'Profile', icon: 'bi-person-circle', name: 'profile' },
      { path: '/schools', label: 'Schools', icon: 'bi-building', name: 'schools' },
      { path: '/schools/education-stats', label: 'Education Stats', icon: 'bi-bar-chart', name: 'education_stats' },
      { path: '/events', label: 'Events', icon: 'bi-calendar-event', name: 'events' },
      { path: '/accidents', label: 'Accidents', icon: 'bi-exclamation-triangle', name: 'accidents' },
      { path: '/budgets', label: 'Budgets', icon: 'bi-cash-stack', name: 'budgets' },
      { path: '/marketshare', label: 'Market Share', icon: 'bi-graph-up-arrow', name: 'market_shares' },
    ];

    if (role === 'admin') {
      return [
        ...baseMenus,
        { path: '/users', label: 'Users', icon: 'bi-people', name: 'users' },
        { path: '/roles', label: 'Roles', icon: 'bi-shield-lock', name: 'roles' },
      ];
    }

    return baseMenus;
  };

  return (
    <div className={`layout-wrapper ${isMobileMenuOpen ? 'sidebar-open' : ''} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ThemeSwitcher />

      {/* Desktop Sidebar Toggle Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${isSidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </button>

      {/* Mobile Overlay */}
      <div
        className="sidebar-overlay"
        onClick={closeMobileMenu}
      ></div>

      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/astra-motor.png" alt="Astra Motor Logo" style={{ width: '150px', marginBottom: '10px' }} className="sidebar-logo" />
          <h3 className="sidebar-title">Safety Riding</h3>
          <small className="sidebar-subtitle">Management System</small>
        </div>
        <div className="sidebar-menu">
          {menuItems.map(item => {
            // Helper function to check if menu item should be active
            const isMenuActive = () => {
              const currentPath = location.pathname;

              // Exact match
              if (currentPath === item.path) return true;

              // For /schools menu, activate on /schools/new or /schools/:id (detail/edit), but NOT on /schools/education-stats
              if (item.name === 'schools' || item.path === '/schools') {
                return (currentPath === '/schools/new' || currentPath.match(/^\/schools\/[a-f0-9-]{36}/) !== null);
              }

              // For other parent routes, activate on /new or child routes with UUID (detail/edit pages)
              if (item.path.startsWith('/events') || item.path.startsWith('/accidents') ||
                  item.path.startsWith('/budgets') || item.path.startsWith('/users') ||
                  item.path.startsWith('/roles')) {
                const baseRoute = item.path.split('/')[1]; // Get 'events', 'accidents', etc.
                return currentPath === `/${baseRoute}/new` || currentPath.match(new RegExp(`^/${baseRoute}/[a-f0-9-]{36}`)) !== null;
              }

              return false;
            };

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-menu-item ${isMenuActive() ? 'active' : ''}`}
                onClick={closeMobileMenu}
                title={item.label}
              >
                <i className={`bi ${item.icon}`}></i>
                <span className="menu-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="main-content">
        <TopNav
          onToggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="content-area">
          {children}
        </div>
      </div>
      <div id="root-portal"></div>
    </div>
  );
};

export default DashboardLayout;
