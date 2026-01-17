import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PublicMap from '../../components/maps/PublicMap';
import publicService from '../../services/publicService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PublicList = () => {
  const { hasPermission } = useAuth();
  const [publics, setPublics] = useState([]);
  const [allPublics, setAllPublics] = useState([]); // For map view - all publics without pagination
  const [summary, setSummary] = useState({ total_publics: 0, total_employees: 0 });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'map'
  const [showAllOnMap, setShowAllOnMap] = useState(true); // true = show all publics, false = show current page only
  const [filters, setFilters] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    category: '',
    search: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    order_by: 'updated_at',
    order_direction: 'desc'
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [publicToDelete, setPublicToDelete] = useState(null);
  const [selectedPublicForMap, setSelectedPublicForMap] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);

  const categories = [
    'Private Company',
    'Government',
    'MC/User',
    'Community',
    'SR Campaign',
    'SR Campaign Blackspot',
    'Partnership'
  ];

  useEffect(() => {
    fetchProvinces();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchPublics();
  }, [pagination.page, appliedFilters, sorting]);

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

  const fetchSummary = async () => {
    try {
      const response = await publicService.getSummary();
      setSummary(response.data.data || { total_publics: 0, total_employees: 0 });
    } catch (error) {
      console.error('Failed to load summary');
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

  const fetchPublics = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        order_by: sorting.order_by,
        order_direction: sorting.order_direction,
      };
      if (appliedFilters.province_id) params['filters[province_id]'] = appliedFilters.province_id;
      if (appliedFilters.city_id) params['filters[city_id]'] = appliedFilters.city_id;
      if (appliedFilters.district_id) params['filters[district_id]'] = appliedFilters.district_id;
      if (appliedFilters.category) params['filters[category]'] = appliedFilters.category;
      if (appliedFilters.search) params.search = appliedFilters.search;

      const response = await publicService.getAll(params);
      setPublics(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0
      }));
    } catch (error) {
      toast.error('Failed to load public entities');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPublics = async () => {
    try {
      setMapLoading(true);
      const response = await publicService.getForMap();
      setAllPublics(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load public entities for map');
    } finally {
      setMapLoading(false);
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
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedPublicForMap(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      province_id: '',
      city_id: '',
      district_id: '',
      category: '',
      search: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setCities([]);
    setDistricts([]);
    setSelectedPublicForMap(null);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSort = (column) => {
    setSorting(prev => ({
      order_by: column,
      order_direction: prev.order_by === column && prev.order_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (column) => {
    if (sorting.order_by !== column) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }
    return sorting.order_direction === 'asc'
      ? <i className="bi bi-arrow-up ms-1"></i>
      : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const handleDeleteClick = (publicEntity) => {
    setPublicToDelete(publicEntity);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!publicToDelete) return;

    try {
      await publicService.delete(publicToDelete.id);
      toast.success('Public entity deleted successfully');
      fetchPublics();
      setShowDeleteModal(false);
      setPublicToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete public entity');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPublicToDelete(null);
  };

  const handleCoordinateClick = (publicEntity) => {
    setSelectedPublicForMap(publicEntity);
    handleMapView();
  };

  const handleMapView = () => {
    setViewMode('map');
    if (allPublics.length === 0) {
      fetchAllPublics();
    }
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h2 className="mb-1">Public Entities Management</h2>
          <p className="text-muted mb-0">
            <i className="bi bi-people me-2"></i>
            Total: <strong>{summary.total_publics.toLocaleString()}</strong> {summary.total_publics !== 1 ? 'entities' : 'entity'}
            <span className="mx-2">|</span>
            <i className="bi bi-person me-1"></i>
            <strong>{summary.total_employees.toLocaleString()}</strong> employees
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <div className="btn-group">
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => { setViewMode('table'); setSelectedPublicForMap(null); }}
            >
              <i className="bi bi-table me-2"></i>Table
            </button>
            <button
              className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={handleMapView}
            >
              <i className="bi bi-map me-2"></i>Map
            </button>
          </div>
          {hasPermission('create_publics') && (
            <Link to="/publics/new" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>Add Public Entity
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                name="province_id"
                value={filters.province_id}
                onChange={handleFilterChange}
              >
                <option value="">All Provinces</option>
                {provinces.map(province => (
                  <option key={province.code} value={province.code}>{province.name}</option>
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
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-fill" onClick={handleSearch}>
                  <i className="bi bi-search me-2"></i>Search
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClearFilters} title="Clear all filters">
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <>
          <div className="card mb-3">
            <div className="card-body py-2">
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">
                  {mapLoading ? 'Loading...' : `Showing ${showAllOnMap ? allPublics.length : publics.length} public entit${showAllOnMap ? (allPublics.length === 1 ? 'y' : 'ies') : (publics.length === 1 ? 'y' : 'ies')} on map`}
                </span>
                <div className="btn-group btn-group-sm">
                  <button
                    className={`btn ${showAllOnMap ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setShowAllOnMap(true)}
                    aria-label="Show all public entities on map"
                  >
                    <i className="bi bi-globe me-1"></i>All Entities
                  </button>
                  <button
                    className={`btn ${!showAllOnMap ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setShowAllOnMap(false)}
                    aria-label="Show current page only on map"
                  >
                    <i className="bi bi-file-earmark me-1"></i>Current Page Only
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body p-0">
              {mapLoading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '600px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <PublicMap publics={showAllOnMap ? allPublics : publics} selectedPublic={selectedPublicForMap} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : publics.length > 0 ? (
              <>
                <div className="table-responsive">
                  <table className="table table-hover table-list">
                    <thead>
                      <tr>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                          Name {getSortIcon('name')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>
                          Category {getSortIcon('category')}
                        </th>
                        <th>Location</th>
                        <th>Coordinates</th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('employee_count')}>
                          Employees {getSortIcon('employee_count')}
                        </th>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('visit_count')}>
                          Visits {getSortIcon('visit_count')}
                        </th>
                        <th>Educated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publics.map(publicEntity => (
                        <tr key={publicEntity.id}>
                          <td>{publicEntity.name}</td>
                          <td>
                            <span className="badge bg-info">{publicEntity.category}</span>
                          </td>
                          <td>
                            {publicEntity.city_name || '-'}
                            {publicEntity.district_name && `, ${publicEntity.district_name}`}
                          </td>
                          <td
                            onClick={() => publicEntity.latitude && publicEntity.longitude && handleCoordinateClick(publicEntity)}
                            style={{ cursor: publicEntity.latitude && publicEntity.longitude ? 'pointer' : 'default' }}
                          >
                            {publicEntity.latitude && publicEntity.longitude ? (
                              <span className="badge bg-success">
                                {publicEntity.latitude}, {publicEntity.longitude}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">No location</span>
                            )}
                          </td>
                          <td>{publicEntity.employee_count.toLocaleString()}</td>
                          <td>{publicEntity.visit_count}</td>
                          <td>
                            {publicEntity.is_educated ? (
                              <span className="badge bg-success">Yes</span>
                            ) : (
                              <span className="badge bg-secondary">No</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group">
                              {hasPermission('view_publics') && (
                                <Link
                                  to={`/publics/${publicEntity.id}`}
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  <i className="bi bi-eye"></i>
                                </Link>
                              )}
                              {hasPermission('update_publics') && (
                                <Link
                                  to={`/publics/${publicEntity.id}/edit`}
                                  className="btn btn-sm btn-outline-warning"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Link>
                              )}
                              {hasPermission('delete_publics') && (
                                <button
                                  onClick={() => handleDeleteClick(publicEntity)}
                                  className="btn btn-sm btn-outline-danger"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav>
                      <ul className="pagination">
                        <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          >
                            Previous
                          </button>
                        </li>

                        {[...Array(pagination.totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === pagination.totalPages ||
                            (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                          ) {
                            return (
                              <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                <button
                                  className="page-link"
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </button>
                              </li>
                            );
                          } else if (
                            pageNum === pagination.page - 2 ||
                            pageNum === pagination.page + 2
                          ) {
                            return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                          }
                          return null;
                        })}

                        <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-5 text-muted">
                No public entities found
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Public Entity"
        message={`Are you sure you want to delete "${publicToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default PublicList;
