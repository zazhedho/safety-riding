import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import schoolService from '../../services/schoolService';
import publicService from '../../services/publicService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [entityType, setEntityType] = useState('school');
  const [formData, setFormData] = useState({
    school_id: '',
    public_id: '',
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
    visiting_service_unit_entry: '',
    visiting_service_profit: '',
    on_the_spot_sales: [
      { vehicle_type: '', payment_method: 'cash', quantity: '' }
    ],
    notes: '',
    apps_downloaded: '',
    apps_name: ''
  });
  const [schools, setSchools] = useState([]);
  const [publics, setPublics] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showOtherEventType, setShowOtherEventType] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [publicSearch, setPublicSearch] = useState('');
  const [showSchoolOptions, setShowSchoolOptions] = useState(false);
  const [showPublicOptions, setShowPublicOptions] = useState(false);
  const [activeSchoolIndex, setActiveSchoolIndex] = useState(-1);
  const [activePublicIndex, setActivePublicIndex] = useState(-1);

  useEffect(() => {
    fetchSchools();
    fetchPublics();
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

  useEffect(() => {
    if (!formData.school_id) return;
    const selectedSchool = schools.find((school) => school.id === formData.school_id);
    if (selectedSchool) {
      setSchoolSearch(selectedSchool.name || '');
    }
  }, [formData.school_id, schools]);

  useEffect(() => {
    if (!formData.public_id) return;
    const selectedPublic = publics.find((pub) => pub.id === formData.public_id);
    if (selectedPublic) {
      const label = selectedPublic.category ? `${selectedPublic.name} - ${selectedPublic.category}` : selectedPublic.name;
      setPublicSearch(label);
    }
  }, [formData.public_id, publics]);

  const fetchEvent = async (eventId) => {
    try {
      const response = await eventService.getById(eventId);
      const eventData = response.data.data;
      const sales = (eventData.on_the_spot_sales && eventData.on_the_spot_sales.length > 0)
        ? eventData.on_the_spot_sales.map(item => ({
            vehicle_type: item.vehicle_type || '',
            payment_method: item.payment_method || 'cash',
            quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity.toString() : ''
          }))
        : [{ vehicle_type: '', payment_method: 'cash', quantity: '' }];

      // Determine entity type based on which ID is set
      if (eventData.public_id) {
        setEntityType('public');
      } else if (eventData.school_id) {
        setEntityType('school');
      }

      setFormData(prev => ({
        ...prev,
        ...eventData,
        target_attendees: eventData.target_attendees ?? '',
        attendees_count: eventData.attendees_count ?? '',
        visiting_service_unit_entry: eventData.visiting_service_unit_entry ?? '',
        visiting_service_profit: eventData.visiting_service_profit !== undefined && eventData.visiting_service_profit !== null
          ? eventData.visiting_service_profit.toString()
          : '',
        on_the_spot_sales: sales,
        apps_downloaded: eventData.apps_downloaded ?? '',
        apps_name: eventData.apps_name ?? ''
      }));

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

  const fetchPublics = async () => {
    try {
      const response = await publicService.getAll({ limit: 1000 });
      setPublics(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load public entities');
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

  const handleEntityTypeChange = (e) => {
    const newEntityType = e.target.value;
    setEntityType(newEntityType);
    setSchoolSearch('');
    setPublicSearch('');
    setShowSchoolOptions(false);
    setShowPublicOptions(false);
    setActiveSchoolIndex(-1);
    setActivePublicIndex(-1);
    // Clear both IDs when switching entity type
    setFormData(prev => ({
      ...prev,
      school_id: '',
      public_id: ''
    }));
  };

  const handleSchoolSearchChange = (e) => {
    const value = e.target.value;
    setSchoolSearch(value);
    setShowSchoolOptions(true);
    setActiveSchoolIndex(0);
    setFormData(prev => ({
      ...prev,
      school_id: '',
      public_id: ''
    }));
  };

  const handlePublicSearchChange = (e) => {
    const value = e.target.value;
    setPublicSearch(value);
    setShowPublicOptions(true);
    setActivePublicIndex(0);
    setFormData(prev => ({
      ...prev,
      public_id: '',
      school_id: ''
    }));
  };

  const handleSelectSchool = (school) => {
    setSchoolSearch(school.name || '');
    setShowSchoolOptions(false);
    setActiveSchoolIndex(-1);
    setFormData(prev => ({
      ...prev,
      school_id: school.id,
      public_id: ''
    }));
  };

  const handleSelectPublic = (pub) => {
    const label = pub.category ? `${pub.name} - ${pub.category}` : pub.name;
    setPublicSearch(label);
    setShowPublicOptions(false);
    setActivePublicIndex(-1);
    setFormData(prev => ({
      ...prev,
      public_id: pub.id,
      school_id: ''
    }));
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
    } else if (['attendees_count', 'target_attendees', 'visiting_service_unit_entry', 'apps_downloaded'].includes(name)) {
      // Allow empty string or valid non-negative integer only
      if (value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0 && !value.includes('-'))) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'visiting_service_profit') {
      // Allow empty string or valid non-negative decimal number
      if (value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0)) {
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

  const handleOnTheSpotSaleChange = (index, field, value) => {
    setFormData(prev => {
      const updatedSales = prev.on_the_spot_sales.map((sale, idx) => {
        if (idx !== index) return sale;

        if (field === 'quantity') {
          if (value === '' || (!Number.isNaN(Number(value)) && Number(value) >= 0 && !value.includes('-'))) {
            return { ...sale, quantity: value };
          }
          return sale;
        }

        return { ...sale, [field]: value };
      });

      return { ...prev, on_the_spot_sales: updatedSales };
    });
  };

  const addOnTheSpotSaleRow = () => {
    setFormData(prev => ({
      ...prev,
      on_the_spot_sales: [
        ...prev.on_the_spot_sales,
        { vehicle_type: '', payment_method: 'cash', quantity: '' }
      ]
    }));
  };

  const removeOnTheSpotSaleRow = (index) => {
    setFormData(prev => {
      const updatedSales = prev.on_the_spot_sales.filter((_, idx) => idx !== index);
      return {
        ...prev,
        on_the_spot_sales: updatedSales.length > 0
          ? updatedSales
          : [{ vehicle_type: '', payment_method: 'cash', quantity: '' }]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (entityType === 'school' && !formData.school_id) {
      toast.error('Please select a school from the dropdown list');
      return;
    }

    if (entityType === 'public' && !formData.public_id) {
      toast.error('Please select a public entity from the dropdown list');
      return;
    }

    // Convert empty string to 0 for number fields before submitting
    const sanitizedSales = formData.on_the_spot_sales
      .map(item => ({
        vehicle_type: item.vehicle_type.trim(),
        payment_method: item.payment_method || 'cash',
        quantity: item.quantity === '' ? 0 : parseInt(item.quantity, 10) || 0
      }))
      .filter(item => item.vehicle_type !== '' || item.quantity > 0);

    const submitData = {
      ...formData,
      // Only include school_id if it's not empty
      school_id: formData.school_id || undefined,
      // Only include public_id if it's not empty
      public_id: formData.public_id || undefined,
      target_attendees: formData.target_attendees === '' ? 0 : parseInt(formData.target_attendees, 10) || 0,
      attendees_count: formData.attendees_count === '' ? 0 : parseInt(formData.attendees_count, 10) || 0,
      visiting_service_unit_entry: formData.visiting_service_unit_entry === '' ? 0 : parseInt(formData.visiting_service_unit_entry, 10) || 0,
      visiting_service_profit: formData.visiting_service_profit === '' ? 0 : parseFloat(formData.visiting_service_profit) || 0,
      apps_downloaded: formData.apps_downloaded === '' ? 0 : parseInt(formData.apps_downloaded, 10) || 0,
      apps_name: formData.apps_name || undefined,
      on_the_spot_sales: sanitizedSales
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
    return <>Loading...</>;
  }

  const canOverrideFinalized = hasPermission('events', 'override_finalized');
  const shouldDisable = isFinalized && !canOverrideFinalized;

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
  const schoolSearchTerm = schoolSearch.trim().toLowerCase();
  const publicSearchTerm = publicSearch.trim().toLowerCase();
  const filteredSchools = schoolSearchTerm
    ? schools.filter(school => school.name?.toLowerCase().includes(schoolSearchTerm))
    : schools;
  const filteredPublics = publicSearchTerm
    ? publics.filter(pub => {
        const category = pub.category || '';
        return `${pub.name} ${category}`.toLowerCase().includes(publicSearchTerm);
      })
    : publics;
  const hasSchoolOptions = filteredSchools.length > 0;
  const hasPublicOptions = filteredPublics.length > 0;

  const handleSchoolSearchKeyDown = (e) => {
    if (!showSchoolOptions) {
      if (e.key === 'ArrowDown' && hasSchoolOptions) {
        setShowSchoolOptions(true);
        setActiveSchoolIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!hasSchoolOptions) return;
      setActiveSchoolIndex((prev) => (prev < filteredSchools.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hasSchoolOptions) return;
      setActiveSchoolIndex((prev) => (prev > 0 ? prev - 1 : filteredSchools.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      if (hasSchoolOptions && activeSchoolIndex >= 0) {
        e.preventDefault();
        handleSelectSchool(filteredSchools[activeSchoolIndex]);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowSchoolOptions(false);
      setActiveSchoolIndex(-1);
    }
  };

  const handlePublicSearchKeyDown = (e) => {
    if (!showPublicOptions) {
      if (e.key === 'ArrowDown' && hasPublicOptions) {
        setShowPublicOptions(true);
        setActivePublicIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!hasPublicOptions) return;
      setActivePublicIndex((prev) => (prev < filteredPublics.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hasPublicOptions) return;
      setActivePublicIndex((prev) => (prev > 0 ? prev - 1 : filteredPublics.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      if (hasPublicOptions && activePublicIndex >= 0) {
        e.preventDefault();
        handleSelectPublic(filteredPublics[activePublicIndex]);
      }
      return;
    }

    if (e.key === 'Escape') {
      setShowPublicOptions(false);
      setActivePublicIndex(-1);
    }
  };

  return (
    <>
      <h2>{id ? 'Edit Event' : 'Add Event'}</h2>

      {/* Warning for finalized events */}
      {isFinalized && !canOverrideFinalized && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Event is Finalized!</strong> This event has status "{formData.status}" and cannot be modified.
          All fields are read-only.
        </div>
      )}
      {isFinalized && canOverrideFinalized && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Override Access:</strong> This event has status "{formData.status}" (finalized), but you can still modify it because you have finalized override permission.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>Basic Information
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Title <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Safety Riding Seminar for Students" required disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Entity Type <span className="text-danger">*</span></label>
                <select className="form-select" value={entityType} onChange={handleEntityTypeChange} disabled={shouldDisable}>
                  <option value="school">School</option>
                  <option value="public">Public Entity</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              {entityType === 'school' ? (
                <>
                  <label className="form-label">School <span className="text-danger">*</span></label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search and select school..."
                      value={schoolSearch}
                      onChange={handleSchoolSearchChange}
                      onKeyDown={handleSchoolSearchKeyDown}
                      onFocus={() => {
                        setShowSchoolOptions(true);
                        setActiveSchoolIndex(0);
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowSchoolOptions(false);
                        setActiveSchoolIndex(-1);
                      }, 150)}
                      disabled={shouldDisable}
                    />
                    {showSchoolOptions && !shouldDisable && (
                      <div className="list-group position-absolute w-100 mt-1 shadow-sm" style={{ zIndex: 1050, maxHeight: '240px', overflowY: 'auto' }}>
                        {filteredSchools.length > 0 ? (
                          filteredSchools.map((school, index) => (
                            <button
                              key={school.id}
                              type="button"
                              className={`list-group-item list-group-item-action text-start${activeSchoolIndex === index ? ' active' : ''}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSelectSchool(school)}
                            >
                              {school.name}
                            </button>
                          ))
                        ) : (
                          <div className="list-group-item text-muted">No schools found</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <label className="form-label">Public Entity <span className="text-danger">*</span></label>
                  <div className="position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search and select public entity..."
                      value={publicSearch}
                      onChange={handlePublicSearchChange}
                      onKeyDown={handlePublicSearchKeyDown}
                      onFocus={() => {
                        setShowPublicOptions(true);
                        setActivePublicIndex(0);
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowPublicOptions(false);
                        setActivePublicIndex(-1);
                      }, 150)}
                      disabled={shouldDisable}
                    />
                    {showPublicOptions && !shouldDisable && (
                      <div className="list-group position-absolute w-100 mt-1 shadow-sm" style={{ zIndex: 1050, maxHeight: '240px', overflowY: 'auto' }}>
                        {filteredPublics.length > 0 ? (
                          filteredPublics.map((pub, index) => (
                            <button
                              key={pub.id}
                              type="button"
                              className={`list-group-item list-group-item-action text-start${activePublicIndex === index ? ' active' : ''}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => handleSelectPublic(pub)}
                            >
                              {pub.name} {pub.category ? `- ${pub.category}` : ''}
                            </button>
                          ))
                        ) : (
                          <div className="list-group-item text-muted">No public entities found</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Description <span className="text-danger">*</span></label>
              <textarea className="form-control" rows="3" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., A seminar on the importance of safe driving for high school students" required disabled={shouldDisable} />
            </div>
          </div>
        </div>

        {/* Event Schedule & Location Section */}
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-calendar-event me-2"></i>Event Schedule & Location
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Event Date <span className="text-danger">*</span></label>
                <input type="date" className="form-control" name="event_date" value={formData.event_date} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Start Time <span className="text-danger">*</span></label>
                <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">End Time <span className="text-danger">*</span></label>
                <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} required disabled={shouldDisable} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Location <span className="text-danger">*</span></label>
              <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., School Auditorium" required disabled={shouldDisable} />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Province <span className="text-danger">*</span></label>
                <select className="form-select" name="province_id" value={formData.province_id} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="">Select Province</option>
                  {provinces.map(prov => <option key={prov.code} value={prov.code}>{prov.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">City <span className="text-danger">*</span></label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={!formData.province_id || shouldDisable}>
                  <option value="">Select City</option>
                  {cities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">District <span className="text-danger">*</span></label>
                <select className="form-select" name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id || shouldDisable}>
                  <option value="">Select District</option>
                  {districts.map(dist => <option key={dist.code} value={dist.code}>{dist.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Section */}
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">
              <i className="bi bi-card-list me-2"></i>Event Details
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event Type <span className="text-danger">*</span></label>
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
              <div className="col-md-6 mb-3">
                <label className="form-label">Status <span className="text-danger">*</span></label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Participants & Achievement Section */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>Participants & Achievement
            </h5>
          </div>
          <div className="card-body">
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
          </div>
        </div>

        {/* Sales & Services Section */}
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">
              <i className="bi bi-cart me-2"></i>Sales & Services
            </h5>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">On the Spot Sales</h5>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOnTheSpotSaleRow} disabled={shouldDisable}>
                  <i className="bi bi-plus-circle me-1"></i>Add Row
                </button>
              </div>
              {formData.on_the_spot_sales.map((sale, index) => (
                <div className="card mb-3" key={`on-the-spot-${index}`}>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Vehicle Type</label>
                        <input
                          type="text"
                          className="form-control"
                          value={sale.vehicle_type}
                          onChange={(e) => handleOnTheSpotSaleChange(index, 'vehicle_type', e.target.value)}
                          placeholder="e.g., Scooter"
                          disabled={shouldDisable}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Payment Method</label>
                        <select
                          className="form-select"
                          value={sale.payment_method}
                          onChange={(e) => handleOnTheSpotSaleChange(index, 'payment_method', e.target.value)}
                          disabled={shouldDisable}
                        >
                          <option value="cash">Cash</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-control"
                          value={sale.quantity}
                          onChange={(e) => handleOnTheSpotSaleChange(index, 'quantity', e.target.value)}
                          onFocus={handleNumberFocus}
                          onKeyDown={handleNumberKeyDown}
                          placeholder="e.g., 5"
                          min="0"
                          disabled={shouldDisable}
                        />
                      </div>
                      <div className="col-md-1 d-flex align-items-end mb-3">
                        <button
                          type="button"
                          className="btn btn-outline-danger w-100"
                          onClick={() => removeOnTheSpotSaleRow(index)}
                          disabled={shouldDisable}
                          aria-label="Remove row"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Add one row per unit sold to capture different vehicle types and payment methods.
              </small>
            </div>

            <hr className="my-4" />

            {/* Visiting Service */}
            <h6 className="mb-3"><i className="bi bi-briefcase me-2"></i>Visiting Service</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Unit Entry</label>
                <input
                  type="number"
                  className="form-control"
                  name="visiting_service_unit_entry"
                  value={formData.visiting_service_unit_entry}
                  onChange={handleChange}
                  onFocus={handleNumberFocus}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="e.g., 10"
                  min="0"
                  disabled={shouldDisable}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Profit (IDR)</label>
                <div className="input-group">
                  <span className="input-group-text">Rp</span>
                  <input
                    type="number"
                    className="form-control"
                    name="visiting_service_profit"
                    value={formData.visiting_service_profit}
                    onChange={handleChange}
                    onFocus={handleNumberFocus}
                    onKeyDown={handleNumberKeyDown}
                    placeholder="e.g., 1500000"
                    min="0"
                    step="0.01"
                    disabled={shouldDisable}
                  />
                </div>
              </div>
            </div>

            <hr className="my-4" />

            {/* App Downloads */}
            <h6 className="mb-3"><i className="bi bi-download me-2"></i>App Downloads</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Number of Downloads</label>
                <input
                  type="number"
                  className="form-control"
                  name="apps_downloaded"
                  value={formData.apps_downloaded}
                  onChange={handleChange}
                  onFocus={handleNumberFocus}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="e.g., 50"
                  min="0"
                  disabled={shouldDisable}
                />
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Number of app downloads during this event
                </small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">App Name</label>
                <select className="form-select" name="apps_name" value={formData.apps_name} onChange={handleChange} disabled={shouldDisable}>
                  <option value="">Select App</option>
                  <option value="Motorkux">Motorkux</option>
                  <option value="Other">Other</option>
                </select>
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Name of the app that was downloaded
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Information Section */}
        <div className="card mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>Instructor Information
            </h5>
          </div>
          <div className="card-body">
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
          </div>
        </div>

        {/* Notes Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-pencil-square me-2"></i>Notes
            </h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Additional Notes</label>
              <textarea className="form-control" rows="4" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., The event was a great success, with enthusiastic participation from students." disabled={shouldDisable} />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>
            <i className="bi bi-x-circle me-2"></i>Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={shouldDisable}>
            <i className="bi bi-save me-2"></i>{id ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </>
  );
};

export default EventForm;
