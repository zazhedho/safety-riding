import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import schoolService from '../services/schoolService';
import eventService from '../services/eventService';
import accidentService from '../services/accidentService';
import budgetService from '../services/budgetService';
import locationService from '../services/locationService';
import marketShareService from '../services/marketShareService';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Import chart components
import AccidentTrendsChart from '../components/charts/AccidentTrendsChart';
import EventTypeDistributionChart from '../components/charts/EventTypeDistributionChart';
import BudgetUtilizationChart from '../components/charts/BudgetUtilizationChart';
import SchoolsByProvinceChart from '../components/charts/SchoolsByProvinceChart';
import DistrictRecommendation from '../components/recommendations/DistrictRecommendation';

const Dashboard = () => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState({
    schools: 0,
    events: 0,
    accidents: 0,
    budgets: 0
  });

  // Additional statistics
  const [additionalStats, setAdditionalStats] = useState({
    totalDeaths: 0,
    totalInjured: 0,
    avgAttendeesPerEvent: 0,
    budgetUtilizationRate: 0,
    activeSchools: 0
  });

  // Data for charts
  const [allSchools, setAllSchools] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allAccidents, setAllAccidents] = useState([]);
  const [allBudgets, setAllBudgets] = useState([]);
  const [marketShareSuggestions, setMarketShareSuggestions] = useState({
    topCities: [],
    topDistricts: [],
    year: null,
    month: null
  });
  const [marketShareLoading, setMarketShareLoading] = useState(false);

  // Filtered data
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredAccidents, setFilteredAccidents] = useState([]);
  const [filteredBudgets, setFilteredBudgets] = useState([]);

  const [recentEvents, setRecentEvents] = useState([]);
  const [recentAccidents, setRecentAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    endDate: new Date()
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const formatUnits = (value) => new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(value || 0);

  const formatPercentage = (value) => `${Number(value ?? 0).toFixed(1)}%`;

  const getMonthLabel = (month) => {
    if (!month) return '';
    return new Date(0, month - 1).toLocaleString('en-US', { month: 'long' });
  };

  useEffect(() => {
    fetchProvinces();
    fetchDashboardData();
    fetchMarketShareSuggestions();
  }, []);

  const fetchMarketShareSuggestions = async () => {
    try {
      setMarketShareLoading(true);
      const now = new Date();
      const params = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        city_limit: 5,
        district_limit: 5
      };
      const response = await marketShareService.getDashboardSuggestions(params);
      const payload = response.data?.data || {};
      setMarketShareSuggestions({
        topCities: payload.top_cities || [],
        topDistricts: payload.top_districts || [],
        year: payload.year || params.year,
        month: payload.month || params.month
      });
    } catch (error) {
      console.error('Failed to load market share suggestions', error);
    } finally {
      setMarketShareLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
    } else {
      setCities([]);
      setSelectedCity('');
    }
  }, [selectedProvince]);

  useEffect(() => {
    applyFilters();
  }, [dateRange, selectedProvince, selectedCity, allEvents, allAccidents, allBudgets]);

  const fetchProvinces = async () => {
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data.data || []);
    } catch (error) {
      console.error('Failed to load provinces');
    }
  };

  const fetchCities = async (provinceCode) => {
    try {
      const response = await locationService.getCities(provinceCode);
      setCities(response.data.data || []);
    } catch (error) {
      console.error('Failed to load cities');
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch basic statistics
      const [schoolsRes, eventsRes, accidentsRes, budgetsRes] = await Promise.all([
        schoolService.getAll({ limit: 1 }),
        eventService.getAll({ limit: 1 }),
        accidentService.getAll({ limit: 1 }),
        budgetService.getAll({ limit: 1 })
      ]);

      setStats({
        schools: schoolsRes.data.total_data || 0,
        events: eventsRes.data.total_data || 0,
        accidents: accidentsRes.data.total_data || 0,
        budgets: budgetsRes.data.total_data || 0
      });

      // Fetch all data for charts (with reasonable limits)
      const [schoolsData, eventsData, accidentsData, budgetsData] = await Promise.all([
        schoolService.getAll({ limit: 10000 }),
        eventService.getAll({ limit: 10000 }),
        accidentService.getAll({ limit: 10000 }),
        budgetService.getAll({ limit: 10000 })
      ]);

      setAllSchools(schoolsData.data.data || []);
      setAllEvents(eventsData.data.data || []);
      setAllAccidents(accidentsData.data.data || []);
      setAllBudgets(budgetsData.data.data || []);

      // Fetch recent data
      const [recentEventsRes, recentAccidentsRes] = await Promise.all([
        eventService.getAll({ limit: 5, order_by: 'created_at', order_direction: 'desc' }),
        accidentService.getAll({ limit: 5, order_by: 'created_at', order_direction: 'desc' })
      ]);

      setRecentEvents(recentEventsRes.data.data || []);
      setRecentAccidents(recentAccidentsRes.data.data || []);

      // Calculate additional statistics
      calculateAdditionalStats(
        schoolsData.data.data || [],
        eventsData.data.data || [],
        accidentsData.data.data || [],
        budgetsData.data.data || []
      );

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAdditionalStats = (schools, events, accidents, budgets) => {
    // Total deaths and injured
    const totalDeaths = accidents.reduce((sum, acc) => sum + (acc.death_count || 0), 0);
    const totalInjured = accidents.reduce((sum, acc) => sum + (acc.injured_count || 0), 0);

    // Average attendees per event
    const totalAttendees = events.reduce((sum, evt) => sum + (evt.attendees_count || 0), 0);
    const avgAttendeesPerEvent = events.length > 0 ? Math.round(totalAttendees / events.length) : 0;

    // Budget utilization rate
    const totalBudgetAllocated = budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + (b.actual_spent || 0), 0);
    const budgetUtilizationRate = totalBudgetAllocated > 0
      ? Math.round((totalBudgetSpent / totalBudgetAllocated) * 100)
      : 0;

    // Active schools (schools with events in last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activeSchoolIds = new Set(
      events
        .filter(evt => new Date(evt.event_date) >= sixMonthsAgo)
        .map(evt => evt.school_id)
    );
    const activeSchools = activeSchoolIds.size;

    setAdditionalStats({
      totalDeaths,
      totalInjured,
      avgAttendeesPerEvent,
      budgetUtilizationRate,
      activeSchools
    });
  };

  const applyFilters = () => {
    let events = [...allEvents];
    let accidents = [...allAccidents];
    let budgets = [...allBudgets];

    // Date range filter
    if (dateRange.startDate && dateRange.endDate) {
      events = events.filter(evt => {
        const eventDate = new Date(evt.event_date);
        return eventDate >= dateRange.startDate && eventDate <= dateRange.endDate;
      });

      accidents = accidents.filter(acc => {
        const accidentDate = new Date(acc.accident_date);
        return accidentDate >= dateRange.startDate && accidentDate <= dateRange.endDate;
      });

      budgets = budgets.filter(budget => {
        const budgetDate = new Date(budget.budget_date);
        return budgetDate >= dateRange.startDate && budgetDate <= dateRange.endDate;
      });
    }

    // Province filter
    if (selectedProvince) {
      events = events.filter(evt => evt.school?.province_id === selectedProvince);
      accidents = accidents.filter(acc => acc.province_id === selectedProvince);
    }

    // City filter
    if (selectedCity) {
      events = events.filter(evt => evt.school?.city_id === selectedCity);
      accidents = accidents.filter(acc => acc.city_id === selectedCity);
    }

    setFilteredEvents(events);
    setFilteredAccidents(accidents);
    setFilteredBudgets(budgets);
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const handleResetFilters = () => {
    setDateRange({
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      endDate: new Date()
    });
    setSelectedProvince('');
    setSelectedCity('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        .react-datepicker-popper {
          z-index: 1050; 
        }
      `}</style>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard Overview</h2>
        <button className="btn btn-outline-primary" onClick={handleRefresh}>
          <i className="bi bi-arrow-clockwise me-2"></i>Refresh
        </button>
      </div>

      {/* District Recommendations for Next Month */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">
            <i className="bi bi-lightbulb-fill me-2 text-warning"></i>
            Recommended Districts for Next Month
          </h4>
          <span className="badge bg-info">AI-Powered Insights</span>
        </div>
        <DistrictRecommendation
          schools={allSchools}
          events={allEvents}
          accidents={allAccidents}
          marketShare={marketShareSuggestions}
        />
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1 pe-2">
                <h6 className="text-muted mb-1 small">Total Schools</h6>
                <div className="stats-number">{stats.schools}</div>
                <small className="text-success d-block">
                  <i className="bi bi-check-circle me-1"></i>
                  {additionalStats.activeSchools} of {stats.schools} trained (6M)
                  <span className="stats-info-tooltip">
                    <i
                      className="bi bi-info-circle ms-1"
                      style={{ cursor: 'help', fontSize: '0.85rem' }}
                    ></i>
                    <span className="tooltiptext">
                      Schools that received safety riding training in the last 6 months
                    </span>
                  </span>
                </small>
              </div>
              <i className="bi bi-building fs-1 text-danger flex-shrink-0"></i>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1 pe-2">
                <h6 className="text-muted mb-1 small">Total Events</h6>
                <div className="stats-number">{stats.events}</div>
                <small className="text-info d-block text-truncate">
                  <i className="bi bi-people me-1"></i>
                  Avg {additionalStats.avgAttendeesPerEvent} attendees
                </small>
              </div>
              <i className="bi bi-calendar-event fs-1 text-danger flex-shrink-0"></i>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1 pe-2">
                <h6 className="text-muted mb-1 small">Total Accidents</h6>
                <div className="stats-number">{stats.accidents}</div>
                <small className="text-danger d-block text-truncate">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  {additionalStats.totalDeaths} deaths, {additionalStats.totalInjured} injured
                </small>
              </div>
              <i className="bi bi-exclamation-triangle fs-1 text-danger flex-shrink-0"></i>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1 pe-2">
                <h6 className="text-muted mb-1 small">Budget Utilization</h6>
                <div className="stats-number">{additionalStats.budgetUtilizationRate}%</div>
                <small className={`${additionalStats.budgetUtilizationRate > 100 ? 'text-danger' : 'text-success'} d-block text-truncate`}>
                  <i className={`bi bi-${additionalStats.budgetUtilizationRate > 100 ? 'exclamation' : 'check'}-circle me-1`}></i>
                  {additionalStats.budgetUtilizationRate > 100 ? 'Over budget' : 'On track'}
                </small>
              </div>
              <i className="bi bi-cash-stack fs-1 text-danger flex-shrink-0"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>Filters
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small">Date Range</label>
              <div className="d-flex gap-2">
                <DatePicker
                  selected={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  selectsStart
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  className="form-control form-control-sm"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Start Date"
                  portalId="root-portal"
                />
                <DatePicker
                  selected={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  selectsEnd
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  minDate={dateRange.startDate}
                  className="form-control form-control-sm"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="End Date"
                  portalId="root-portal"
                />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Province</label>
              <select
                className="form-select form-select-sm"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">All Provinces</option>
                {provinces.map(prov => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">City</label>
              <select
                className="form-select form-select-sm"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedProvince}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-sm btn-outline-secondary w-100" onClick={handleResetFilters}>
                <i className="bi bi-x-circle me-1"></i>Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row g-4 mb-4">
        {/* Accident Trends */}
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2 text-danger"></i>
                Accident Trends Over Time
              </h5>
            </div>
            <div className="card-body">
              <AccidentTrendsChart data={filteredAccidents} />
            </div>
          </div>
        </div>

        {/* Event Type Distribution */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-pie-chart me-2 text-danger"></i>
                Event Type Distribution
              </h5>
            </div>
            <div className="card-body">
              <EventTypeDistributionChart data={filteredEvents} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row g-4 mb-4">
        {/* Schools by Province */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
                Top 10 Schools by City/Regency
              </h5>
            </div>
            <div className="card-body">
              <SchoolsByProvinceChart data={allSchools} />
            </div>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-cash-stack me-2 text-danger"></i>
                Top 10 Budget vs Spending by Event
              </h5>
            </div>
            <div className="card-body">
              <BudgetUtilizationChart data={filteredBudgets} />
            </div>
          </div>
        </div>
      </div>

      {/* Market Share Suggestions */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">Market Share Focus</h5>
            <small className="text-muted">
              {marketShareSuggestions.month ? `${getMonthLabel(marketShareSuggestions.month)} ${marketShareSuggestions.year}` : 'Latest available period'}
            </small>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={fetchMarketShareSuggestions}
            disabled={marketShareLoading}
          >
            {marketShareLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </>
            )}
          </button>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-6">
              <h6 className="text-uppercase text-muted mb-3">Top Cities / Regencies</h6>
              {marketShareSuggestions.topCities.length > 0 ? (
                <div className="list-group list-group-flush">
                  {marketShareSuggestions.topCities.map((item, index) => (
                    <div key={`${item.city_id}-${index}`} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{index + 1}. {item.city_name}</strong>
                          <div className="text-muted small">{item.province_name}</div>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold text-primary">{formatUnits(item.total_sales || 0)} units</div>
                          <div className="small text-muted">
                            Share {formatPercentage(item.market_share || 0)} · Comp {formatPercentage(item.competitor_share || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">No market share data available.</p>
              )}
            </div>

            <div className="col-md-6">
              <h6 className="text-uppercase text-muted mb-3">Top Districts</h6>
              {marketShareSuggestions.topDistricts.length > 0 ? (
                <div className="list-group list-group-flush">
                  {marketShareSuggestions.topDistricts.map((item, index) => (
                    <div key={`${item.district_id}-${index}`} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{index + 1}. {item.district_name}</strong>
                          <div className="text-muted small">{item.city_name}, {item.province_name}</div>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold text-primary">{formatUnits(item.total_sales || 0)} units</div>
                          <div className="small text-muted">
                            Share {formatPercentage(item.market_share || 0)} · Comp {formatPercentage(item.competitor_share || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">No district data available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row g-4">
        {/* Recent Events */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-calendar-event me-2 text-danger"></i>
                Recent Events
              </h5>
              {hasPermission('view_events') && (
                <Link to="/events" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              )}
            </div>
            <div className="card-body">
              {recentEvents.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentEvents.map(event => (
                    <div key={event.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{event.title}</h6>
                          <p className="mb-1 text-muted small">
                            <i className="bi bi-building me-1"></i>
                            {event.school?.name || 'N/A'}
                          </p>
                          <p className="mb-0 text-muted small">
                            <i className="bi bi-calendar3 me-1"></i>
                            {formatDate(event.event_date)}
                          </p>
                        </div>
                        <span className={`badge ${
                          event.status === 'completed' ? 'bg-success' :
                          event.status === 'ongoing' ? 'bg-primary' :
                          event.status === 'cancelled' ? 'bg-danger' :
                          'bg-warning'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No recent accidents</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Accidents */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                Recent Accidents
              </h5>
              {hasPermission('view_accidents') && (
                <Link to="/accidents" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              )}
            </div>
            <div className="card-body">
              {recentAccidents.length > 0 ? (
                <div className="list-group list-group-flush">
                  {recentAccidents.map(accident => (
                    <div key={accident.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">Report #{accident.police_report_no}</h6>
                          <p className="mb-1 text-muted small">
                            <i className="bi bi-geo-alt me-1"></i>
                            {accident.location}
                          </p>
                          <p className="mb-0 text-muted small">
                            <i className="bi bi-calendar3 me-1"></i>
                            {formatDate(accident.accident_date)}
                          </p>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-danger me-1">
                            {accident.death_count || 0} deaths
                          </span>
                          <span className="badge bg-warning">
                            {accident.injured_count || 0} injured
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No recent accidents</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
