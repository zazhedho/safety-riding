import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import eventService from '../../services/eventService';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [formData, setFormData] = useState({
    school_id: '',
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    province_id: '',
    city_id: '',
    district_id: '',
    event_type: 'seminar',
    target_audience: '',
    target_attendees: '',
    attendees_count: '',
    instructor_name: '',
    instructor_phone: '',
    status: 'planned',
    notes: ''
  });
  const [schools, setSchools] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showOtherEventType, setShowOtherEventType] = useState(false);

  useEffect(() => {
    fetchSchools();
    fetchProvinces();
    if (id) {
      fetchEvent(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (formData.province_id) {
      fetchCities(formData.province_id);
    }
  }, [formData.province_id]);

  useEffect(() => {
    if (formData.city_id) {
      fetchDistricts(formData.province_id, formData.city_id);
    }
  }, [formData.city_id]);

  const fetchEvent = async (eventId) => {
    try {
      const response = await eventService.getById(eventId);
      const eventData = response.data.data;
      setFormData(eventData);

      // Check if event status is final (completed or cancelled)
      const finalStatuses = ['completed', 'cancelled'];
      setIsFinalized(finalStatuses.includes(eventData.status?.toLowerCase()));

      // Check if event_type is a custom value (not one of the predefined options)
      const predefinedTypes = ['seminar', 'workshop', 'training'];
      if (eventData.event_type && !predefinedTypes.includes(eventData.event_type.toLowerCase())) {
        setShowOtherEventType(true);
      }
    } catch (error) {
      toast.error('Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await schoolService.getAll({ limit: 1000 });
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load schools');
    }
  };

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

  const handleChange = (e) => {
    const { name, value, tagName } = e.target;

    // Handle event_type field with "other" option
    if (name === 'event_type') {
      // If it's a SELECT element (dropdown)
      if (tagName === 'SELECT') {
        if (value === 'other') {
          setShowOtherEventType(true);
          setFormData(prev => ({ ...prev, [name]: '' }));
        } else {
          setShowOtherEventType(false);
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      }
      // If it's an INPUT element (text field for "other")
      else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'attendees_count' || name === 'target_attendees') {
      // Allow empty string or valid positive number only
      if (value === '' || (value >= 0 && !value.includes('-'))) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handler to select all text on focus for number fields
  const handleNumberFocus = (e) => {
    e.target.select();
  };

  // Handler to prevent negative number input (block minus/dash key)
  const handleNumberKeyDown = (e) => {
    // Block minus/dash (-), plus (+), and 'e' keys for number inputs
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Convert empty string to 0 for number fields before submitting
    const submitData = {
      ...formData,
      target_attendees: formData.target_attendees === '' ? 0 : parseInt(formData.target_attendees) || 0,
      attendees_count: formData.attendees_count === '' ? 0 : parseInt(formData.attendees_count) || 0
    };

    // Validate: if status is "completed", attendees_count must be filled
    if (submitData.status === 'completed' && submitData.attendees_count === 0) {
      toast.error('Attendees Count must be greater than 0 when event status is Completed');
      return;
    }

    try {
      if (id) {
        await eventService.update(id, submitData);
        toast.success('Event updated successfully');
      } else {
        await eventService.create(submitData);
        toast.success('Event created successfully');
      }
      navigate('/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save event');
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  const isAdmin = hasRole(['admin']);
  const shouldDisable = isFinalized && !isAdmin;

  // Calculate achievement percentage
  const calculateAchievement = () => {
    const target = parseInt(formData.target_attendees) || 0;
    const actual = parseInt(formData.attendees_count) || 0;
    if (!target || target === 0) return 0;
    return Math.round((actual / target) * 100);
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

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Event' : 'Add Event'}</h2>

      {/* Warning for finalized events */}
      {isFinalized && !isAdmin && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Event is Finalized!</strong> This event has status "{formData.status}" and cannot be modified.
          All fields are read-only.
        </div>
      )}
      {isFinalized && isAdmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Admin Access:</strong> This event has status "{formData.status}" (finalized), but you can still modify it as an admin.
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Safety Riding Seminar for Students" required disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">School</label>
                <select className="form-select" name="school_id" value={formData.school_id} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="">Select School</option>
                  {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., A seminar on the importance of safe driving for high school students" required disabled={shouldDisable} />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Event Date</label>
                <input type="date" className="form-control" name="event_date" value={formData.event_date} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">End Time</label>
                <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} required disabled={shouldDisable} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Location</label>
              <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., School Auditorium" required disabled={shouldDisable} />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Province</label>
                <select className="form-select" name="province_id" value={formData.province_id} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="">Select Province</option>
                  {provinces.map(prov => <option key={prov.code} value={prov.code}>{prov.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={!formData.province_id || isFinalized}>
                  <option value="">Select City</option>
                  {cities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">District</label>
                <select className="form-select" name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id || isFinalized}>
                  <option value="">Select District</option>
                  {districts.map(dist => <option key={dist.code} value={dist.code}>{dist.name}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event Type</label>
                <select className="form-select" name="event_type" value={showOtherEventType ? 'other' : formData.event_type} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="seminar">Seminar</option>
                  <option value="workshop">Workshop</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
                {showOtherEventType && (
                  <input type="text" className="form-control mt-2" name="event_type" value={formData.event_type} onChange={handleChange} placeholder="Enter event type" required disabled={shouldDisable} />
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Target Audience</label>
                <input type="text" className="form-control" name="target_audience" value={formData.target_audience} onChange={handleChange} placeholder="e.g., High School Students, Grade 10-12" disabled={shouldDisable} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Target Attendees</label>
                <input type="number" className="form-control" name="target_attendees" value={formData.target_attendees} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 200" min="0" disabled={shouldDisable} />
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Planned number of attendees for this event
                </small>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  Actual Attendees
                  {formData.status === 'completed' && <span className="text-danger"> *</span>}
                </label>
                <input type="number" className="form-control" name="attendees_count" value={formData.attendees_count} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 150" min="0" disabled={shouldDisable} required={formData.status === 'completed'} />
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Actual number who attended (required when status is Completed)
                </small>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Achievement</label>
                <div className="d-flex align-items-center" style={{ height: '38px' }}>
                  <span className={`badge bg-${achievementBadge.color} fs-6 px-3 py-2`}>
                    <i className="bi bi-graph-up-arrow me-2"></i>
                    {achievementBadge.text}
                  </span>
                </div>
                {formData.target_attendees > 0 && formData.attendees_count > 0 && (
                  <small className="text-muted d-block mt-1">
                    {formData.attendees_count} of {formData.target_attendees} attendees
                  </small>
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Instructor Name</label>
                <input type="text" className="form-control" name="instructor_name" value={formData.instructor_name} onChange={handleChange} placeholder="e.g., John Doe" disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Instructor Phone</label>
                <input type="text" className="form-control" name="instructor_phone" value={formData.instructor_phone} onChange={handleChange} placeholder="e.g., 081234567890" disabled={shouldDisable} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., The event was a great success, with enthusiastic participation from students." disabled={shouldDisable} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={shouldDisable}>{id ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/events')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EventForm;
