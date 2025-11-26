import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../../services/eventService';
import schoolService from '../../services/schoolService';
import publicService from '../../services/publicService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const EventForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
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
      toast.error(t('events.form.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await schoolService.getAll({ limit: 1000 });
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error(t('schools.loadFailed'));
    }
  };

  const fetchPublics = async () => {
    try {
      const response = await publicService.getAll({ limit: 1000 });
      setPublics(response.data.data || []);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data.data || []);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const fetchCities = async (provinceCode) => {
    try {
      const response = await locationService.getCities(provinceCode);
      setCities(response.data.data || []);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const fetchDistricts = async (provinceCode, cityCode) => {
    try {
      const response = await locationService.getDistricts(provinceCode, cityCode);
      setDistricts(response.data.data || []);
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const handleEntityTypeChange = (e) => {
    const newEntityType = e.target.value;
    setEntityType(newEntityType);
    // Clear both IDs when switching entity type
    setFormData(prev => ({
      ...prev,
      school_id: '',
      public_id: ''
    }));
  };

  const handleEntitySelect = (e) => {
    const { name, value } = e.target;

    if (name === 'school_id') {
      // Clear public_id when selecting a school
      setFormData(prev => ({
        ...prev,
        school_id: value,
        public_id: ''
      }));
    } else if (name === 'public_id') {
      // Clear school_id when selecting a public entity
      setFormData(prev => ({
        ...prev,
        public_id: value,
        school_id: ''
      }));
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
        toast.success(t('events.form.updateSuccess'));
      } else {
        await eventService.create(submitData);
        toast.success(t('events.form.createSuccess'));
      }
      navigate('/events');
    } catch (error) {
      toast.error(error.response?.data?.message || t('events.form.saveFailed'));
    }
  };

  if (loading) {
    return <>{t('common.loading')}</>;
  }

  const isAdmin = hasRole(['admin']);
  const isSuperadmin = hasRole(['superadmin']);
  const isAdminOrSuperadmin = isAdmin || isSuperadmin;
  const shouldDisable = isFinalized && !isAdminOrSuperadmin;

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
    <>
      <h2>{id ? t('events.edit') : t('events.add')}</h2>

      {/* Warning for finalized events */}
      {isFinalized && !isAdminOrSuperadmin && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>{t('events.form.finalizedWarning', { status: formData.status })}</strong>
        </div>
      )}
      {isFinalized && isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>{t('events.form.superadminAccess', { status: formData.status })}</strong>
        </div>
      )}
      {isFinalized && isAdmin && !isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>{t('events.form.adminAccess', { status: formData.status })}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>{t('events.form.basicInfo')}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.title')} <span className="text-danger">*</span></label>
                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Safety Riding Seminar for Students" required disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.entityType')} <span className="text-danger">*</span></label>
                <select className="form-select" value={entityType} onChange={handleEntityTypeChange} disabled={shouldDisable}>
                  <option value="school">{t('events.form.school')}</option>
                  <option value="public">{t('events.form.publicEntity')}</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              {entityType === 'school' ? (
                <>
                  <label className="form-label">{t('events.form.school')} <span className="text-danger">*</span></label>
                  <select className="form-select" name="school_id" value={formData.school_id} onChange={handleEntitySelect} required disabled={shouldDisable}>
                    <option value="">{t('events.form.selectSchool')}</option>
                    {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <label className="form-label">{t('events.form.publicEntity')} <span className="text-danger">*</span></label>
                  <select className="form-select" name="public_id" value={formData.public_id} onChange={handleEntitySelect} required disabled={shouldDisable}>
                    <option value="">{t('events.form.selectPublic')}</option>
                    {publics.map(pub => <option key={pub.id} value={pub.id}>{pub.name} - {pub.category}</option>)}
                  </select>
                </>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">{t('events.form.description')} <span className="text-danger">*</span></label>
              <textarea className="form-control" rows="3" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., A seminar on the importance of safe driving for high school students" required disabled={shouldDisable} />
            </div>
          </div>
        </div>

        {/* Event Schedule & Location Section */}
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-calendar-event me-2"></i>{t('events.form.scheduleLocation')}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.eventDate')} <span className="text-danger">*</span></label>
                <input type="date" className="form-control" name="event_date" value={formData.event_date} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.startTime')} <span className="text-danger">*</span></label>
                <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.endTime')} <span className="text-danger">*</span></label>
                <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} required disabled={shouldDisable} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">{t('events.form.location')} <span className="text-danger">*</span></label>
              <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., School Auditorium" required disabled={shouldDisable} />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.province')} <span className="text-danger">*</span></label>
                <select className="form-select" name="province_id" value={formData.province_id} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="">{t('events.form.selectProvince')}</option>
                  {provinces.map(prov => <option key={prov.code} value={prov.code}>{prov.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.city')} <span className="text-danger">*</span></label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={!formData.province_id || shouldDisable}>
                  <option value="">{t('events.form.selectCity')}</option>
                  {cities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.district')} <span className="text-danger">*</span></label>
                <select className="form-select" name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id || shouldDisable}>
                  <option value="">{t('events.form.selectDistrict')}</option>
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
              <i className="bi bi-card-list me-2"></i>{t('events.form.details')}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.eventType')} <span className="text-danger">*</span></label>
                <select className="form-select" name="event_type" value={showOtherEventType ? 'other' : formData.event_type} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="seminar">{t('events.type.seminar')}</option>
                  <option value="workshop">{t('events.type.workshop')}</option>
                  <option value="training">{t('events.type.training')}</option>
                  <option value="other">{t('events.type.other')}</option>
                </select>
                {showOtherEventType && (
                  <input type="text" className="form-control mt-2" name="event_type" value={formData.event_type} onChange={handleChange} placeholder={t('events.form.enterEventType')} required disabled={shouldDisable} />
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.targetAudience')}</label>
                <input type="text" className="form-control" name="target_audience" value={formData.target_audience} onChange={handleChange} placeholder="e.g., High School Students, Grade 10-12" disabled={shouldDisable} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.status')} <span className="text-danger">*</span></label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="planned">{t('events.status.planned')}</option>
                  <option value="ongoing">{t('events.status.ongoing')}</option>
                  <option value="completed">{t('events.status.completed')}</option>
                  <option value="cancelled">{t('events.status.cancelled')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Participants & Achievement Section */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>{t('events.form.participantsAchievement')}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.targetAttendees')}</label>
                <input type="number" className="form-control" name="target_attendees" value={formData.target_attendees} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 200" min="0" disabled={shouldDisable} />
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Planned number of attendees for this event
                </small>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">
                  {t('events.form.actualAttendees')}
                  {formData.status === 'completed' && <span className="text-danger"> *</span>}
                </label>
                <input type="number" className="form-control" name="attendees_count" value={formData.attendees_count} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 150" min="0" disabled={shouldDisable} required={formData.status === 'completed'} />
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Actual number who attended (required when status is Completed)
                </small>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('events.form.achievement')}</label>
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
              <i className="bi bi-cart me-2"></i>{t('events.form.salesServices')}
            </h5>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">{t('events.form.onTheSpotSales')}</h5>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addOnTheSpotSaleRow} disabled={shouldDisable}>
                  <i className="bi bi-plus-circle me-1"></i>{t('events.form.addSaleRow')}
                </button>
              </div>
              {formData.on_the_spot_sales.map((sale, index) => (
                <div className="card mb-3" key={`on-the-spot-${index}`}>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">{t('events.form.vehicleType')}</label>
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
                        <label className="form-label">{t('events.form.paymentMethod')}</label>
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
                        <label className="form-label">{t('events.form.quantity')}</label>
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
            <h6 className="mb-3"><i className="bi bi-briefcase me-2"></i>{t('events.form.visitingService')}</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.unitEntry')}</label>
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
                <label className="form-label">{t('events.form.profit')}</label>
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
            <h6 className="mb-3"><i className="bi bi-download me-2"></i>{t('events.form.appDownloads')}</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.numberOfDownloads')}</label>
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
                <label className="form-label">{t('events.form.appName')}</label>
                <select className="form-select" name="apps_name" value={formData.apps_name} onChange={handleChange} disabled={shouldDisable}>
                  <option value="">{t('events.form.selectApp')}</option>
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
              <i className="bi bi-person-badge me-2"></i>{t('events.form.instructorInfo')}
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.instructorName')}</label>
                <input type="text" className="form-control" name="instructor_name" value={formData.instructor_name} onChange={handleChange} placeholder="e.g., John Doe" disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('events.form.instructorPhone')}</label>
                <input type="text" className="form-control" name="instructor_phone" value={formData.instructor_phone} onChange={handleChange} placeholder="e.g., 081234567890" disabled={shouldDisable} />
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-pencil-square me-2"></i>{t('events.form.notes')}
            </h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">{t('events.form.additionalNotes')}</label>
              <textarea className="form-control" rows="4" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., The event was a great success, with enthusiastic participation from students." disabled={shouldDisable} />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2 mb-4">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/events')}>
            <i className="bi bi-x-circle me-2"></i>{t('events.form.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={shouldDisable}>
            <i className="bi bi-save me-2"></i>{id ? t('events.form.update') : t('events.form.create')}
          </button>
        </div>
      </form>
    </>
  );
};

export default EventForm;
