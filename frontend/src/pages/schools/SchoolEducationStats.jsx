import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const SchoolEducationStats = () => {
  const [stats, setStats] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    is_educated: '',
    search: '',
    month: '',
    year: String(new Date().getFullYear())
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });
  const [sorting, setSorting] = useState({
    order_by: 'name',
    order_direction: 'asc'
  });
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, idx) => String(currentYear - idx));

  useEffect(() => {
    fetchProvinces();
    fetchStats();
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

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        order_by: sorting.order_by,
        order_direction: sorting.order_direction,
      };

      if (filters.province_id) params['filters[province_id]'] = filters.province_id;
      if (filters.city_id) params['filters[city_id]'] = filters.city_id;
      if (filters.district_id) params['filters[district_id]'] = filters.district_id;
      if (filters.is_educated !== '') params['filters[is_educated]'] = filters.is_educated;
      if (filters.month) params['filters[month]'] = filters.month;
      if (filters.year) params['filters[year]'] = filters.year;
      if (filters.search) params.search = filters.search;

      const response = await schoolService.getEducationStats(params);
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load education statistics');
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
    setPagination({ ...pagination, page: 1 });
    fetchStats();
  };

  const handleSort = (column) => {
    setSorting(prev => ({
      order_by: column,
      order_direction: prev.order_by === column && prev.order_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  useEffect(() => {
    if (!loading) {
      fetchStats();
    }
  }, [pagination, sorting]);

  const getSortIcon = (column) => {
    if (sorting.order_by !== column) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }
    return sorting.order_direction === 'asc'
      ? <i className="bi bi-arrow-up ms-1"></i>
      : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleLimitChange = (e) => {
    setPagination({ page: 1, limit: parseInt(e.target.value) });
  };

  const calculatePercentage = (part, total) => {
    if (total === 0) return 0;
    return ((part / total) * 100).toFixed(1);
  };

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>School Education Statistics</h2>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="card border-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="flex-grow-1 pe-2">
                    <h6 className="text-muted mb-1 small">Total Schools</h6>
                    <h3 className="mb-0 text-truncate">{stats.total_schools}</h3>
                  </div>
                  <div className="text-primary flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-building"></i>
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
                    <h6 className="text-muted mb-1 small">Educated Schools</h6>
                    <div className="d-flex align-items-baseline">
                      <h3 className="mb-0 text-truncate">{stats.total_educated_schools}</h3>
                      <small className="text-success ms-2 flex-shrink-0">
                        ({calculatePercentage(stats.total_educated_schools, stats.total_schools)}%)
                      </small>
                    </div>
                  </div>
                  <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-check-circle"></i>
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
                    <h6 className="text-muted mb-1 small">Total Students Educated</h6>
                    <h3 className="mb-0 text-truncate" title={stats.total_all_students.toLocaleString()}>
                      {stats.total_all_students.toLocaleString()}
                    </h3>
                  </div>
                  <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-people"></i>
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
                    <h6 className="text-muted mb-1 small">Avg Students/School</h6>
                    <h3 className="mb-0 text-truncate">
                      {stats.total_schools > 0
                        ? Math.round(stats.total_all_students / stats.total_schools).toLocaleString()
                        : 0
                      }
                    </h3>
                  </div>
                  <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-graph-up"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by school name..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
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
                name="is_educated"
                value={filters.is_educated}
                onChange={handleFilterChange}
              >
                <option value="">All Status</option>
                <option value="true">Educated</option>
                <option value="false">Not Educated</option>
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
            <div className="col-12 col-lg-1 d-grid">
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">School Details</h5>
          <div className="d-flex align-items-center gap-2">
            <label className="mb-0 me-2">Show:</label>
            <select className="form-select form-select-sm" style={{ width: 'auto' }} value={pagination.limit} onChange={handleLimitChange}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : stats && stats.schools && stats.schools.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                        School Name {getSortIcon('name')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('npsn')}>
                        NPSN {getSortIcon('npsn')}
                      </th>
                      <th>Location</th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('student_count')}>
                        Total Students {getSortIcon('student_count')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_student_educated')}>
                        Students Educated {getSortIcon('total_student_educated')}
                      </th>
                      <th>Coverage</th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('is_educated')}>
                        Status {getSortIcon('is_educated')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.schools.map(school => {
                      const studentCount = Number(school.student_count) || 0;
                      const educatedCount = Number(school.total_student_educated) || 0;
                      const coverageRaw = studentCount > 0
                        ? Number(((educatedCount / studentCount) * 100).toFixed(1))
                        : 0;
                      const coverage = Number.isFinite(coverageRaw) ? coverageRaw : 0;
                      const hasCoverage = coverage > 0;
                      const coverageLabel = hasCoverage ? coverage.toFixed(1) : '0';
                      return (
                        <tr key={school.id}>
                          <td>
                            <strong>{school.name}</strong>
                          </td>
                          <td>{school.npsn || '-'}</td>
                          <td>
                            <small>
                              {school.district_name}<br />
                              {school.city_name}, {school.province_name}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {studentCount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {educatedCount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <div className="progress position-relative" style={{ height: '20px' }}>
                              <div
                                className={`progress-bar d-flex align-items-center justify-content-center ${coverage >= 100 ? 'bg-success' : coverage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                role="progressbar"
                                style={{ width: `${Math.min(coverage, 100)}%` }}
                                aria-valuenow={coverage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                {hasCoverage ? `${coverageLabel}%` : ''}
                              </div>
                              {!hasCoverage && (
                                <span
                                  className="position-absolute top-50 start-50 translate-middle fw-semibold text-dark"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {coverageLabel}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {school.is_educated ? (
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle me-1"></i>Educated
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                <i className="bi bi-x-circle me-1"></i>Not Educated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {stats.total_schools > pagination.limit && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, stats.total_schools)} of {stats.total_schools} schools
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>Previous</button>
                      </li>
                      {[...Array(Math.ceil(stats.total_schools / pagination.limit))].map((_, index) => (
                        <li key={index + 1} className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => handlePageChange(index + 1)}>{index + 1}</button>
                        </li>
                      )).slice(Math.max(0, pagination.page - 3), Math.min(pagination.page + 2, Math.ceil(stats.total_schools / pagination.limit)))}
                      <li className={`page-item ${pagination.page >= Math.ceil(stats.total_schools / pagination.limit) ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>Next</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">No schools found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolEducationStats;
