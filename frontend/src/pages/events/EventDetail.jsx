import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
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

  // Event delete states
  const [showDeleteEventModal, setShowDeleteEventModal] = useState(false);

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
      toast.error(error.response?.data?.message || 'Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteEventModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await eventService.delete(id);
      toast.success('Event deleted successfully');
      setShowDeleteEventModal(false);
      navigate('/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteEventModal(false);
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

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    const number = Number(value);
    if (Number.isNaN(number)) return '-';
    return number.toLocaleString('id-ID');
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    const number = Number(value);
    if (Number.isNaN(number)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(number);
  };

  const formatPaymentMethod = (method) => {
    if (!method) return '-';
    return method.charAt(0).toUpperCase() + method.slice(1);
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
      toast.error(error.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Handle photo delete click
  const handlePhotoDeleteClick = (photo) => {
    setPhotoToDelete(photo);
    setShowDeleteModal(true);
  };

  // Handle photo delete confirm
  const handlePhotoDeleteConfirm = async () => {
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

  // Handle photo delete cancel
  const handlePhotoDeleteCancel = () => {
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
        <div className="alert alert-danger">Event not found</div>
      </DashboardLayout>
    );
  }

  const renderStatusBadge = (status) => {
    const statusMap = {
      'planned': { class: 'bg-info', label: 'Planned' },
      'ongoing': { class: 'bg-primary', label: 'Ongoing' },
      'completed': { class: 'bg-success', label: 'Completed' },
      'cancelled': { class: 'bg-danger', label: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || { class: 'bg-secondary', label: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  // Calculate event duration
  const calculateDuration = () => {
    if (!event.start_time || !event.end_time) return '-';
    const [startHour, startMin] = event.start_time.split(':').map(Number);
    const [endHour, endMin] = event.end_time.split(':').map(Number);
    const durationMin = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Check if event is finalized
  const finalStatuses = ['completed', 'cancelled'];
  const isFinalized = finalStatuses.includes(event.status?.toLowerCase());
  const isAdmin = hasRole(['admin']);
  const isSuperadmin = hasRole(['superadmin']);
  const isAdminOrSuperadmin = isAdmin || isSuperadmin;

  // Calculate achievement percentage
  const calculateAchievement = () => {
    if (!event.target_attendees || event.target_attendees === 0) return 0;
    return Math.round((event.attendees_count / event.target_attendees) * 100);
  };

  // Get badge color based on achievement
  const getAchievementBadge = () => {
    const achievement = calculateAchievement();
    if (achievement === 0) return { color: 'secondary', text: 'No Data' };
    if (achievement < 50) return { color: 'danger', text: `${achievement}% - Poor` };
    if (achievement < 75) return { color: 'warning', text: `${achievement}% - Below Target` };
    if (achievement < 100) return { color: 'info', text: `${achievement}% - Good` };
    if (achievement === 100) return { color: 'success', text: `${achievement}% - Perfect!` };
    return { color: 'primary', text: `${achievement}% - Exceeded!` };
  };

  const achievementBadge = getAchievementBadge();
  const totalOnTheSpotSales = Array.isArray(event.on_the_spot_sales)
    ? event.on_the_spot_sales.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  return (
    <DashboardLayout>
      {/* Warning for finalized events */}
      {isFinalized && !isAdminOrSuperadmin && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Event is Finalized!</strong> This event has status "{event.status}" and cannot be modified or deleted.
        </div>
      )}
      {isFinalized && isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Superadmin Access:</strong> This event has status "{event.status}" (finalized), but you can still modify it as a superadmin.
        </div>
      )}
      {isFinalized && isAdmin && !isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Admin Access:</strong> This event has status "{event.status}" (finalized), but you can still modify it as an admin.
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Event Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/events">Events</Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {hasPermission('update_events') && !(isFinalized && !isAdminOrSuperadmin) && (
            <Link to={`/events/${id}/edit`} className="btn btn-warning">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {hasPermission('delete_events') && !(isFinalized && !isAdminOrSuperadmin) && (
            <button onClick={handleDeleteClick} className="btn btn-danger">
              <i className="bi bi-trash me-2"></i>Delete
            </button>
          )}
          <Link to="/events" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
        </div>
      </div>

      {/* Event Title Banner */}
      <div className="alert alert-primary mb-4">
        <h4 className="alert-heading mb-1">
          <i className="bi bi-calendar-event me-2"></i>{event.title}
        </h4>
        <p className="mb-0">
          <i className="bi bi-building me-2"></i>
          {event.school?.name ? (
            <Link to={`/schools/${event.school.id}`} className="text-decoration-none">
              {event.school.name}
            </Link>
          ) : event.public?.name ? (
            <Link to={`/publics/${event.public.id}`} className="text-decoration-none">
              {event.public.name} ({event.public.category})
            </Link>
          ) : 'N/A'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Attendees</h6>
                  <h4 className="mb-0 text-primary text-truncate">{event.attendees_count.toLocaleString()}</h4>
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
                  <h6 className="text-muted mb-1 small">Photos</h6>
                  <h4 className="mb-0 text-success text-truncate">{event.photos?.length || 0}</h4>
                </div>
                <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-images"></i>
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
                  <h6 className="text-muted mb-1 small">Duration</h6>
                  <h4 className="mb-0 text-info text-truncate">{calculateDuration()}</h4>
                </div>
                <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-clock-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Status</h6>
                  <div>{renderStatusBadge(event.status)}</div>
                </div>
                <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-flag-fill"></i>
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
              <button className={`nav-link ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>Participants & Notes</button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Photos</button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="row">
                <div className="col-lg-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-info-circle me-2"></i>Event Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{ width: '40%' }}>
                              <strong>Event Type</strong>
                            </td>
                            <td>
                              <span className="badge bg-primary">{event.event_type.toUpperCase()}</span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Event Date</strong>
                            </td>
                            <td>{formatDate(event.event_date)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Time</strong>
                            </td>
                            <td>
                              <i className="bi bi-clock me-1"></i>
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Status</strong>
                            </td>
                            <td>{renderStatusBadge(event.status)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Description</strong>
                            </td>
                            <td>{event.description}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
                              <strong>School</strong>
                            </td>
                            <td>
                              {event.school?.name ? (
                                <Link to={`/schools/${event.school.id}`} className="text-decoration-none">
                                  <i className="bi bi-building me-1"></i>{event.school.name}
                                </Link>
                              ) : '-'}
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Venue</strong>
                            </td>
                            <td>{event.location}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Province</strong>
                            </td>
                            <td>{event.school?.province_name || '-'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>City/Regency</strong>
                            </td>
                            <td>{event.school?.city_name || '-'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>District</strong>
                            </td>
                            <td>{event.school?.district_name || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <>
                <div className="row">
                  <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-person-badge me-2"></i>Instructor Information
                        </h5>
                      </div>
                      <div className="card-body">
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td className="text-muted" style={{ width: '40%' }}>
                                <strong>Instructor Name</strong>
                              </td>
                              <td><strong>{event.instructor_name}</strong></td>
                            </tr>
                            <tr>
                              <td className="text-muted">
                                <strong>Phone</strong>
                              </td>
                              <td>
                                {event.instructor_phone ? (
                                  <a href={`tel:${event.instructor_phone}`} className="text-decoration-none">
                                    <i className="bi bi-telephone me-1"></i>{event.instructor_phone}
                                  </a>
                                ) : '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-people me-2"></i>Participants Information
                        </h5>
                      </div>
                      <div className="card-body">
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td className="text-muted" style={{ width: '40%' }}>
                                <strong>Target Audience</strong>
                              </td>
                              <td><span className="badge bg-info">{event.target_audience}</span></td>
                            </tr>
                            <tr>
                              <td className="text-muted">
                                <strong>Target Attendees</strong>
                              </td>
                              <td>
                                <i className="bi bi-bullseye me-1"></i>
                                <strong>{event.target_attendees?.toLocaleString() || 0}</strong> participants (planned)
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">
                                <strong>Actual Attendees</strong>
                              </td>
                              <td>
                                <i className="bi bi-people-fill me-1"></i>
                                <strong>{event.attendees_count.toLocaleString()}</strong> participants
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">
                                <strong>Achievement</strong>
                              </td>
                              <td>
                                <span className={`badge bg-${achievementBadge.color} fs-6 px-3 py-2`}>
                                  <i className="bi bi-graph-up-arrow me-2"></i>
                                  {achievementBadge.text}
                                </span>
                                {event.target_attendees > 0 && event.attendees_count > 0 && (
                                  <div className="text-muted small mt-1">
                                    {event.attendees_count} of {event.target_attendees} attendees
                                  </div>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">
                                <strong>Notes</strong>
                              </td>
                              <td>{event.notes || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-bag-check me-2"></i>On the Spot Sales
                        </h5>
                      </div>
                      <div className="card-body">
                        {event.on_the_spot_sales?.length ? (
                          <>
                            <div className="table-responsive">
                              <table className="table table-striped align-middle">
                                <thead>
                                  <tr>
                                    <th style={{ width: '5%' }}>#</th>
                                    <th>Vehicle Type</th>
                                    <th>Payment Method</th>
                                    <th className="text-end">Quantity</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {event.on_the_spot_sales.map((sale, idx) => (
                                    <tr key={sale.id || idx}>
                                      <td>{idx + 1}</td>
                                      <td>{sale.vehicle_type || '-'}</td>
                                      <td>{formatPaymentMethod(sale.payment_method)}</td>
                                      <td className="text-end">{formatNumber(sale.quantity)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="text-muted small">
                              <i className="bi bi-cart-check me-1"></i>Total quantity:&nbsp;
                              <strong>{formatNumber(totalOnTheSpotSales)}</strong>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted mb-0">No on the spot sales recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-briefcase me-2"></i>Visiting Service
                        </h5>
                      </div>
                      <div className="card-body">
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td className="text-muted" style={{ width: '40%' }}>
                                <strong>Unit Entry</strong>
                              </td>
                              <td>
                                <i className="bi bi-truck me-1"></i>
                                <strong>{formatNumber(event.visiting_service_unit_entry)}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted">
                                <strong>Profit</strong>
                              </td>
                              <td>{formatCurrency(event.visiting_service_profit)}</td>
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
                {hasPermission('update_events') && !(isFinalized && !isAdminOrSuperadmin) && (
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
                            {hasPermission('delete_events') && !(isFinalized && !isAdminOrSuperadmin) && (
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
                    <p className="mt-2">No photos for this event yet.</p>
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
                {new Date(event.created_at).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Created By:</strong> {event.created_by || '-'}
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong className="text-muted">Updated At:</strong>{' '}
                {new Date(event.updated_at).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Updated By:</strong> {event.updated_by || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Photo Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Photo"
        message={`Are you sure you want to delete this photo? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handlePhotoDeleteConfirm}
        onCancel={handlePhotoDeleteCancel}
      />

      {/* Delete Event Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteEventModal}
        title="Delete Event"
        message={`Are you sure you want to delete the event "${event?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default EventDetail;
