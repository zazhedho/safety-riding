import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LocationPickerMap from '../../components/maps/LocationPickerMap';
import schoolService from '../../services/schoolService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const SchoolForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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
    student_count: '',
    teacher_count: '',
    major_count: '',
    visit_count: '',
    is_educated: false,
    last_visit_at: '',
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);

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
      toast.error(t('schools.form.fetchFailed'));
    } finally {
      setLoading(false);
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle count fields (student_count, teacher_count, major_count, visit_count)
    const countFields = ['student_count', 'teacher_count', 'major_count', 'visit_count'];
    if (countFields.includes(name)) {
      // Allow empty string or valid positive number only
      if (value === '' || (value >= 0 && !value.includes('-'))) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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

  const handleLocationSelect = (lat, lng, addressData) => {
    if (lat && lng) {
      setFormData(prev => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        latitude: '',
        longitude: '',
      }));
    }
  };

  const handleAddressDataReceived = async (addressData) => {
    if (!addressData) return;

    const updates = {};

    // Auto-fill school name if available and current name is empty
    if (addressData.schoolName && !formData.name) {
      updates.name = addressData.schoolName;
    }

    // Auto-fill address if available
    if (addressData.address) {
      updates.address = addressData.address;
    }

    // Auto-fill postal code if available
    if (addressData.postalCode) {
      updates.postal_code = addressData.postalCode;
    }

    // Try to match and auto-select province
    if (addressData.province && provinces.length > 0) {
      const matchedProvince = provinces.find(p =>
        p.name.toLowerCase().includes(addressData.province.toLowerCase()) ||
        addressData.province.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matchedProvince) {
        updates.province_id = matchedProvince.code;
        updates.province_name = matchedProvince.name;

        // Fetch cities for this province
        try {
          const response = await locationService.getCities(matchedProvince.code);
          const fetchedCities = response.data.data || [];
          setCities(fetchedCities);

          // Try to match city
          if (addressData.city && fetchedCities.length > 0) {
            const matchedCity = fetchedCities.find(c =>
              c.name.toLowerCase().includes(addressData.city.toLowerCase()) ||
              addressData.city.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matchedCity) {
              updates.city_id = matchedCity.code;
              updates.city_name = matchedCity.name;

              // Fetch districts for this city
              try {
                const districtResponse = await locationService.getDistricts(matchedProvince.code, matchedCity.code);
                const fetchedDistricts = districtResponse.data.data || [];
                setDistricts(fetchedDistricts);

                // Try to match district
                if (addressData.district && fetchedDistricts.length > 0) {
                  const matchedDistrict = fetchedDistricts.find(d =>
                    d.name.toLowerCase().includes(addressData.district.toLowerCase()) ||
                    addressData.district.toLowerCase().includes(d.name.toLowerCase())
                  );
                  if (matchedDistrict) {
                    updates.district_id = matchedDistrict.code;
                    updates.district_name = matchedDistrict.name;
                  }
                }
              } catch (error) {
                console.error('Error fetching districts:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching cities:', error);
        }
      }
    }

    // Apply all updates
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));

    // Show success message with what was auto-filled
    const filledFields = Object.keys(updates).filter(key => updates[key]);
    if (filledFields.length > 0) {
      toast.success(t('schools.form.autoFilled', { count: filledFields.length }));
    }
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
      student_count: formData.student_count === '' ? 0 : parseInt(formData.student_count, 10) || 0,
      teacher_count: formData.teacher_count === '' ? 0 : parseInt(formData.teacher_count, 10) || 0,
      major_count: formData.major_count === '' ? 0 : parseInt(formData.major_count, 10) || 0,
      visit_count: formData.visit_count === '' ? 0 : parseInt(formData.visit_count, 10) || 0,
      last_visit_at: formData.last_visit_at
        ? new Date(new Date(formData.last_visit_at).getTime() - new Date(formData.last_visit_at).getTimezoneOffset() * 60000).toISOString()
        : null,
    };

    try {
      if (id) {
        await schoolService.update(id, dataToSend);
        toast.success(t('schools.form.updateSuccess'));
      } else {
        await schoolService.create(dataToSend);
        toast.success(t('schools.form.createSuccess'));
      }
      navigate('/schools');
    } catch (error) {
      toast.error(error.response?.data?.message || t('schools.form.saveFailed'));
    }
  };

  if (loading) {
    return <>{t('common.loading')}</>;
  }

  return (
    <>
      <h2>{id ? t('schools.form.editTitle') : t('schools.form.addTitle')}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.name')}</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., SMA Negeri 1 Makassar" required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.npsn')}</label>
                <input type="text" className="form-control" name="npsn" value={formData.npsn} onChange={handleChange} placeholder="e.g., 40313421" required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">{t('schools.form.address')}</label>
              <textarea className="form-control" name="address" value={formData.address} onChange={handleChange} placeholder="e.g., Jl. Gunung Bawakaraeng No.53, Pisang Utara" required />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.phone')}</label>
                <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} placeholder="e.g., (0411) 3616292" required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.email')}</label>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} placeholder="e.g., info@sman1mks.sch.id" required />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.province')}</label>
                <select className="form-select" name="province_id" value={formData.province_id} onChange={handleChange} required>
                  <option value="">{t('schools.form.selectProvince')}</option>
                  {provinces.map(prov => <option key={prov.code} value={prov.code}>{prov.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.city')}</label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleChange} required disabled={!formData.province_id}>
                  <option value="">{t('schools.form.selectCity')}</option>
                  {cities.map(city => <option key={city.code} value={city.code}>{city.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.district')}</label>
                <select className="form-select" name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id}>
                  <option value="">{t('schools.form.selectDistrict')}</option>
                  {districts.map(dist => <option key={dist.code} value={dist.code}>{dist.name}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.postalCode')}</label>
                <input type="text" className="form-control" name="postal_code" value={formData.postal_code} onChange={handleChange} placeholder="e.g., 90115" />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.latitude')}</label>
                <input type="number" step="any" className="form-control" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g., -5.1353" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('schools.form.longitude')}</label>
                <input type="number" step="any" className="form-control" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g., 119.4238" />
              </div>
            </div>

            {/* Map Location Picker */}
            <div className="mb-3">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setShowMapPicker(!showMapPicker)}
              >
                <i className={`bi ${showMapPicker ? 'bi-chevron-up' : 'bi-map'} me-2`}></i>
                {showMapPicker ? t('schools.form.hideMap') : t('schools.form.pickLocation')}
              </button>
            </div>

            {showMapPicker && (
              <div className="mb-3">
                <LocationPickerMap
                  onLocationSelect={handleLocationSelect}
                  onAddressDataReceived={handleAddressDataReceived}
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                />
              </div>
            )}
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.studentCount')}</label>
                <input type="number" className="form-control" name="student_count" value={formData.student_count} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 1200" min="0" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.teacherCount')}</label>
                <input type="number" className="form-control" name="teacher_count" value={formData.teacher_count} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 75" min="0" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.majorCount')}</label>
                <input type="number" className="form-control" name="major_count" value={formData.major_count} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 3" min="0" />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.visitCount')}</label>
                <input type="number" className="form-control" name="visit_count" value={formData.visit_count} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 2" min="0" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">{t('schools.form.lastVisitAt')}</label>
                <input type="datetime-local" className="form-control" name="last_visit_at" value={formData.last_visit_at} onChange={handleChange} />
              </div>
              <div className="col-md-4 mb-3 d-flex align-items-center pt-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="is_educated" id="is_educated" checked={formData.is_educated} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="is_educated">
                    {t('schools.form.isEducated')}
                  </label>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">{id ? t('schools.form.update') : t('schools.form.save')}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/schools')}>{t('schools.form.cancel')}</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default SchoolForm;
