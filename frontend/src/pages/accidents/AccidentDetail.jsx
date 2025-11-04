import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import accidentService from '../../services/accidentService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const AccidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAccident();
  }, [id]);

  const fetchAccident = async () => {
    setLoading(true);
    try {
      const response = await accidentService.getById(id);
      setAccident(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load accident details');
      navigate('/accidents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await accidentService.delete(id);
      toast.success('Accident record deleted successfully');
      setShowDeleteModal(false);
      navigate('/accidents');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete accident record');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    // Assuming time is in HH:mm:ss or HH:mm format
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(hours, minutes, 0);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!accident) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">Accident record not found</div>
      </DashboardLayout>
    );
  }

  const totalCasualties = accident.death_count + accident.injured_count + accident.minor_injured_count;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Accident Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/accidents">Accidents</Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {hasPermission('update_accidents') && (
            <Link to={`/accidents/${id}/edit`} className="btn btn-warning">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {hasPermission('delete_accidents') && (
            <button onClick={handleDeleteClick} className="btn btn-danger">
              <i className="bi bi-trash me-2"></i>Delete
            </button>
          )}
          <Link to="/accidents" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
        </div>
      </div>

      {/* Police Report Banner */}
      <div className="alert alert-warning mb-4">
        <h4 className="alert-heading mb-1">
          <i className="bi bi-file-earmark-text me-2"></i>Police Report: {accident.police_report_no}
        </h4>
        <p className="mb-0">
          <i className="bi bi-calendar3 me-2"></i>
          {formatDate(accident.accident_date)} at {formatTime(accident.accident_time)}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-danger h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Deaths</h6>
                  <h4 className="mb-0 text-danger text-truncate">{accident.death_count.toLocaleString()}</h4>
                </div>
                <div className="text-danger flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-heartbreak-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-warning h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Injured</h6>
                  <h4 className="mb-0 text-warning text-truncate">{accident.injured_count.toLocaleString()}</h4>
                </div>
                <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-bandaid-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-info h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Minor Injuries</h6>
                  <h4 className="mb-0 text-info text-truncate">{accident.minor_injured_count.toLocaleString()}</h4>
                </div>
                <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-prescription2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Vehicles</h6>
                  <h4 className="mb-0 text-primary text-truncate">{accident.vehicle_count.toLocaleString()}</h4>
                </div>
                <div className="text-primary flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-car-front-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Accident Information */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-cone-striped me-2"></i>Accident Information
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>Accident Type</strong>
                    </td>
                    <td>
                      <span className="badge bg-danger">{accident.accident_type || 'N/A'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Vehicle Type</strong>
                    </td>
                    <td><span className="badge bg-primary">{accident.vehicle_type || 'N/A'}</span></td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Total Casualties</strong>
                    </td>
                    <td><strong>{totalCasualties}</strong> people</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Cause</strong>
                    </td>
                    <td>{accident.cause_of_accident || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Description</strong>
                    </td>
                    <td>{accident.description || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-geo-alt me-2"></i>Location Information
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>Address</strong>
                    </td>
                    <td>{accident.location || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>District</strong>
                    </td>
                    <td>{accident.district_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>City/Regency</strong>
                    </td>
                    <td>{accident.city_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Province</strong>
                    </td>
                    <td>{accident.province_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Coordinates</strong>
                    </td>
                    <td>
                      {accident.latitude && accident.longitude ? (
                        <>
                          <span className="badge bg-success me-2">
                            {accident.latitude}, {accident.longitude}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${accident.latitude},${accident.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="bi bi-map me-1"></i>View Map
                          </a>
                        </>
                      ) : (
                        <span className="badge bg-secondary">No coordinates</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Road & Environment */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-sign-turn-right me-2"></i>Road & Environment
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>Road Type</strong>
                    </td>
                    <td>{accident.road_type || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Road Condition</strong>
                    </td>
                    <td>
                      <span className={`badge ${accident.road_condition === 'good' ? 'bg-success' : accident.road_condition === 'fair' ? 'bg-warning' : 'bg-danger'}`}>
                        {accident.road_condition || 'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Weather Condition</strong>
                    </td>
                    <td>
                      <span className={`badge ${accident.weather_condition === 'sunny' || accident.weather_condition === 'clear' ? 'bg-success' : 'bg-info'}`}>
                        {accident.weather_condition || 'N/A'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Official Report */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-shield-check me-2"></i>Official Report
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>Police Station</strong>
                    </td>
                    <td><strong>{accident.police_station || 'N/A'}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Officer Name</strong>
                    </td>
                    <td>{accident.officer_name || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Report Number</strong>
                    </td>
                    <td>
                      <span className="badge bg-warning">{accident.police_report_no}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>Audit Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong className="text-muted">Created At:</strong>{' '}
                {new Date(accident.created_at).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Created By:</strong> {accident.created_by || '-'}
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong className="text-muted">Updated At:</strong>{' '}
                {new Date(accident.updated_at).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Updated By:</strong> {accident.updated_by || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Accident"
        message={`Are you sure you want to delete accident report "${accident?.police_report_no}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default AccidentDetail;
