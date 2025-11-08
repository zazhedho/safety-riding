import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import LocationPickerMap from '../../components/maps/LocationPickerMap';
import publicService from '../../services/publicService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const PublicForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
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
    employee_count: '',
    visit_count: '',
    is_educated: false,
    last_visit_at: '',
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const categories = [
    'Private Company',
    'Government',
    'MC/User',
    'Community',
    'SR Campaign',
    'SR Campaign Blackspot',
    'Partnership'
  ];

  useEffect(() => {
    fetchProvinces();
    if (id) {
      fetchPublic(id);
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

  const fetchPublic = async (publicId) => {
    try {
      const response = await publicService.getById(publicId);
      const publicData = response.data.data;
      setFormData({
        ...publicData,
        last_visit_at: publicData.last_visit_at ? publicData.last_visit_at.slice(0, 16) : '',
      });
    } catch (error) {
      toast.error('Failed to fetch public entity');
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

  const handleProvinceChange = (e) => {
    const selectedCode = e.target.value;
    const selectedProvince = provinces.find(p => p.code === selectedCode);

    setFormData(prev => ({
      ...prev,
      province_id: selectedCode,
      province_name: selectedProvince ? selectedProvince.name : '',
      city_id: '',
      city_name: '',
      district_id: '',
      district_name: '',
    }));
    setCities([]);
    setDistricts([]);
  };

  const handleCityChange = (e) => {
    const selectedCode = e.target.value;
    const selectedCity = cities.find(c => c.code === selectedCode);

    setFormData(prev => ({
      ...prev,
      city_id: selectedCode,
      city_name: selectedCity ? selectedCity.name : '',
      district_id: '',
      district_name: '',
    }));
    setDistricts([]);
  };

  const handleDistrictChange = (e) => {
    const selectedCode = e.target.value;
    const selectedDistrict = districts.find(d => d.code === selectedCode);

    setFormData(prev => ({
      ...prev,
      district_id: selectedCode,
      district_name: selectedDistrict ? selectedDistrict.name : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle count fields (employee_count, visit_count)
    const countFields = ['employee_count', 'visit_count'];
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

  const handleLocationSelect = (lat, lng) => {
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

    if (addressData.schoolName && !formData.name) {
      updates.name = addressData.schoolName;
    }

    if (addressData.address) {
      updates.address = addressData.address;
    }

    if (addressData.postalCode) {
      updates.postal_code = addressData.postalCode;
    }

    if (addressData.province && provinces.length > 0) {
      const matchedProvince = provinces.find(p =>
        p.name.toLowerCase().includes(addressData.province.toLowerCase()) ||
        addressData.province.toLowerCase().includes(p.name.toLowerCase())
      );

      if (matchedProvince) {
        updates.province_id = matchedProvince.code;
        updates.province_name = matchedProvince.name;

        try {
          const cityResponse = await locationService.getCities(matchedProvince.code);
          const fetchedCities = cityResponse.data.data || [];
          setCities(fetchedCities);

          const possibleCity = addressData.city || addressData.regency;
          if (possibleCity && fetchedCities.length > 0) {
            const matchedCity = fetchedCities.find(c =>
              c.name.toLowerCase().includes(possibleCity.toLowerCase()) ||
              possibleCity.toLowerCase().includes(c.name.toLowerCase())
            );

            if (matchedCity) {
              updates.city_id = matchedCity.code;
              updates.city_name = matchedCity.name;

              try {
                const districtResponse = await locationService.getDistricts(matchedProvince.code, matchedCity.code);
                const fetchedDistricts = districtResponse.data.data || [];
                setDistricts(fetchedDistricts);

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

    setFormData(prev => ({
      ...prev,
      ...updates,
    }));

    const filledFields = Object.keys(updates).filter(key => updates[key]);
    if (filledFields.length > 0) {
      toast.success(`Auto-filled ${filledFields.length} field(s) from location data`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedProvince = provinces.find(p => p.code === formData.province_id);
    const selectedCity = cities.find(c => c.code === formData.city_id);
    const selectedDistrict = districts.find(d => d.code === formData.district_id);

    try {
      const dataToSend = {
        ...formData,
        province_name: selectedProvince ? selectedProvince.name : '',
        city_name: selectedCity ? selectedCity.name : '',
        district_name: selectedDistrict ? selectedDistrict.name : '',
        employee_count: formData.employee_count === '' ? 0 : parseInt(formData.employee_count) || 0,
        visit_count: formData.visit_count === '' ? 0 : parseInt(formData.visit_count) || 0,
        latitude: formData.latitude ? parseFloat(formData.latitude) : 0,
        longitude: formData.longitude ? parseFloat(formData.longitude) : 0,
        last_visit_at: formData.last_visit_at
          ? new Date(new Date(formData.last_visit_at).getTime() - new Date(formData.last_visit_at).getTimezoneOffset() * 60000).toISOString()
          : null,
      };

      if (id) {
        await publicService.update(id, dataToSend);
        toast.success('Public entity updated successfully');
      } else {
        await publicService.create(dataToSend);
        toast.success('Public entity created successfully');
      }
      navigate('/publics');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save public entity');
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Public Entity' : 'Add Public Entity'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., PT Aman Berkendara"
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Address *</label>
              <textarea
                className="form-control"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., Jl. Gunung Sahari No.10, Jakarta Pusat"
                rows="3"
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., (021) 12345678"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., contact@amanberkendara.id"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Province *</label>
                <select
                  className="form-select"
                  name="province_id"
                  value={formData.province_id}
                  onChange={handleProvinceChange}
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map(province => (
                    <option key={province.code} value={province.code}>{province.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">City/Regency *</label>
                <select
                  className="form-select"
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleCityChange}
                  disabled={!formData.province_id}
                  required
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.code} value={city.code}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">District *</label>
                <select
                  className="form-select"
                  name="district_id"
                  value={formData.district_id}
                  onChange={handleDistrictChange}
                  disabled={!formData.city_id}
                  required
                >
                  <option value="">Select District</option>
                  {districts.map(district => (
                    <option key={district.code} value={district.code}>{district.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  className="form-control"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="e.g., 10210"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g., -6.2000"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g., 106.8167"
                />
              </div>
            </div>

            <div className="mb-3">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setShowMapPicker(prev => !prev)}
              >
                <i className={`bi ${showMapPicker ? 'bi-chevron-up' : 'bi-map'} me-2`}></i>
                {showMapPicker ? 'Hide Map Picker' : 'Pick Location on Map'}
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
                <label className="form-label">Employee Count</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="employee_count"
                  value={formData.employee_count}
                  onChange={handleChange}
                  onFocus={handleNumberFocus}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="e.g., 150"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Visit Count</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="visit_count"
                  value={formData.visit_count}
                  onChange={handleChange}
                  onFocus={handleNumberFocus}
                  onKeyDown={handleNumberKeyDown}
                  placeholder="e.g., 4"
                />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Last Visit</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  name="last_visit_at"
                  value={formData.last_visit_at}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="is_educated"
                name="is_educated"
                checked={formData.is_educated}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="is_educated">
                Has Received Education
              </label>
            </div>

            <button type="submit" className="btn btn-primary">
              {id ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => navigate('/publics')}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PublicForm;
