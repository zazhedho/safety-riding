import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import accidentService from '../../services/accidentService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const AccidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
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

  const canPerformActions = user?.role === 'admin' || user?.role === 'staff';

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
        <div className="text-center py-5">
          <i className="bi bi-exclamation-triangle-fill fs-1 text-warning mb-3"></i>
          <h4>Accident Not Found</h4>
          <p className="text-muted">The accident you are looking for does not exist.</p>
          <button onClick={() => navigate('/accidents')} className="btn btn-primary">
            Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Accident Details</h2>
        <div>
          {canPerformActions && (
            <Link to={`/accidents/${id}/edit`} className="btn btn-warning me-2">
              <i className="bi bi-pencil-square me-2"></i>Edit
            </Link>
          )}
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Report: {accident.police_report_no}</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Left Column */}
            <div className="col-md-6">
              <div className="mb-4">
                <h5><i className="bi bi-calendar-event me-2 text-primary"></i>Date & Time</h5>
                <p className="mb-1"><strong>Date:</strong> {formatDate(accident.accident_date)}</p>
                <p className="mb-0"><strong>Time:</strong> {formatTime(accident.accident_time)}</p>
              </div>

              <div className="mb-4">
                <h5><i className="bi bi-geo-alt-fill me-2 text-primary"></i>Location</h5>
                <p className="mb-1"><strong>Address:</strong> {accident.location || 'N/A'}</p>
                <p className="mb-1"><strong>District:</strong> {accident.district_name || 'N/A'}</p>
                <p className="mb-1"><strong>City/Regency:</strong> {accident.city_name || 'N/A'}</p>
                <p className="mb-1"><strong>Province:</strong> {accident.province_name || 'N/A'}</p>
                <p className="mb-0"><strong>Coordinates:</strong> {accident.latitude}, {accident.longitude}</p>
              </div>

              <div className="mb-4">
                <h5><i className="bi bi-sign-turn-right-fill me-2 text-primary"></i>Road & Environment</h5>
                <p className="mb-1"><strong>Road Type:</strong> {accident.road_type || 'N/A'}</p>
                <p className="mb-1"><strong>Road Condition:</strong> {accident.road_condition || 'N/A'}</p>
                <p className="mb-0"><strong>Weather:</strong> {accident.weather_condition || 'N/A'}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-6">
              <div className="mb-4">
                <h5><i className="bi bi-cone-striped me-2 text-primary"></i>Accident Info</h5>
                <p className="mb-1"><strong>Accident Type:</strong> {accident.accident_type || 'N/A'}</p>
                <p className="mb-1"><strong>Vehicle Type:</strong> {accident.vehicle_type || 'N/A'}</p>
                <p className="mb-0"><strong>Vehicles Involved:</strong> {accident.vehicle_count}</p>
              </div>

              <div className="mb-4">
                <h5><i className="bi bi-people-fill me-2 text-primary"></i>Casualties</h5>
                <div className="d-flex justify-content-around text-center">
                  <div>
                    <p className="mb-0 fs-4 fw-bold text-danger">{accident.death_count}</p>
                    <small className="text-muted">Deaths</small>
                  </div>
                  <div>
                    <p className="mb-0 fs-4 fw-bold text-warning">{accident.injured_count}</p>
                    <small className="text-muted">Injured</small>
                  </div>
                  <div>
                    <p className="mb-0 fs-4 fw-bold text-info">{accident.minor_injured_count}</p>
                    <small className="text-muted">Minor Injuries</small>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h5><i className="bi bi-file-earmark-text-fill me-2 text-primary"></i>Official Report</h5>
                <p className="mb-1"><strong>Cause:</strong> {accident.cause_of_accident || 'N/A'}</p>
                <p className="mb-1"><strong>Description:</strong> {accident.description || 'N/A'}</p>
                <p className="mb-1"><strong>Police Station:</strong> {accident.police_station || 'N/A'}</p>
                <p className="mb-0"><strong>Officer:</strong> {accident.officer_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <hr />

          <div className="row text-muted small">
            <div className="col-md-6">
              <p className="mb-1"><strong>Created By:</strong> {accident.created_by || 'N/A'} on {formatDate(accident.created_at)}</p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="mb-1"><strong>Last Updated:</strong> {accident.updated_by || 'N/A'} on {formatDate(accident.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccidentDetail;
