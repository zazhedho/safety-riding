import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import accidentService from '../../services/accidentService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const AccidentList = () => {
  const { hasPermission } = useAuth();
  const [accidents, setAccidents] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState(null);
  const [filters, setFilters] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    accident_type: '',
    vehicle_type: '',
    police_station: '',
    search: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    accident_type: '',
    vehicle_type: '',
    police_station: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    fetchAccidents();
  }, [pagination.page, appliedFilters]);

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

  const fetchAccidents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (appliedFilters.province_id) params['filters[province_id]'] = appliedFilters.province_id;
      if (appliedFilters.city_id) params['filters[city_id]'] = appliedFilters.city_id;
      if (appliedFilters.district_id) params['filters[district_id]'] = appliedFilters.district_id;
      if (appliedFilters.accident_type) params['filters[accident_type]'] = appliedFilters.accident_type;
      if (appliedFilters.vehicle_type) params['filters[vehicle_type]'] = appliedFilters.vehicle_type;
      if (appliedFilters.police_station) params['filters[police_station]'] = appliedFilters.police_station;
      if (appliedFilters.search) params.search = appliedFilters.search;

      const response = await accidentService.getAll(params);
      setAccidents(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0
      }));
    } catch (error) {
      toast.error('Failed to load accidents');
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
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
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
      accident_type: '',
      vehicle_type: '',
      police_station: '',
      search: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    setCities([]);
    setDistricts([]);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteClick = (accident) => {
    setAccidentToDelete(accident);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accidentToDelete) return;

    try {
      await accidentService.delete(accidentToDelete.id);
      toast.success('Accident record deleted successfully');
      fetchAccidents();
      setShowDeleteModal(false);
      setAccidentToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete accident');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAccidentToDelete(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Accident Records</h2>
        {hasPermission('create_accidents') && (
          <Link to="/accidents/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Accident Record
          </Link>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by report no, location..."
                aria-label="Search accidents by report number or location"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="province_id"
                aria-label="Filter by province"
                value={filters.province_id}
                onChange={handleFilterChange}
              >
                <option value="">All Provinces</option>
                {provinces.map(prov => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="city_id"
                aria-label="Filter by city"
                value={filters.city_id}
                onChange={handleFilterChange}
                disabled={!filters.province_id}
              >
                <option value="">All Cities/Regencies</option>
                {cities.map(city => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="district_id"
                aria-label="Filter by district"
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
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Accident Type"
                aria-label="Filter by accident type"
                name="accident_type"
                value={filters.accident_type}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Vehicle Type"
                aria-label="Filter by vehicle type"
                name="vehicle_type"
                value={filters.vehicle_type}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Police Station"
                aria-label="Filter by police station"
                name="police_station"
                value={filters.police_station}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-fill" onClick={handleSearch} aria-label="Apply filters">
                  <i className="bi bi-search me-2" aria-hidden="true"></i>Search
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClearFilters} title="Clear all filters" aria-label="Clear all filters">
                  <i className="bi bi-x-circle" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : accidents.length > 0 ? (
            <>
            <div className="table-responsive">
              <table className="table table-hover table-list">
                <thead>
                  <tr>
                    <th>Report Number</th>
                    <th>Date & Time</th>
                    <th>Location</th>
                    <th>Casualties</th>
                    <th>Weather</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accidents.map(accident => (
                    <tr key={accident.id}>
                      <td><strong>{accident.police_report_no}</strong></td>
                      <td>
                        {formatDate(accident.accident_date)}<br />
                        <small className="text-muted">{accident.accident_time}</small>
                      </td>
                      <td>
                        {accident.location}<br />
                        <small className="text-muted">{accident.province_name}</small>
                      </td>
                      <td>
                        <span className="badge bg-danger me-1">
                          {accident.death_count || 0} deaths
                        </span>
                        <span className="badge bg-warning">
                          {accident.injured_count || 0} injured
                        </span>
                      </td>
                      <td>{accident.weather_condition || '-'}</td>
                      <td>
                        <div className="btn-group">
                          {hasPermission('view_accidents') && (
                            <Link
                              to={`/accidents/${accident.id}`}
                              className="btn btn-sm btn-outline-primary"
                              aria-label={`View details for accident ${accident.police_report_no}`}
                            >
                              <i className="bi bi-eye" aria-hidden="true"></i>
                            </Link>
                          )}
                          {hasPermission('update_accidents') && (
                            <Link
                              to={`/accidents/${accident.id}/edit`}
                              className="btn btn-sm btn-outline-warning"
                              aria-label={`Edit accident ${accident.police_report_no}`}
                            >
                              <i className="bi bi-pencil" aria-hidden="true"></i>
                            </Link>
                          )}
                          {hasPermission('delete_accidents') && (
                            <button
                              onClick={() => handleDeleteClick(accident)}
                              className="btn btn-sm btn-outline-danger"
                              aria-label={`Delete accident ${accident.police_report_no}`}
                            >
                              <i className="bi bi-trash" aria-hidden="true"></i>
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
                        aria-label="Previous page"
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
                              aria-label={`Go to page ${pageNum}`}
                              aria-current={pagination.page === pageNum ? 'page' : undefined}
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
                        aria-label="Next page"
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
              No accident records found
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Accident"
        message={`Are you sure you want to delete accident report "${accidentToDelete?.police_report_no}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default AccidentList;
