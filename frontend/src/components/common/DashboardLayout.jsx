import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import TopNav from './TopNav';
import menuService from '../../services/menuService';

// Helper function to build hierarchical menu structure
const buildMenuHierarchy = (flatMenus) => {
  const menuMap = {};
  const rootMenus = [];

  // First pass: create a map of all menus
  flatMenus.forEach(menu => {
    menuMap[menu.id || menu.name] = { ...menu, children: [] };
  });

  // Second pass: build hierarchy
  flatMenus.forEach(menu => {
    const menuItem = menuMap[menu.id || menu.name];
    if (menu.parentId && menuMap[menu.parentId]) {
      menuMap[menu.parentId].children.push(menuItem);
    } else if (!menu.parentId) {
      rootMenus.push(menuItem);
    }
  });

  // Sort by orderIndex
  const sortMenus = (menus) => {
    menus.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    menus.forEach(menu => {
      if (menu.children && menu.children.length > 0) {
        sortMenus(menu.children);
      }
    });
    return menus;
  };

  return sortMenus(rootMenus);
};

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [userToggledMenus, setUserToggledMenus] = useState({});
  const menuLoadedRef = useRef(false);
  const sidebarRef = useRef(null);

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

  // Fetch user menus - only once when user is available
  useEffect(() => {
    const fetchMenus = async () => {
      // Skip if already loaded
      if (menuLoadedRef.current) {
        return;
      }

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
          menuLoadedRef.current = true;
          return;
        }

        // Transform API menu format to component format with hierarchy support
        const transformedMenus = menus.map(menu => ({
          id: menu.id,
          path: menu.path,
          label: menu.display_name,
          icon: menu.icon || 'bi-circle',
          name: menu.name,
          parentId: menu.parent_id || null,
          orderIndex: menu.order_index || 0,
        }));

        // Build hierarchical menu structure
        const hierarchicalMenus = buildMenuHierarchy(transformedMenus);
        console.log('Hierarchical menus:', hierarchicalMenus);
        setMenuItems(hierarchicalMenus);
        menuLoadedRef.current = true;
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
        menuLoadedRef.current = true;
      }
    };

    if (user && !menuLoadedRef.current) {
      fetchMenus();
    }
  }, [user]);

  const getFallbackMenus = (role) => {
    const baseMenus = [
      { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2', name: 'dashboard', children: [] },
      { path: '/profile', label: 'Profile', icon: 'bi-person-circle', name: 'profile', children: [] },
      { path: '/schools', label: 'Schools', icon: 'bi-building', name: 'schools', children: [] },
      {
        path: null,
        label: 'Education',
        icon: 'bi-mortarboard',
        name: 'education',
        children: [
          { path: '/education/stats', label: 'Education Stats', icon: 'bi-bar-chart', name: 'education_stats', children: [] },
          { path: '/education/priority', label: 'Education Priority', icon: 'bi-grid-3x3-gap', name: 'education_priority', children: [] },
        ]
      },
      { path: '/publics', label: 'Public Entities', icon: 'bi-people', name: 'publics', children: [] },
      { path: '/events', label: 'Events', icon: 'bi-calendar-event', name: 'events', children: [] },
      { path: '/accidents', label: 'Accidents', icon: 'bi-exclamation-triangle', name: 'accidents', children: [] },
      { path: '/budgets', label: 'Budgets', icon: 'bi-cash-stack', name: 'budgets', children: [] },
      { path: '/marketshare', label: 'Market Share', icon: 'bi-graph-up-arrow', name: 'market_shares', children: [] },
    ];

    if (role === 'admin' || role === 'superadmin') {
      return [
        ...baseMenus,
        { path: '/users', label: 'Users', icon: 'bi-people-fill', name: 'users', children: [] },
        { path: '/roles', label: 'Roles', icon: 'bi-shield-lock', name: 'roles', children: [] },
        { path: '/menus', label: 'Menus', icon: 'bi-list', name: 'menus', children: [] },
      ];
    }

    return baseMenus;
  };

  const toggleSubmenu = (menuName) => {
    setExpandedMenus(prev => {
      const newState = !prev[menuName];
      return {
        ...prev,
        [menuName]: newState
      };
    });
    // Mark that user has manually toggled this menu
    setUserToggledMenus(prev => ({
      ...prev,
      [menuName]: true
    }));
  };

  const isMenuActive = (item) => {
    const currentPath = location.pathname;

    // Exact match
    if (currentPath === item.path) return true;

    // Check if any child is active
    if (item.children && item.children.length > 0) {
      return item.children.some(child => currentPath === child.path || currentPath.startsWith(child.path + '/'));
    }

    // For parent routes with UUID patterns
    if (item.path) {
      const baseRoute = item.path.split('/')[1];
      if (baseRoute) {
        return currentPath === `/${baseRoute}/new` ||
               currentPath.match(new RegExp(`^/${baseRoute}/[a-f0-9-]{36}`)) !== null;
      }
    }

    return false;
  };

  const renderMenuItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isMenuActive(item);

    // Determine if menu should be expanded
    let isExpanded = false;
    if (hasChildren) {
      const hasActiveChild = item.children.some(child => isMenuActive(child));
      // If user has manually toggled, respect their choice
      // Otherwise, auto-expand if child is active
      if (userToggledMenus[item.name]) {
        isExpanded = expandedMenus[item.name];
      } else {
        isExpanded = hasActiveChild;
      }
    }

    if (hasChildren) {
      return (
        <div key={item.name} className="sidebar-menu-parent">
          <div
            className={`sidebar-menu-item sidebar-menu-toggle ${isActive ? 'active' : ''}`}
            onClick={() => toggleSubmenu(item.name)}
            title={item.label}
            style={{ cursor: 'pointer' }}
          >
            <i className={`bi ${item.icon}`}></i>
            <span className="menu-label">{item.label}</span>
            <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} submenu-arrow`}></i>
          </div>
          {isExpanded && (
            <div className="sidebar-submenu">
              {item.children.map(child => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`sidebar-menu-item sidebar-submenu-item ${isMenuActive(child) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                  title={child.label}
                >
                  <i className={`bi ${child.icon}`}></i>
                  <span className="menu-label">{child.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
        onClick={closeMobileMenu}
        title={item.label}
      >
        <i className={`bi ${item.icon}`}></i>
        <span className="menu-label">{item.label}</span>
      </Link>
    );
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

      <div className="sidebar" ref={sidebarRef}>
        <div className="sidebar-header">
          <img src="/astra-motor.png" alt="Astra Motor Logo" style={{ width: '150px', marginBottom: '10px' }} className="sidebar-logo" />
                      <h3 className="sidebar-title">Promotion & Safety Riding</h3>          <small className="sidebar-subtitle">Management System</small>
        </div>
        <div className="sidebar-menu">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </div>

      <div className="main-content">
        <TopNav
          onToggleMobileMenu={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        <div className="content-area">
          {children || <Outlet />}
        </div>
      </div>
      <div id="root-portal"></div>
    </div>
  );
};

export default DashboardLayout;
