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
  const [activeTab, setActiveTab] = useState('details');

  // Photo upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [captions, setCaptions] = useState({});
  const [uploading, setUploading] = useState(false);

  // Photo delete states
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  // Accident delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchAccident();
  }, [id]);

  // Cleanup photo previews on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [photoPreviews]);

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

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast.error('Only JPEG, PNG, and GIF images are allowed');
      return;
    }

    // Validate file sizes (max 5MB per file)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Each photo must be less than 5MB');
      return;
    }

    setSelectedFiles(files);

    // Create previews
    const previews = files.map((file, index) => ({
      id: index,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPhotoPreviews(previews);

    // Initialize captions
    const initialCaptions = {};
    files.forEach((_, index) => {
      initialCaptions[index] = '';
    });
    setCaptions(initialCaptions);
  };

  // Handle caption change
  const handleCaptionChange = (index, value) => {
    setCaptions(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Handle photo upload
  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select photos to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();

      // Append files
      selectedFiles.forEach((file) => {
        formData.append('photos', file);
      });

      // Append captions
      selectedFiles.forEach((_, index) => {
        formData.append('captions', captions[index] || '');
      });

      // Append photo orders
      selectedFiles.forEach((_, index) => {
        formData.append('photo_orders', (index + 1).toString());
      });

      await accidentService.addPhotos(id, formData);
      toast.success('Photos uploaded successfully');

      // Clear selection
      setSelectedFiles([]);
      setPhotoPreviews([]);
      setCaptions({});

      // Refresh accident data
      fetchAccident();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Handle photo delete click
  const handlePhotoDeleteClick = (photo) => {
    setPhotoToDelete(photo);
    setShowDeletePhotoModal(true);
  };

  // Handle photo delete confirm
  const handlePhotoDeleteConfirm = async () => {
    if (!photoToDelete) return;

    try {
      await accidentService.deletePhoto(photoToDelete.id);
      toast.success('Photo deleted successfully');
      setShowDeletePhotoModal(false);
      setPhotoToDelete(null);
      fetchAccident();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete photo');
      setShowDeletePhotoModal(false);
      setPhotoToDelete(null);
    }
  };

  // Handle photo delete cancel
  const handlePhotoDeleteCancel = () => {
    setShowDeletePhotoModal(false);
    setPhotoToDelete(null);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedFiles([]);
    setPhotoPreviews([]);
    setCaptions({});
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
          <div className="card border-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Photos</h6>
                  <h4 className="mb-0 text-success text-truncate">{accident.photos?.length || 0}</h4>
                </div>
                <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-images"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Photos</button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          <div className="tab-content">
            {activeTab === 'details' && (
              <>
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
              </>
            )}

            {activeTab === 'photos' && (
              <div>
                {/* Upload Form */}
                {hasPermission('update_accidents') && (
                  <div className="card mb-4 border-primary">
                    <div className="card-header bg-primary text-white">
                      <h5 className="mb-0"><i className="bi bi-cloud-upload me-2"></i>Upload Photos</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label className="form-label">Select Photos (Max 5 photos, 5MB each)</label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          multiple
                          onChange={handleFileSelect}
                          disabled={uploading}
                        />
                        <small className="text-muted">Accepted formats: JPEG, PNG, GIF</small>
                      </div>

                      {/* Preview Selected Photos */}
                      {photoPreviews.length > 0 && (
                        <div className="mt-3">
                          <h6>Preview ({photoPreviews.length} photo{photoPreviews.length > 1 ? 's' : ''} selected)</h6>
                          <div className="row">
                            {photoPreviews.map((preview, index) => (
                              <div key={preview.id} className="col-md-4 mb-3">
                                <div className="card">
                                  <img src={preview.url} className="card-img-top" alt={preview.name} style={{ height: '200px', objectFit: 'cover' }} />
                                  <div className="card-body">
                                    <label className="form-label small">Caption (optional)</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Enter caption..."
                                      value={captions[index] || ''}
                                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                                      disabled={uploading}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary"
                              onClick={handleUploadPhotos}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-upload me-2"></i>
                                  Upload Photos
                                </>
                              )}
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={handleClearSelection}
                              disabled={uploading}
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Existing Photos */}
                <h5 className="mb-3">Accident Photos</h5>
                {accident.photos && accident.photos.length > 0 ? (
                  <div className="row">
                    {accident.photos.map(photo => (
                      <div key={photo.id} className="col-md-4 mb-3">
                        <div className="card shadow-sm">
                          <img src={photo.photo_url} className="card-img-top" alt={photo.caption} style={{ height: '250px', objectFit: 'cover' }} />
                          <div className="card-body">
                            {photo.caption && <p className="card-text">{photo.caption}</p>}
                            {hasPermission('delete_accidents') && (
                              <button
                                className="btn btn-danger btn-sm w-100"
                                onClick={() => handlePhotoDeleteClick(photo)}
                              >
                                <i className="bi bi-trash me-2"></i>Delete Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-images" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-2">No photos for this accident yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="card mt-4">
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

      {/* Delete Photo Confirmation Modal */}
      <ConfirmationModal
        show={showDeletePhotoModal}
        title="Delete Photo"
        message={`Are you sure you want to delete this photo? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handlePhotoDeleteConfirm}
        onCancel={handlePhotoDeleteCancel}
      />

      {/* Delete Accident Confirmation Modal */}
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
