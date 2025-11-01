import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import eventService from '../../services/eventService';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      setFormData(response.data.data);
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
    const { name, value } = e.target;
    if (name === 'attendees_count') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value)}));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await eventService.update(id, formData);
        toast.success('Event updated successfully');
      } else {
        await eventService.create(formData);
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

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Event' : 'Add Event'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">School</label>
                <select className="form-select" name="school_id" value={formData.school_id} onChange={handleChange} required>
                  <option value="">Select School</option>
                  {schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Event Date</label>
                <input type="date" className="form-control" name="event_date" value={formData.event_date} onChange={handleChange} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-control" name="start_time" value={formData.start_time} onChange={handleChange} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">End Time</label>
                <input type="time" className="form-control" name="end_time" value={formData.end_time} onChange={handleChange} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Location</label>
              <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} required />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Province</label>
                <select className="form-select" name="province_id" value={formData.province_id} onChange={handleChange} required>
                  <option value="">Select Province</option>
                  {provinces.map(prov => <option key={prov.code} value={prov.code}>{prov.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">City</label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={!formData.province_id}>
                  <option value="">Select City</option>
                  {cities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">District</label>
                <select className="form-select" name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id}>
                  <option value="">Select District</option>
                  {districts.map(dist => <option key={dist.code} value={dist.code}>{dist.name}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event Type</label>
                <select className="form-select" name="event_type" value={formData.event_type} onChange={handleChange} required>
                  <option value="seminar">Seminar</option>
                  <option value="workshop">Workshop</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Target Audience</label>
                <input type="text" className="form-control" name="target_audience" value={formData.target_audience} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Attendees Count</label>
                <input type="number" className="form-control" name="attendees_count" value={formData.attendees_count} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Instructor Name</label>
                <input type="text" className="form-control" name="instructor_name" value={formData.instructor_name} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Instructor Phone</label>
                <input type="text" className="form-control" name="instructor_phone" value={formData.instructor_phone} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange} required>
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary">{id ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/events')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EventForm;
