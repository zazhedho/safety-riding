import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import accidentService from '../../services/accidentService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const AccidentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    police_report_no: '',
    accident_date: '',
    accident_time: '',
    location: '',
    province_id: '',
    city_id: '',
    district_id: '',
    province_name: '',
    city_name: '',
    district_name: '',
    latitude: 0,
    longitude: 0,
    road_type: '',
    weather_condition: '',
    road_condition: '',
    vehicle_type: '',
    accident_type: '',
    death_count: 0,
    injured_count: 0,
    minor_injured_count: 0,
    vehicle_count: 0,
    cause_of_accident: '',
    description: '',
    police_station: '',
    officer_name: ''
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [otherState, setOtherState] = useState({
    road_type: false,
    weather_condition: false,
    road_condition: false,
    vehicle_type: false,
    accident_type: false,
  });

  useEffect(() => {
    fetchProvinces();
    if (id) {
      fetchAccident(id);
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

  const fetchAccident = async (accidentId) => {
    try {
      const response = await accidentService.getById(accidentId);
      setFormData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch accident');
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
    const { name, value, type } = e.target;
    if (['road_type', 'weather_condition', 'road_condition', 'vehicle_type', 'accident_type'].includes(name)) {
      if (value === 'other') {
        setOtherState(prev => ({ ...prev, [name]: true }));
        setFormData(prev => ({ ...prev, [name]: '' }));
      } else {
        setOtherState(prev => ({ ...prev, [name]: false }));
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseInt(value, 10) : value 
      }));
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
      death_count: parseInt(formData.death_count, 10) || 0,
      injured_count: parseInt(formData.injured_count, 10) || 0,
      minor_injured_count: parseInt(formData.minor_injured_count, 10) || 0,
      vehicle_count: parseInt(formData.vehicle_count, 10) || 0,
    };

    try {
      if (id) {
        await accidentService.update(id, dataToSend);
        toast.success('Accident updated successfully');
      } else {
        await accidentService.create(dataToSend);
        toast.success('Accident created successfully');
      }
      navigate('/accidents');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save accident');
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Accident' : 'Add Accident'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Police Report Number</label>
                <input type="text" className="form-control" name="police_report_no" value={formData.police_report_no} onChange={handleChange} placeholder="e.g., LP/001/I/2024/SPKT" required />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Accident Date</label>
                <input type="date" className="form-control" name="accident_date" value={formData.accident_date} onChange={handleChange} required />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Accident Time</label>
                <input type="time" className="form-control" name="accident_time" value={formData.accident_time} onChange={handleChange} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Location</label>
              <textarea className="form-control" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Jl. Jenderal Sudirman, in front of Graha Pena" required />
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
                <label className="form-label">Latitude</label>
                <input type="number" step="any" className="form-control" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="e.g., -6.2345" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Longitude</label>
                <input type="number" step="any" className="form-control" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="e.g., 106.8294" />
              </div>
            </div>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Road Type</label>
                <select className="form-select" name="road_type" value={otherState.road_type ? 'other' : formData.road_type} onChange={handleChange}>
                  <option value="">Select Road Type</option>
                  <option value="National Road">National Road</option>
                  <option value="Provincial Road">Provincial Road</option>
                  <option value="other">Other</option>
                </select>
                {otherState.road_type && <input type="text" className="form-control mt-2" name="road_type" value={formData.road_type} onChange={handleChange} placeholder="Enter road type" />}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Weather Condition</label>
                <select className="form-select" name="weather_condition" value={otherState.weather_condition ? 'other' : formData.weather_condition} onChange={handleChange}>
                  <option value="">Select Weather</option>
                  <option value="Sunny">Sunny</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="other">Other</option>
                </select>
                {otherState.weather_condition && <input type="text" className="form-control mt-2" name="weather_condition" value={formData.weather_condition} onChange={handleChange} placeholder="Enter weather condition" />}
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Road Condition</label>
                <select className="form-select" name="road_condition" value={otherState.road_condition ? 'other' : formData.road_condition} onChange={handleChange}>
                  <option value="">Select Condition</option>
                  <option value="Good">Good</option>
                  <option value="Potholed">Potholed</option>
                  <option value="Slippery">Slippery</option>
                  <option value="other">Other</option>
                </select>
                {otherState.road_condition && <input type="text" className="form-control mt-2" name="road_condition" value={formData.road_condition} onChange={handleChange} placeholder="Enter road condition" />}
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Vehicle Type</label>
                <select className="form-select" name="vehicle_type" value={otherState.vehicle_type ? 'other' : formData.vehicle_type} onChange={handleChange} required>
                  <option value="">Select Vehicle Type</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Car">Car</option>
                  <option value="Bus">Bus</option>
                  <option value="Truck">Truck</option>
                  <option value="other">Other</option>
                </select>
                {otherState.vehicle_type && <input type="text" className="form-control mt-2" name="vehicle_type" value={formData.vehicle_type} onChange={handleChange} placeholder="Enter vehicle type" required />}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Accident Type</label>
                <select className="form-select" name="accident_type" value={otherState.accident_type ? 'other' : formData.accident_type} onChange={handleChange} required>
                  <option value="">Select Accident Type</option>
                  <option value="Single Vehicle">Single Vehicle</option>
                  <option value="Head-on Collision">Head-on Collision</option>
                  <option value="Side Collision">Side Collision</option>
                  <option value="Rear-end Collision">Rear-end Collision</option>
                  <option value="other">Other</option>
                </select>
                {otherState.accident_type && <input type="text" className="form-control mt-2" name="accident_type" value={formData.accident_type} onChange={handleChange} placeholder="Enter accident type" required />}
              </div>
            </div>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Death Count</label>
                <input type="number" className="form-control" name="death_count" value={formData.death_count} onChange={handleChange} placeholder="e.g., 1" min="0" />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Injured Count</label>
                <input type="number" className="form-control" name="injured_count" value={formData.injured_count} onChange={handleChange} placeholder="e.g., 2" min="0" />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Minor Injured Count</label>
                <input type="number" className="form-control" name="minor_injured_count" value={formData.minor_injured_count} onChange={handleChange} placeholder="e.g., 3" min="0" />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Vehicle Count</label>
                <input type="number" className="form-control" name="vehicle_count" value={formData.vehicle_count} onChange={handleChange} placeholder="e.g., 2" min="0" />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Cause of Accident</label>
              <textarea className="form-control" name="cause_of_accident" value={formData.cause_of_accident} onChange={handleChange} placeholder="e.g., Driver negligence, brake failure" />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} placeholder="Provide a brief description of the accident" />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Police Station</label>
                <input type="text" className="form-control" name="police_station" value={formData.police_station} onChange={handleChange} placeholder="e.g., Polresta Makassar" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Officer Name</label>
                <input type="text" className="form-control" name="officer_name" value={formData.officer_name} onChange={handleChange} placeholder="e.g., Bripka John Doe" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">{id ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/accidents')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccidentForm;
