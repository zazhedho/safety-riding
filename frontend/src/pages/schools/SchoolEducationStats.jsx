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
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });
  const [sorting, setSorting] = useState({
    order_by: 'name',
    order_direction: 'asc'
  });

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
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'province_id' && { city_id: '', district_id: '' }),
      ...(name === 'city_id' && { district_id: '' })
    }));
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
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Total Schools</h6>
                    <h3 className="mb-0">{stats.total_schools}</h3>
                  </div>
                  <div className="text-primary" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-building"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card border-success">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Educated Schools</h6>
                    <div className="d-flex align-items-baseline">
                      <h3 className="mb-0">{stats.total_educated_schools}</h3>
                      <small className="text-success ms-2">
                        ({calculatePercentage(stats.total_educated_schools, stats.total_schools)}%)
                      </small>
                    </div>
                  </div>
                  <div className="text-success" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-check-circle"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card border-info">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Total Students Educated</h6>
                    <h3 className="mb-0">{stats.total_all_students.toLocaleString()}</h3>
                  </div>
                  <div className="text-info" style={{ fontSize: '2rem' }}>
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card border-warning">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-1">Avg Students/School</h6>
                    <h3 className="mb-0">
                      {stats.total_schools > 0
                        ? Math.round(stats.total_all_students / stats.total_schools).toLocaleString()
                        : 0
                      }
                    </h3>
                  </div>
                  <div className="text-warning" style={{ fontSize: '2rem' }}>
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
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by school name..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-2">
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
            <div className="col-md-2">
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
            <div className="col-md-2">
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
            <div className="col-md-2">
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
            <div className="col-md-1">
              <button className="btn btn-primary w-100" onClick={handleSearch}>
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
                      const coverage = school.student_count > 0
                        ? ((school.total_student_educated / school.student_count) * 100).toFixed(1)
                        : 0;
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
                              {school.student_count.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {school.total_student_educated.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <div className="progress" style={{ height: '20px' }}>
                              <div
                                className={`progress-bar ${coverage >= 100 ? 'bg-success' : coverage >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                role="progressbar"
                                style={{ width: `${Math.min(coverage, 100)}%` }}
                                aria-valuenow={coverage}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              >
                                {coverage}%
                              </div>
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
