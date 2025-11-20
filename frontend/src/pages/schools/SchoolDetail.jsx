import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import schoolService from '../../services/schoolService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const SchoolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchSchool();
  }, [id]);

  const fetchSchool = async () => {
    setLoading(true);
    try {
      const response = await schoolService.getById(id);
      setSchool(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load school details');
      navigate('/schools');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await schoolService.delete(id);
      toast.success('School deleted successfully');
      setShowDeleteModal(false);
      navigate('/schools');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete school');
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

  if (!school) {
    return (
      <>
        <div className="alert alert-danger">School not found</div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>School Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/schools">Schools</Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {hasPermission('update_schools') && (
            <Link to={`/schools/${id}/edit`} className="btn btn-warning">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {hasPermission('delete_schools') && (
            <button onClick={handleDeleteClick} className="btn btn-danger">
              <i className="bi bi-trash me-2"></i>Delete
            </button>
          )}
          <Link to="/schools" className="btn btn-secondary">
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
                  <h6 className="text-muted mb-1 small">Students</h6>
                  <h4 className="mb-0 text-primary text-truncate">{school.student_count.toLocaleString()}</h4>
                </div>
                <div className="text-primary flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-people-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Teachers</h6>
                  <h4 className="mb-0 text-success text-truncate">{school.teacher_count.toLocaleString()}</h4>
                </div>
                <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-person-badge-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Majors</h6>
                  <h4 className="mb-0 text-info text-truncate">{school.major_count.toLocaleString()}</h4>
                </div>
                <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-book-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Visits</h6>
                  <h4 className="mb-0 text-warning text-truncate">{school.visit_count.toLocaleString()}</h4>
                </div>
                <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-calendar-check-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Status Banner */}
      {school.is_educated ? (
        <div className="alert alert-success mb-4">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Educated School</strong> - This school has received safety riding education.
          {school.last_visit_at && (
            <span className="ms-2">Last visit: {formatDate(school.last_visit_at)}</span>
          )}
        </div>
      ) : (
        <div className="alert alert-warning mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Not Yet Educated</strong> - This school hasn't received safety riding education yet.
        </div>
      )}

      <div className="row">
        {/* School Information */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-building me-2"></i>School Information
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>School Name</strong>
                    </td>
                    <td><strong>{school.name}</strong></td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>NPSN</strong>
                    </td>
                    <td>
                      <span className="badge bg-primary">{school.npsn}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Address</strong>
                    </td>
                    <td>{school.address}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Phone</strong>
                    </td>
                    <td>
                      {school.phone ? (
                        <a href={`tel:${school.phone}`} className="text-decoration-none">
                          <i className="bi bi-telephone me-1"></i>{school.phone}
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Email</strong>
                    </td>
                    <td>
                      {school.email ? (
                        <a href={`mailto:${school.email}`} className="text-decoration-none">
                          <i className="bi bi-envelope me-1"></i>{school.email}
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
                    <td>{school.province_name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>City/Regency</strong>
                    </td>
                    <td>{school.city_name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>District</strong>
                    </td>
                    <td>{school.district_name}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Postal Code</strong>
                    </td>
                    <td>{school.postal_code || '-'}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Coordinates</strong>
                    </td>
                    <td>
                      {school.latitude && school.longitude ? (
                        <>
                          <span className="badge bg-success me-2">
                            {school.latitude}, {school.longitude}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${school.latitude},${school.longitude}`}
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
                {formatDate(school.created_at)}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Created By:</strong> {school.created_by || '-'}
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong className="text-muted">Updated At:</strong>{' '}
                {formatDate(school.updated_at)}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Updated By:</strong> {school.updated_by || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete School"
        message={`Are you sure you want to delete school "${school?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default SchoolDetail;