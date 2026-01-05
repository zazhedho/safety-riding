import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import poldaService from '../../services/poldaService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PoldaDetail = () => {
  const { hasPermission } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [poldaData, setPoldaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchPoldaData();
  }, [id]);

  const fetchPoldaData = async () => {
    try {
      setLoading(true);
      const response = await poldaService.getById(id);
      setPoldaData(response.data.data);
    } catch (error) {
      console.error('Error fetching POLDA data:', error);
      toast.error('Failed to fetch POLDA data');
      navigate('/polda-accidents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await poldaService.delete(id);
      toast.success('POLDA data deleted successfully');
      navigate('/polda-accidents');
    } catch (error) {
      console.error('Error deleting POLDA data:', error);
      toast.error('Failed to delete POLDA data');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!poldaData) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              POLDA data not found
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalCasualties = poldaData.total_deaths + poldaData.total_severe_injury + poldaData.total_minor_injury;

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header Card */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-0">
                  <i className="bi bi-clipboard-data me-2"></i>
                  POLDA Data Details
                </h5>
                <small className="text-muted">
                  {poldaData.police_unit} - {poldaData.period}
                </small>
              </div>
              <div className="btn-group" role="group">
                <Link to="/polda-accidents" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to List
                </Link>
                {hasPermission('update_polda_accidents') && (
                  <Link to={`/polda-accidents/${id}/edit`} className="btn btn-outline-warning">
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </Link>
                )}
                {hasPermission('delete_polda_accidents') && (
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <i className="bi bi-exclamation-triangle display-4 text-primary"></i>
                  <h3 className="mt-2 mb-1">{poldaData.total_accidents}</h3>
                  <p className="text-muted mb-0">Total Accidents</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-danger">
                <div className="card-body">
                  <i className="bi bi-x-circle display-4 text-danger"></i>
                  <h3 className="mt-2 mb-1">{poldaData.total_deaths}</h3>
                  <p className="text-muted mb-0">Deaths</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-warning">
                <div className="card-body">
                  <i className="bi bi-bandaid display-4 text-warning"></i>
                  <h3 className="mt-2 mb-1">{poldaData.total_severe_injury}</h3>
                  <p className="text-muted mb-0">Severe Injury</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-success">
                <div className="card-body">
                  <i className="bi bi-heart-pulse display-4 text-success"></i>
                  <h3 className="mt-2 mb-1">{poldaData.total_minor_injury}</h3>
                  <p className="text-muted mb-0">Minor Injury</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Detailed Information
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="fw-bold">Police Unit:</td>
                        <td>{poldaData.police_unit}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Period:</td>
                        <td>
                          <span className="badge bg-info">{poldaData.period}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Total Accidents:</td>
                        <td>
                          <span className="badge bg-primary">{poldaData.total_accidents}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="fw-bold">Total Casualties:</td>
                        <td>
                          <span className="badge bg-secondary">{totalCasualties}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Created At:</td>
                        <td>{new Date(poldaData.created_at).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Updated At:</td>
                        <td>{new Date(poldaData.updated_at).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Card */}
          <div className="card">
            <div className="card-header">
              <h6 className="card-title mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Statistical Analysis
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Casualty Breakdown</h6>
                  <div className="progress mb-3" style={{ height: '25px' }}>
                    {poldaData.total_deaths > 0 && (
                      <div
                        className="progress-bar bg-danger"
                        role="progressbar"
                        style={{ width: `${(poldaData.total_deaths / totalCasualties) * 100}%` }}
                        title={`Deaths: ${poldaData.total_deaths}`}
                      >
                        {poldaData.total_deaths}
                      </div>
                    )}
                    {poldaData.total_severe_injury > 0 && (
                      <div
                        className="progress-bar bg-warning"
                        role="progressbar"
                        style={{ width: `${(poldaData.total_severe_injury / totalCasualties) * 100}%` }}
                        title={`Severe Injury: ${poldaData.total_severe_injury}`}
                      >
                        {poldaData.total_severe_injury}
                      </div>
                    )}
                    {poldaData.total_minor_injury > 0 && (
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${(poldaData.total_minor_injury / totalCasualties) * 100}%` }}
                        title={`Minor Injury: ${poldaData.total_minor_injury}`}
                      >
                        {poldaData.total_minor_injury}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between small">
                    <span><i className="bi bi-square-fill text-danger"></i> Deaths</span>
                    <span><i className="bi bi-square-fill text-warning"></i> Severe</span>
                    <span><i className="bi bi-square-fill text-success"></i> Minor</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <h6>Key Metrics</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <strong>Fatality Rate:</strong> 
                      <span className="ms-2 badge bg-danger">
                        {poldaData.total_accidents > 0 
                          ? ((poldaData.total_deaths / poldaData.total_accidents) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </li>
                    <li className="mb-2">
                      <strong>Injury Rate:</strong> 
                      <span className="ms-2 badge bg-warning">
                        {poldaData.total_accidents > 0 
                          ? (((poldaData.total_severe_injury + poldaData.total_minor_injury) / poldaData.total_accidents) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </li>
                    <li className="mb-2">
                      <strong>Severity Index:</strong> 
                      <span className="ms-2 badge bg-info">
                        {totalCasualties > 0 
                          ? ((poldaData.total_deaths * 3 + poldaData.total_severe_injury * 2 + poldaData.total_minor_injury) / totalCasualties).toFixed(1)
                          : 0}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete POLDA Data"
        message={`Are you sure you want to delete data for ${poldaData.police_unit} - ${poldaData.period}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PoldaDetail;
