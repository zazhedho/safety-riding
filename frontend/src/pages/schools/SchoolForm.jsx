import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const SchoolForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    npsn: '',
    address: '',
    phone: '',
    email: '',
    province_id: '',
    city_id: '',
    district_id: '',
    province_name: '',
    city_name: '',
    district_name: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    student_count: 0,
    teacher_count: 0,
    major_count: 0,
    visit_count: 0,
    is_educated: false,
    last_visit_at: '',
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvinces();
    if (id) {
      fetchSchool(id);
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

  const fetchSchool = async (schoolId) => {
    try {
      const response = await schoolService.getById(schoolId);
      const schoolData = response.data.data;
      setFormData({
        ...schoolData,
        last_visit_at: schoolData.last_visit_at ? schoolData.last_visit_at.slice(0, 16) : '',
      });
    } catch (error) {
      toast.error('Failed to fetch school');
    } finally {
      setLoading(false);
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedProvince = provinces.find(p => p.code === formData.province_id);
    const selectedCity = cities.find(c => c.code === formData.city_id);
    const selectedDistrict = districts.find(d => d.code === formData.district_id);

    const dataToSend = {
      ...formData,
      province_name: selectedProvince ? selectedProvince.name : '',
      city_name: selectedCity ? selectedCity.name : '',
      district_name: selectedDistrict ? selectedDistrict.name : '',
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      student_count: parseInt(formData.student_count, 10) || 0,
      teacher_count: parseInt(formData.teacher_count, 10) || 0,
      major_count: parseInt(formData.major_count, 10) || 0,
      visit_count: parseInt(formData.visit_count, 10) || 0,
      last_visit_at: formData.last_visit_at
        ? new Date(new Date(formData.last_visit_at).getTime() - new Date(formData.last_visit_at).getTimezoneOffset() * 60000).toISOString()
        : null,
    };

    try {
      if (id) {
        await schoolService.update(id, dataToSend);
        toast.success('School updated successfully');
      } else {
        await schoolService.create(dataToSend);
        toast.success('School created successfully');
      }
      navigate('/schools');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save school');
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit School' : 'Add School'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">NPSN</label>
                <input type="text" className="form-control" name="npsn" value={formData.npsn} onChange={handleChange} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea className="form-control" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Phone</label>
                <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
              </div>
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
                <label className="form-label">City/Regency</label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={!formData.province_id}>
                  <option value="">Select City/Regency</option>
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
                <label className="form-label">Postal Code</label>
                <input type="text" className="form-control" name="postal_code" value={formData.postal_code} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Latitude</label>
                <input type="number" step="any" className="form-control" name="latitude" value={formData.latitude} onChange={handleChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Longitude</label>
                <input type="number" step="any" className="form-control" name="longitude" value={formData.longitude} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Student Count</label>
                <input type="number" className="form-control" name="student_count" value={formData.student_count} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Teacher Count</label>
                <input type="number" className="form-control" name="teacher_count" value={formData.teacher_count} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Major Count</label>
                <input type="number" className="form-control" name="major_count" value={formData.major_count} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Visit Count</label>
                <input type="number" className="form-control" name="visit_count" value={formData.visit_count} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Last Visit At</label>
                <input type="datetime-local" className="form-control" name="last_visit_at" value={formData.last_visit_at} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3 d-flex align-items-center pt-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="is_educated" id="is_educated" checked={formData.is_educated} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="is_educated">
                    Is Educated
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">{id ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/schools')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolForm;
