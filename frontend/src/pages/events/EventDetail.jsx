import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Photo upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [captions, setCaptions] = useState({});
  const [uploading, setUploading] = useState(false);

  // Photo delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  // Cleanup photo previews on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [photoPreviews]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await eventService.getById(id);
      setEvent(response.data.data);
    } catch (error) {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
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

      await eventService.addPhotos(id, formData);
      toast.success('Photos uploaded successfully');

      // Clear selection
      setSelectedFiles([]);
      setPhotoPreviews([]);
      setCaptions({});

      // Refresh event data
      fetchEvent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (photo) => {
    setPhotoToDelete(photo);
    setShowDeleteModal(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!photoToDelete) return;

    try {
      await eventService.deletePhoto(photoToDelete.id);
      toast.success('Photo deleted successfully');
      setShowDeleteModal(false);
      setPhotoToDelete(null);
      fetchEvent();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete photo');
      setShowDeleteModal(false);
      setPhotoToDelete(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
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

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <h2>Event not found</h2>
          <Link to="/events" className="btn btn-primary">Back to list</Link>
        </div>
      </DashboardLayout>
    );
  }

  const renderStatusBadge = (status) => {
    let color = 'warning';
    if (status === 'completed') color = 'success';
    if (status === 'ongoing') color = 'primary';
    if (status === 'cancelled') color = 'danger';
    return <span className={`badge bg-${color}`}>{status.toUpperCase()}</span>;
  };

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">{event.title}</h2>
          <p className="text-muted">Organized for {event.school?.name || 'N/A'}</p>
        </div>
        <Link to="/events" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to List
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>Participants & Notes</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Photos</button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          <div className="tab-content p-3">
            {activeTab === 'details' && (
              <div>
                <dl className="row">
                  <dt className="col-sm-3">Event Type</dt>
                  <dd className="col-sm-9">{event.event_type}</dd>

                  <dt className="col-sm-3">Event Date</dt>
                  <dd className="col-sm-9">{formatDate(event.event_date)}</dd>

                  <dt className="col-sm-3">Time</dt>
                  <dd className="col-sm-9">{formatTime(event.start_time)} - {formatTime(event.end_time)}</dd>

                  <dt className="col-sm-3">Location</dt>
                  <dd className="col-sm-9">{event.school?.name} - {event.location}</dd>

                  <dt className="col-sm-3">Status</dt>
                  <dd className="col-sm-9">{renderStatusBadge(event.status)}</dd>

                  <dt className="col-sm-3">Description</dt>
                  <dd className="col-sm-9">{event.description}</dd>
                </dl>
              </div>
            )}

            {activeTab === 'participants' && (
              <div>
                <dl className="row">
                  <dt className="col-sm-3">Instructor</dt>
                  <dd className="col-sm-9">{event.instructor_name} ({event.instructor_phone})</dd>

                  <dt className="col-sm-3">Target Audience</dt>
                  <dd className="col-sm-9">{event.target_audience}</dd>

                  <dt className="col-sm-3">Participants</dt>
                  <dd className="col-sm-9">{event.attendees_count}</dd>

                  <dt className="col-sm-3">Notes</dt>
                  <dd className="col-sm-9">{event.notes || '-'}</dd>
                </dl>
              </div>
            )}

            {activeTab === 'photos' && (
              <div>
                {/* Upload Form */}
                {hasPermission('update_events') && (
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
                <h5 className="mb-3">Event Photos</h5>
                {event.photos && event.photos.length > 0 ? (
                  <div className="row">
                    {event.photos.map(photo => (
                      <div key={photo.id} className="col-md-4 mb-3">
                        <div className="card shadow-sm">
                          <img src={photo.photo_url} className="card-img-top" alt={photo.caption} style={{ height: '250px', objectFit: 'cover' }} />
                          <div className="card-body">
                            {photo.caption && <p className="card-text">{photo.caption}</p>}
                            {hasPermission('delete_events') && (
                              <button
                                className="btn btn-danger btn-sm w-100"
                                onClick={() => handleDeleteClick(photo)}
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
                    <p className="mt-2">No photos for this event yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="card-footer text-muted">
          Created on {new Date(event.created_at).toLocaleString()} | Last updated on {new Date(event.updated_at).toLocaleString()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Photo"
        message={`Are you sure you want to delete this photo? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default EventDetail;
