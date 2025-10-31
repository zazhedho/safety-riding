import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import SchoolMap from '../../components/maps/SchoolMap';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const SchoolList = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'map'
  const [filters, setFilters] = useState({
    province_id: '',
    city_id: '',
    district_id: '',
    search: ''
  });
  const [selectedSchoolForMap, setSelectedSchoolForMap] = useState(null);

  useEffect(() => {
    fetchProvinces();
    fetchSchools();
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

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.province_id) params['filters[province_id]'] = filters.province_id;
      if (filters.city_id) params['filters[city_id]'] = filters.city_id;
      if (filters.district_id) params['filters[district_id]'] = filters.district_id;
      if (filters.search) params.search = filters.search;

      const response = await schoolService.getAll(params);
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load schools');
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
      ...(name === 'city_id' && { district_id: '', selectedSchoolForMap: null })
    }));
  };

  const handleSearch = () => {
    fetchSchools();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school?')) return;

    try {
      await schoolService.delete(id);
      toast.success('School deleted successfully');
      fetchSchools();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete school');
    }
  };

  const handleCoordinateClick = (school) => {
    setSelectedSchoolForMap(school);
    setViewMode('map');
  };

  const canPerformActions = user?.role === 'admin' || user?.role === 'staff';
  const canView = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'viewer';

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Schools Management</h2>
        <div className="d-flex gap-2">
          <div className="btn-group">
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => { setViewMode('table'); setSelectedSchoolForMap(null); }}
            >
              <i className="bi bi-table me-2"></i>Table
            </button>
            <button
              className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('map')}
            >
              <i className="bi bi-map me-2"></i>Map
            </button>
          </div>
          {canPerformActions && (
            <Link to="/schools/new" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>Add School
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
                placeholder="Search by name or NPSN..."
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
            <div className="col-12">
              <button className="btn btn-primary" onClick={handleSearch}>
                <i className="bi bi-search me-2"></i>Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="card">
          <div className="card-body p-0">
            <SchoolMap schools={schools} selectedSchool={selectedSchoolForMap} />
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : schools.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>NPSN</th>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                      <th>Coordinates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map(school => (
                      <tr key={school.id}>
                        <td>{school.npsn}</td>
                        <td>{school.name}</td>
                        <td>{school.address}</td>
                        <td>{school.phone || '-'}</td>
                        <td
                          onClick={() => school.latitude && school.longitude && handleCoordinateClick(school)}
                          style={{ cursor: school.latitude && school.longitude ? 'pointer' : 'default' }}
                        >
                          {school.latitude && school.longitude ? (
                            <span className="badge bg-success">
                              {school.latitude}, {school.longitude}
                            </span>
                          ) : (
                            <span className="badge bg-secondary">No location</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group">
                            {canView && (
                              <Link
                                to={`/schools/${school.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                            )}
                            {canPerformActions && (
                              <>
                                <Link
                                  to={`/schools/${school.id}/edit`}
                                  className="btn btn-sm btn-outline-warning"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Link>
                                <button
                                  onClick={() => handleDelete(school.id)}
                                  className="btn btn-sm btn-outline-danger"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                No schools found
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SchoolList;
