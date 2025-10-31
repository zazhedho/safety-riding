import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import accidentService from '../../services/accidentService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const AccidentList = () => {
  const [accidents, setAccidents] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    province_id: '',
    search: ''
  });

  useEffect(() => {
    fetchProvinces();
    fetchAccidents();
  }, []);

  const fetchProvinces = async () => {
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data || []);
    } catch (error) {
      toast.error('Failed to load provinces');
    }
  };

  const fetchAccidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.province_id) params.province_id = filters.province_id;
      if (filters.search) params.search = filters.search;

      const response = await accidentService.getAll(params);
      setAccidents(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load accidents');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchAccidents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this accident record?')) return;

    try {
      await accidentService.delete(id);
      toast.success('Accident record deleted successfully');
      fetchAccidents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete accident');
    }
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
        <Link to="/accidents/new" className="btn btn-danger">
          <i className="bi bi-plus-circle me-2"></i>Add Accident Record
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by police report no..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-4">
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
            <div className="col-md-4">
              <button className="btn btn-primary" onClick={handleSearch}>
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
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : accidents.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Police Report No</th>
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
                          {accident.fatalities || 0} deaths
                        </span>
                        <span className="badge bg-warning">
                          {accident.injured || 0} injured
                        </span>
                      </td>
                      <td>{accident.weather_condition || '-'}</td>
                      <td>
                        <div className="btn-group">
                          <Link
                            to={`/accidents/${accident.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link
                            to={`/accidents/${accident.id}/edit`}
                            className="btn btn-sm btn-outline-warning"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            onClick={() => handleDelete(accident.id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              No accident records found
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccidentList;
