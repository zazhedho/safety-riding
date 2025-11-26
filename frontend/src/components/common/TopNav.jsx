import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import schoolService from '../../services/schoolService';
import eventService from '../../services/eventService';
import accidentService from '../../services/accidentService';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const TopNav = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ schools: [], events: [], accidents: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Search functionality with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ schools: [], events: [], accidents: [] });
      setShowResults(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      const [schoolsRes, eventsRes, accidentsRes] = await Promise.all([
        schoolService.getAll({ search: query, limit: 5 }).catch(() => ({ data: { data: [] } })),
        eventService.getAll({ search: query, limit: 5 }).catch(() => ({ data: { data: [] } })),
        accidentService.getAll({ search: query, limit: 5 }).catch(() => ({ data: { data: [] } }))
      ]);

      setSearchResults({
        schools: schoolsRes.data.data || [],
        events: eventsRes.data.data || [],
        accidents: accidentsRes.data.data || []
      });
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ schools: [], events: [], accidents: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleResultClick = (type, id) => {
    navigate(`/${type}/${id}`);
    setShowSearchBar(false);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleCloseSearch = () => {
    setShowSearchBar(false);
    setSearchQuery('');
    setShowResults(false);
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: t('common.dashboard'), path: '/dashboard' }];

    let currentPath = '';
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip UUID segments (detail/edit pages)
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        return;
      }

      // Format label
      let label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Handle special cases
      if (segment === 'new') label = t('common.create');
      if (segment === 'edit') label = t('common.edit');
      // TODO: Add more specific translations for breadcrumbs if needed

      breadcrumbs.push({ label, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get page title from last breadcrumb
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || t('common.dashboard');

  const handleMobileToggle = () => {
    if (typeof onToggleMobileMenu === 'function') {
      onToggleMobileMenu();
    }
  };

  const showMobileToggle = typeof onToggleMobileMenu === 'function';

  return (
    <div className="modern-topnav">
      <div className="topnav-container">
        <div className="topnav-main">
          {showMobileToggle && (
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={handleMobileToggle}
              aria-label={isMobileMenuOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
            >
              <i className={`bi ${isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
            </button>
          )}

          {/* Left Section - Breadcrumbs & Title */}
          <div className="topnav-left">
            <h4 className="page-title">{pageTitle}</h4>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                {breadcrumbs.map((crumb, index) => (
                  <li
                    key={crumb.path}
                    className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                  >
                    {index === breadcrumbs.length - 1 ? (
                      <span>{crumb.label}</span>
                    ) : (
                      <Link to={crumb.path}>{crumb.label}</Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="topnav-right">
          {/* Language Switcher */}
          <div className="me-2">
            <LanguageSwitcher />
          </div>

          {/* Search Button */}
          <button
            className="topnav-icon-btn"
            onClick={() => setShowSearchBar(!showSearchBar)}
            title={t('common.search')}
          >
            <i className="bi bi-search"></i>
          </button>

          {/* User Profile */}
          <div className="topnav-user">
            <div className="user-info">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role?.toUpperCase() || 'GUEST'}</span>
            </div>
            <div className="dropdown">
              <button
                className="user-avatar-btn"
                type="button"
                id="userMenuDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <div className="user-avatar">
                  <i className="bi bi-person-fill"></i>
                </div>
                <i className="bi bi-chevron-down ms-2"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end modern-dropdown" aria-labelledby="userMenuDropdown">
                <li className="dropdown-header">
                  <div className="d-flex align-items-center">
                    <div className="user-avatar-large me-3">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <div>
                      <div className="fw-bold">{user?.name || 'User'}</div>
                      <small className="text-muted">{user?.email || ''}</small>
                    </div>
                  </div>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-person-circle me-2"></i>{t('topnav.myProfile')}
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/profile">
                    <i className="bi bi-gear me-2"></i>{t('topnav.settings')}
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>{t('topnav.logout')}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {showSearchBar && (
        <div className="topnav-search-expanded" ref={searchRef}>
          <div className="search-input-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="text"
              className="form-control"
              placeholder={t('topnav.searchPlaceholder')}
              autoFocus
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {isSearching && (
              <div className="search-loading">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">{t('topnav.searching')}</span>
                </div>
              </div>
            )}
            <button
              className="btn-close-search"
              onClick={handleCloseSearch}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Search Results */}
          {showResults && (searchResults.schools.length > 0 || searchResults.events.length > 0 || searchResults.accidents.length > 0) && (
            <div className="search-results">
              {/* Schools */}
              {searchResults.schools.length > 0 && (
                <div className="search-category">
                  <div className="search-category-header">
                    <i className="bi bi-building me-2"></i>
                    {t('topnav.schools')} ({searchResults.schools.length})
                  </div>
                  {searchResults.schools.map(school => (
                    <div
                      key={school.id}
                      className="search-result-item"
                      onClick={() => handleResultClick('schools', school.id)}
                    >
                      <div className="search-result-icon">
                        <i className="bi bi-building"></i>
                      </div>
                      <div className="search-result-content">
                        <div className="search-result-title">{school.name}</div>
                        <div className="search-result-subtitle">
                          {school.npsn && `NPSN: ${school.npsn}`}
                          {school.district_name && ` • ${school.district_name}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Events */}
              {searchResults.events.length > 0 && (
                <div className="search-category">
                  <div className="search-category-header">
                    <i className="bi bi-calendar-event me-2"></i>
                    {t('topnav.events')} ({searchResults.events.length})
                  </div>
                  {searchResults.events.map(event => (
                    <div
                      key={event.id}
                      className="search-result-item"
                      onClick={() => handleResultClick('events', event.id)}
                    >
                      <div className="search-result-icon">
                        <i className="bi bi-calendar-event"></i>
                      </div>
                      <div className="search-result-content">
                        <div className="search-result-title">{event.title}</div>
                        <div className="search-result-subtitle">
                          {event.event_date && new Date(event.event_date).toLocaleDateString()}
                          {event.school?.name && ` • ${event.school.name}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Accidents */}
              {searchResults.accidents.length > 0 && (
                <div className="search-category">
                  <div className="search-category-header">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {t('topnav.accidents')} ({searchResults.accidents.length})
                  </div>
                  {searchResults.accidents.map(accident => (
                    <div
                      key={accident.id}
                      className="search-result-item"
                      onClick={() => handleResultClick('accidents', accident.id)}
                    >
                      <div className="search-result-icon">
                        <i className="bi bi-exclamation-triangle"></i>
                      </div>
                      <div className="search-result-content">
                        <div className="search-result-title">
                          {accident.victim_name || 'Accident Record'}
                        </div>
                        <div className="search-result-subtitle">
                          {accident.accident_date && new Date(accident.accident_date).toLocaleDateString()}
                          {accident.location && ` • ${accident.location}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {showResults && searchQuery.length >= 2 &&
            searchResults.schools.length === 0 &&
            searchResults.events.length === 0 &&
            searchResults.accidents.length === 0 &&
            !isSearching && (
              <div className="search-no-results">
                <i className="bi bi-inbox"></i>
                <p>{t('topnav.noResults')} "{searchQuery}"</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default TopNav;
