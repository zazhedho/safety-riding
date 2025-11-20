import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import AuditInfoCard from '../../components/common/AuditInfoCard';
import publicService from '../../services/publicService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PublicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [publicEntity, setPublicEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchPublic();
  }, [id]);

  const fetchPublic = async () => {
    setLoading(true);
    try {
      const response = await publicService.getById(id);
      setPublicEntity(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load public entity details');
      navigate('/publics');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await publicService.delete(id);
      toast.success('Public entity deleted successfully');
      setShowDeleteModal(false);
      navigate('/publics');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete public entity');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </>
    );
  }

  if (!publicEntity) {
    return (
      <>
        <div className="alert alert-danger">Public entity not found</div>
      </>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Public Entity Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/publics">Public Entities</Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {hasPermission('update_publics') && (
            <Link to={`/publics/${id}/edit`} className="btn btn-warning">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {hasPermission('delete_publics') && (
            <button onClick={handleDeleteClick} className="btn btn-danger">
              <i className="bi bi-trash me-2"></i>Delete
            </button>
          )}
          <Link to="/publics" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Employees</h6>
                  <h4 className="mb-0 text-primary text-truncate">{publicEntity.employee_count.toLocaleString()}</h4>
                </div>
                <div className="text-primary flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-people-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Visits</h6>
                  <h4 className="mb-0 text-info text-truncate">{publicEntity.visit_count.toLocaleString()}</h4>
                </div>
                <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-calendar-check-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Category</h6>
                  <span className="badge bg-success">{publicEntity.category}</span>
                </div>
                <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-tag-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Educated</h6>
                  <h4 className="mb-0 text-warning">
                    {publicEntity.is_educated ? 'Yes' : 'No'}
                  </h4>
                </div>
                <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className={`bi ${publicEntity.is_educated ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Status Banner */}
      {publicEntity.is_educated ? (
        <div className="alert alert-success mb-4">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Educated Entity</strong> - This entity has received safety riding education.
          {publicEntity.last_visit_at && (
            <span className="ms-2">Last visit: {formatDate(publicEntity.last_visit_at)}</span>
          )}
        </div>
      ) : (
        <div className="alert alert-warning mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Not Yet Educated</strong> - This entity hasn't received safety riding education yet.
        </div>
      )}

      <div className="row">
        {/* Entity Information */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-building me-2"></i>Entity Information
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>Name</strong>
                    </td>
                    <td><strong>{publicEntity.name}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Category</strong>
                    </td>
                    <td>
                      <span className="badge bg-primary">{publicEntity.category}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Address</strong>
                    </td>
                    <td>{publicEntity.address}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Phone</strong>
                    </td>
                    <td>
                      {publicEntity.phone ? (
                        <a href={`tel:${publicEntity.phone}`} className="text-decoration-none">
                          <i className="bi bi-telephone me-1"></i>{publicEntity.phone}
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Email</strong>
                    </td>
                    <td>
                      {publicEntity.email ? (
                        <a href={`mailto:${publicEntity.email}`} className="text-decoration-none">
                          <i className="bi bi-envelope me-1"></i>{publicEntity.email}
                        </a>
                      ) : '-'}
                    </td>
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
                      <strong>Province</strong>
                    </td>
                    <td>{publicEntity.province_name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>City/Regency</strong>
                    </td>
                    <td>{publicEntity.city_name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>District</strong>
                    </td>
                    <td>{publicEntity.district_name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Postal Code</strong>
                    </td>
                    <td>{publicEntity.postal_code || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Coordinates</strong>
                    </td>
                    <td>
                      {publicEntity.latitude && publicEntity.longitude ? (
                        <>
                          <span className="badge bg-success me-2">
                            {publicEntity.latitude}, {publicEntity.longitude}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${publicEntity.latitude},${publicEntity.longitude}`}
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

      {/* Audit Information */}
      <AuditInfoCard data={publicEntity} />

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Public Entity"
        message={`Are you sure you want to delete "${publicEntity?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default PublicDetail;
