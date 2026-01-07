import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import schoolService from '../services/schoolService';
import publicService from '../services/publicService';
import eventService from '../services/eventService';
import marketShareService from '../services/marketShareService';
import dashboardService from '../services/dashboardService';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

// Import chart components
import AccidentTrendsChart from '../components/charts/AccidentTrendsChart';
import EventTypeDistributionChart from '../components/charts/EventTypeDistributionChart';
import BudgetUtilizationChart from '../components/charts/BudgetUtilizationChart';
import SchoolsByProvinceChart from '../components/charts/SchoolsByProvinceChart';
import PublicsByCityChart from '../components/charts/PublicsByCityChart';
import DistrictRecommendation from '../components/recommendations/DistrictRecommendation';
import PriorityMatrixChart from '../components/charts/PriorityMatrixChart';
import EventMap from '../components/maps/EventMap';

const Dashboard = () => {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState({
    schools: 0,
    publics: 0,
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
    trainedSchools: 0,
    trainedPublics: 0
  });

  // Data for charts (aggregated from backend)
  const [allSchools, setAllSchools] = useState([]);
  const [allPublics, setAllPublics] = useState([]);
  const [eventDistribution, setEventDistribution] = useState([]);
  const [accidentTrends, setAccidentTrends] = useState([]);
  const [budgetUtilization, setBudgetUtilization] = useState([]);

  // Accident recommendations from backend
  const [accidentRecommendations, setAccidentRecommendations] = useState([]);

  const [marketShareSuggestions, setMarketShareSuggestions] = useState({
    topCities: [],
    topDistricts: [],
    year: null,
    month: null
  });
  const [marketShareLoading, setMarketShareLoading] = useState(false);

  // Education Priority data
  const [educationPriority, setEducationPriority] = useState(null);
  const [priorityLoading, setPriorityLoading] = useState(false);

  // Events Map data
  const [eventsMapData, setEventsMapData] = useState([]);
  const [eventsMapLoading, setEventsMapLoading] = useState(false);

  const [recentEvents, setRecentEvents] = useState([]);
  const [recentAccidents, setRecentAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatUnits = (value) => new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0
  }).format(value || 0);

  const formatPercentage = (value) => `${Number(value ?? 0).toFixed(1)}%`;

  const getMonthLabel = (month) => {
    if (!month) return '';
    return new Date(0, month - 1).toLocaleString('en-US', { month: 'long' });
  };

  useEffect(() => {
    fetchDashboardData();
    fetchMarketShareSuggestions();
    fetchEducationPriority();
    fetchEventsMapData();
  }, []);

  const fetchEducationPriority = async () => {
    try {
      setPriorityLoading(true);
      const now = new Date();
      const params = {
        'filters[year]': now.getFullYear(),
        'filters[month]': now.getMonth() + 1
      };
      const response = await schoolService.getEducationPriority(params);
      setEducationPriority(response.data.data);
    } catch (error) {
      console.error('Failed to load education priority', error);
    } finally {
      setPriorityLoading(false);
    }
  };

  const fetchEventsMapData = async () => {
    try {
      setEventsMapLoading(true);
      const response = await eventService.getEventsForMap();
      setEventsMapData(response.data.data || []);
    } catch (error) {
      console.error('Failed to load events map data', error);
    } finally {
      setEventsMapLoading(false);
    }
  };

  const fetchMarketShareSuggestions = async () => {
    try {
      setMarketShareLoading(true);
      const now = new Date();
      
      // Get previous month
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      
      const params = {
        year: prevMonth.getFullYear(),
        month: prevMonth.getMonth() + 1,
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



  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch aggregated stats from backend (optimized)
      const [statsRes, schoolsData, publicsData] = await Promise.all([
        dashboardService.getStats(),
        schoolService.getAll({ limit: 1000 }),
        publicService.getAll({ limit: 1000 })
      ]);

      const dashboardData = statsRes.data.data;

      // Set stats from backend
      setStats({
        schools: dashboardData.schools,
        publics: dashboardData.publics,
        events: dashboardData.events,
        accidents: dashboardData.accidents,
        budgets: dashboardData.budgets
      });

      // Set additional stats from backend
      setAdditionalStats({
        totalDeaths: dashboardData.additional_stats.total_deaths,
        totalInjured: dashboardData.additional_stats.total_injured,
        avgAttendeesPerEvent: dashboardData.additional_stats.avg_attendees_per_event,
        budgetUtilizationRate: dashboardData.additional_stats.budget_utilization_rate,
        trainedSchools: dashboardData.additional_stats.trained_schools,
        trainedPublics: dashboardData.additional_stats.trained_publics
      });

      // Set chart data from backend (already aggregated!)
      setEventDistribution(dashboardData.event_distribution || []);
      setAccidentTrends(dashboardData.accident_trends || []);
      setBudgetUtilization(dashboardData.budget_utilization || []);

      // Set schools & publics for charts
      setAllSchools(schoolsData.data.data || []);
      setAllPublics(publicsData.data.data || []);

      // Set recent data from backend
      setRecentEvents(dashboardData.recent_events || []);
      setRecentAccidents(dashboardData.recent_accidents || []);
      
      // Set accident recommendations from backend
      setAccidentRecommendations(dashboardData.accident_recommendations || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Note: Filters removed - dashboard shows fixed data from backend (last 2 months for stats, last 12 months for trends)

  const handleRefresh = () => {
    fetchDashboardData();
    fetchMarketShareSuggestions();
    fetchEducationPriority();
    fetchEventsMapData();
    toast.success('Dashboard refreshed');
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
      <>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
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
          {/*<span className="badge bg-info">AI-Powered Insights</span>*/}
        </div>
        <DistrictRecommendation
          schools={allSchools}
          events={[]}
          accidents={[]}
          poldaAccidents={[]}
          marketShare={marketShareSuggestions}
          accidentRecommendations={accidentRecommendations}
        />
      </div>

      {/* Completed Events Map */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="bi bi-geo-alt-fill me-2 text-success"></i>
              Completed Events Map
            </h5>
            <small className="text-muted">Events completed in the last 6 months</small>
          </div>
          <span className="badge bg-success">{eventsMapData.length} events</span>
        </div>
        <div className="card-body p-0">
          {eventsMapLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : eventsMapData.length > 0 ? (
            <EventMap events={eventsMapData} height="400px" />
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-geo-alt display-4 d-block mb-2"></i>
              No completed events with location data in the last 6 months
            </div>
          )}
        </div>
      </div>

      {/* Education Priority Summary */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <i className="bi bi-grid-3x3-gap-fill me-2 text-danger"></i>
              Education Priority Matrix
            </h5>
            <small className="text-muted">
              Areas requiring safety riding education based on market share ({educationPriority?.market_threshold || 87}% threshold), schools & accidents
            </small>
          </div>
          <Link to="/education/priority" className="btn btn-sm btn-outline-primary">
            <i className="bi bi-box-arrow-up-right me-1"></i>
            View Details
          </Link>
        </div>
        <div className="card-body">
          {priorityLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : educationPriority ? (
            <>
              <div className="row g-3">
                <div className="col-6 col-lg-3">
                  <div className="card border-danger h-100">
                    <div className="card-body text-center py-3">
                      <div className="text-danger mb-1">
                        <i className="bi bi-exclamation-triangle-fill fs-4"></i>
                      </div>
                      <h3 className="mb-1 text-danger">{educationPriority.critical_count || 0}</h3>
                      <small className="text-muted">Critical</small>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="card border-warning h-100">
                    <div className="card-body text-center py-3">
                      <div className="text-warning mb-1">
                        <i className="bi bi-exclamation-circle-fill fs-4"></i>
                      </div>
                      <h3 className="mb-1 text-warning">{educationPriority.high_priority_count || 0}</h3>
                      <small className="text-muted">High</small>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="card border-info h-100">
                    <div className="card-body text-center py-3">
                      <div className="text-info mb-1">
                        <i className="bi bi-info-circle-fill fs-4"></i>
                      </div>
                      <h3 className="mb-1 text-info">{educationPriority.medium_count || 0}</h3>
                      <small className="text-muted">Medium</small>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="card border-success h-100">
                    <div className="card-body text-center py-3">
                      <div className="text-success mb-1">
                        <i className="bi bi-check-circle-fill fs-4"></i>
                      </div>
                      <h3 className="mb-1 text-success">{educationPriority.low_count || 0}</h3>
                      <small className="text-muted">Low</small>
                    </div>
                  </div>
                </div>
              </div>
              {/* 2x2 Priority Matrix Visualization */}
              {educationPriority.items && educationPriority.items.length > 0 ? (
                <div className="mt-4">
                  <hr className="my-3" />
                  <PriorityMatrixChart
                    data={educationPriority.items}
                    threshold={educationPriority.market_threshold || 87}
                  />
                </div>
              ) : (
                <div className="alert alert-warning mt-4">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Matrix visualization not available.</strong> Add market share, school, and accident data to see the priority matrix.
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-center mb-0">No priority data available</p>
          )}
          {educationPriority && educationPriority.total_items > 0 && (
            <div className="mt-3 text-center">
              <small className="text-muted">
                Total {educationPriority.total_items} districts analyzed -
                <strong className="text-danger ms-1">
                  {(educationPriority.critical_count || 0) + (educationPriority.high_priority_count || 0)} require immediate attention
                </strong>
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div className="flex-grow-1 pe-2">
                <h6 className="text-muted mb-1 small">Total Entities</h6>
                <div className="stats-number">{(stats.schools || 0) + (stats.publics || 0)}</div>
                <small className="text-success d-block">
                  <i className="bi bi-check-circle me-1"></i>
                  {(additionalStats.trainedSchools || 0) + (additionalStats.trainedPublics || 0)} of {(stats.schools || 0) + (stats.publics || 0)} trained (6M)
                  <span className="stats-info-tooltip">
                    <i
                      className="bi bi-info-circle ms-1"
                      style={{ cursor: 'help', fontSize: '0.85rem' }}
                    ></i>
                    <span className="tooltiptext">
                      Schools and public entities that received safety riding training in the last 6 months. Total: {stats.schools || 0} schools + {stats.publics || 0} public entities
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
                <small className="text-info d-flex align-items-center">
                  <i className="bi bi-people me-1"></i>
                  Avg {additionalStats.avgAttendeesPerEvent} attendees
                  <span className="stats-info-tooltip ms-1">
                    <i className="bi bi-info-circle" style={{ cursor: 'help', fontSize: '0.85rem' }}></i>
                    <span className="tooltiptext">
                      Average participants per event based on all recorded activities
                    </span>
                  </span>
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
                <small className="text-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  {additionalStats.totalDeaths} deaths, {additionalStats.totalInjured} injured
                  <span className="stats-info-tooltip ms-1">
                    <i className="bi bi-info-circle" style={{ cursor: 'help', fontSize: '0.85rem' }}></i>
                    <span className="tooltiptext">
                      Total fatalities and injuries aggregated from the entire accident dataset
                    </span>
                  </span>
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
                <small className={`${additionalStats.budgetUtilizationRate > 100 ? 'text-danger' : 'text-success'} d-flex align-items-center`}>
                  <i className={`bi bi-${additionalStats.budgetUtilizationRate > 100 ? 'exclamation' : 'check'}-circle me-1`}></i>
                  {additionalStats.budgetUtilizationRate > 100 ? 'Over budget' : 'On track'}
                  <span className="stats-info-tooltip ms-1">
                    <i className="bi bi-info-circle" style={{ cursor: 'help', fontSize: '0.85rem' }}></i>
                    <span className="tooltiptext">
                      Percentage of overall actual spending compared to total allocated budgets
                    </span>
                  </span>
                </small>
              </div>
              <i className="bi bi-cash-stack fs-1 text-danger flex-shrink-0"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Data shows: Last 2 months for stats, Last 12 months for trends */}
      <div className="alert alert-info mb-4">
        <i className="bi bi-info-circle me-2"></i>
        Dashboard displays data from the <strong>last 2 months</strong> for statistics and <strong>last 12 months</strong> for trend charts.
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
              <AccidentTrendsChart data={accidentTrends} />
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
              <EventTypeDistributionChart data={eventDistribution} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="row g-4 mb-4">
        {/* Schools by Province */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-building me-2 text-danger"></i>
                Top 10 Schools by City
              </h5>
            </div>
            <div className="card-body">
              <SchoolsByProvinceChart data={allSchools} />
            </div>
          </div>
        </div>

        {/* Public Entities by City */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-people me-2 text-danger"></i>
                Top 10 Public Entities by City
              </h5>
            </div>
            <div className="card-body">
              <PublicsByCityChart data={allPublics} />
            </div>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-cash-stack me-2 text-danger"></i>
                Top 10 Budget vs Spending
              </h5>
            </div>
            <div className="card-body">
              <BudgetUtilizationChart data={budgetUtilization} />
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
              {marketShareSuggestions.topDistricts.length > 0 && 
               marketShareSuggestions.topDistricts.some(item => item.district_name && item.district_name.trim()) ? (
                <div className="list-group list-group-flush">
                  {marketShareSuggestions.topDistricts
                    .filter(item => item.district_name && item.district_name.trim())
                    .map((item, index) => (
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
                            <i className="bi bi-geo-alt me-1"></i>
                            {event.location || 'N/A'}
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
                <p className="text-muted text-center py-4">No recent events</p>
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
    </>
  );
};

export default Dashboard;
