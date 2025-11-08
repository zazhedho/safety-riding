import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
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
  }, [pagination.page, filters]);

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
      if (filters.province_id) params['filters[province_id]'] = filters.province_id;
      if (filters.city_id) params['filters[city_id]'] = filters.city_id;
      if (filters.district_id) params['filters[district_id]'] = filters.district_id;
      if (filters.accident_type) params['filters[accident_type]'] = filters.accident_type;
      if (filters.vehicle_type) params['filters[vehicle_type]'] = filters.vehicle_type;
      if (filters.police_station) params['filters[police_station]'] = filters.police_station;
      if (filters.search) params.search = filters.search;

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
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAccidents();
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
    <DashboardLayout>
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
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
              <select
                className="form-select"
                name="city_id"
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
                name="police_station"
                value={filters.police_station}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary w-100" onClick={handleSearch}>
                <i className="bi bi-search me-2"></i>Search
              </button>
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
              <table className="table table-hover">
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
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                          )}
                          {hasPermission('update_accidents') && (
                            <Link
                              to={`/accidents/${accident.id}/edit`}
                              className="btn btn-sm btn-outline-warning"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                          {hasPermission('delete_accidents') && (
                            <button
                              onClick={() => handleDeleteClick(accident)}
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
    </DashboardLayout>
  );
};

export default AccidentList;
