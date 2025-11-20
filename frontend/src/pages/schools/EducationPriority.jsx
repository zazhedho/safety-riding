import { useState, useEffect } from 'react';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import PriorityMatrixChart from '../../components/charts/PriorityMatrixChart';
import { toast } from 'react-toastify';

const EducationPriority = () => {
  const currentYear = new Date().getFullYear();
  const defaultFilters = {
    province_id: '',
    city_id: '',
    district_id: '',
    month: '',
    year: String(currentYear)
  };

  const [data, setData] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const yearOptions = Array.from({ length: 5 }, (_, idx) => String(currentYear - idx));

  useEffect(() => {
    fetchProvinces();
    fetchPriorityData();
  }, []);

  useEffect(() => {
    if (filters.province_id) {
      fetchCities(filters.province_id);
    } else {
      setCities([]);
      setDistricts([]);
    }
  }, [filters.province_id]);

  useEffect(() => {
    if (filters.city_id) {
      fetchDistricts(filters.province_id, filters.city_id);
    } else {
      setDistricts([]);
    }
  }, [filters.city_id]);

  const fetchProvinces = async () => {
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load provinces');
    }
  };

  const fetchCities = async (provinceCode) => {
    try {
      const response = await locationService.getCities(provinceCode);
      setCities(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load cities');
    }
  };

  const fetchDistricts = async (provinceCode, cityCode) => {
    try {
      const response = await locationService.getDistricts(provinceCode, cityCode);
      setDistricts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load districts');
    }
  };

  const fetchPriorityData = async (customFilters = filters) => {
    setLoading(true);
    try {
      const params = {};

      if (customFilters.province_id) params['filters[province_id]'] = customFilters.province_id;
      if (customFilters.city_id) params['filters[city_id]'] = customFilters.city_id;
      if (customFilters.district_id) params['filters[district_id]'] = customFilters.district_id;
      if (customFilters.month) params['filters[month]'] = customFilters.month;
      if (customFilters.year) params['filters[year]'] = customFilters.year;

      const response = await schoolService.getEducationPriority(params);
      setData(response.data.data);
    } catch (error) {
      toast.error('Failed to load education priority data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = {
      ...filters,
      [name]: value,
    };

    if (name === 'province_id') {
      updatedFilters.city_id = '';
      updatedFilters.district_id = '';
    }

    if (name === 'city_id') {
      updatedFilters.district_id = '';
    }

    setFilters(updatedFilters);
  };

  const handleSearch = () => {
    fetchPriorityData(filters);
  };

  const handleClearFilters = () => {
    const resetFilters = { ...defaultFilters };
    setFilters(resetFilters);
    setCities([]);
    setDistricts([]);
    fetchPriorityData(resetFilters);
  };

  const getPriorityBadgeClass = (level) => {
    switch (level) {
      case 'Critical':
        return 'bg-danger';
      case 'High':
        return 'bg-warning text-dark';
      case 'Medium':
        return 'bg-info';
      case 'Low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'Mandatory' ? 'bg-danger' : 'bg-success';
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Education Priority Matrix</h2>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="row gx-3 gy-1 mb-3">
          <div className="col-sm-6 col-lg-3">
            <div className="card border-danger">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 pe-2">
                    <h6 className="text-muted mb-1 small">Critical Priority</h6>
                    <h3 className="mb-0 text-danger">{data.critical_count || 0}</h3>
                  </div>
                  <div className="text-danger flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="card border-warning">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 pe-2">
                    <h6 className="text-muted mb-1 small">High Priority</h6>
                    <h3 className="mb-0 text-warning">{data.high_priority_count || 0}</h3>
                  </div>
                  <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-exclamation-circle-fill"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="card border-info">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 pe-2">
                    <h6 className="text-muted mb-1 small">Medium Priority</h6>
                    <h3 className="mb-0 text-info">{data.medium_count || 0}</h3>
                  </div>
                  <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-info-circle-fill"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="card border-success">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 pe-2">
                    <h6 className="text-muted mb-1 small">Low Priority</h6>
                    <h3 className="mb-0 text-success">{data.low_count || 0}</h3>
                  </div>
                  <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Info */}
      {data && (
        <div className="alert alert-info mb-3">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Market Share Threshold: {data.market_threshold}%</strong> -
          Areas with market share below {data.market_threshold}% require mandatory safety riding education.
        </div>
      )}

      {/* 2x2 Priority Matrix Visualization */}
      {!loading && data && (
        data.items && data.items.length > 0 ? (
          <div className="card mb-4">
            <div className="card-body">
              <PriorityMatrixChart
                data={data.items}
                threshold={data.market_threshold || 87}
              />
            </div>
          </div>
        ) : (
          <div className="alert alert-warning mb-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Matrix visualization not available.</strong>
            <p className="mb-0 mt-2">To see the priority matrix, you need to add:</p>
            <ul className="mb-0 mt-2">
              <li>Market share data for districts</li>
              <li>School data (students count)</li>
              <li>Accident data (deaths, injuries)</li>
            </ul>
          </div>
        )
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6 col-lg-2">
              <select
                className="form-select"
                name="province_id"
                value={filters.province_id}
                onChange={handleFilterChange}
              >
                <option value="">All Provinces</option>
                {provinces.map(prov => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <select
                className="form-select"
                name="city_id"
                value={filters.city_id}
                onChange={handleFilterChange}
                disabled={!filters.province_id}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <select
                className="form-select"
                name="district_id"
                value={filters.district_id}
                onChange={handleFilterChange}
                disabled={!filters.city_id}
              >
                <option value="">All Districts</option>
                {districts.map(dist => (
                  <option key={dist.code} value={dist.code}>{dist.name}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <select
                className="form-select"
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {new Date(2000, index, 1).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <select
                className="form-select"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
              >
                <option value="">All Years</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-fill" onClick={handleSearch} title="Apply filters">
                  <i className="bi bi-search"></i>
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClearFilters} title="Clear all filters">
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Matrix Table */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Priority Matrix by District</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : data && data.items && data.items.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover table-sm">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th className="text-center">Market Share</th>
                    <th className="text-center">Safety Riding</th>
                    <th className="text-center">Schools</th>
                    <th className="text-center">Students</th>
                    <th className="text-center">Accidents</th>
                    <th className="text-center">Severity</th>
                    <th className="text-center">Score</th>
                    <th className="text-center">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.district_name}</strong>
                        <br />
                        <small className="text-muted">
                          {item.city_name}, {item.province_name}
                        </small>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${item.is_below_threshold ? 'bg-danger' : 'bg-success'}`}>
                          {item.market_share.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getStatusBadgeClass(item.safety_riding_status)}`}>
                          {item.safety_riding_status}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-secondary">
                          {item.total_schools}
                        </span>
                        <br />
                        <small className="text-success">{item.educated_schools} educated</small>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary">
                          {item.total_students.toLocaleString()}
                        </span>
                        <br />
                        <small className="text-info">{item.total_student_educated.toLocaleString()} educated</small>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${item.total_accidents > 0 ? 'bg-danger' : 'bg-secondary'}`}>
                          {item.total_accidents}
                        </span>
                        {item.total_deaths > 0 && (
                          <>
                            <br />
                            <small className="text-danger">{item.total_deaths} deaths</small>
                          </>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`badge ${item.accident_severity > 50 ? 'bg-danger' : item.accident_severity > 20 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {item.accident_severity}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="progress position-relative" style={{ height: '20px', minWidth: '60px' }}>
                          <div
                            className={`progress-bar ${item.priority_score >= 75 ? 'bg-danger' : item.priority_score >= 50 ? 'bg-warning' : item.priority_score >= 25 ? 'bg-info' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${item.priority_score}%` }}
                            aria-valuenow={item.priority_score}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {item.priority_score >= 20 && `${item.priority_score}`}
                          </div>
                          {item.priority_score < 20 && (
                            <span className="position-absolute top-50 start-50 translate-middle fw-semibold text-dark" style={{ fontSize: '0.75rem' }}>
                              {item.priority_score}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${getPriorityBadgeClass(item.priority_level)}`}>
                          {item.priority_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">No priority data found</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="card mt-3">
        <div className="card-header">
          <h6 className="mb-0">Legend</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="small fw-bold">Priority Score Calculation:</h6>
              <ul className="small mb-0">
                <li><strong>Market Share Factor (40 pts):</strong> Below 87% threshold = higher priority</li>
                <li><strong>Student Population (30 pts):</strong> More students = higher education impact</li>
                <li><strong>Accident Severity (30 pts):</strong> Deaths (10), Injured (5), Minor (1)</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="small fw-bold">Priority Levels:</h6>
              <ul className="small mb-0">
                <li><span className="badge bg-danger">Critical</span> Score 75-100</li>
                <li><span className="badge bg-warning text-dark">High</span> Score 50-74</li>
                <li><span className="badge bg-info">Medium</span> Score 25-49</li>
                <li><span className="badge bg-success">Low</span> Score 0-24</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EducationPriority;
