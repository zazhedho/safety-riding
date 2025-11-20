import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  // Photo upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [captions, setCaptions] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProvinces();
    if (id) {
      fetchAccident(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  // Cleanup photo previews on unmount
  useEffect(() => {
    return () => {
      photoPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [photoPreviews]);

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
    const { name, value, type, tagName } = e.target;

    // Check if this is one of the fields with "other" option
    if (['road_type', 'weather_condition', 'road_condition', 'vehicle_type', 'accident_type'].includes(name)) {
      // If it's a SELECT element (dropdown)
      if (tagName === 'SELECT') {
        if (value === 'other') {
          setOtherState(prev => ({ ...prev, [name]: true }));
          setFormData(prev => ({ ...prev, [name]: '' }));
        } else {
          setOtherState(prev => ({ ...prev, [name]: false }));
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      }
      // If it's an INPUT element (text field for "other")
      else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) : value
      }));
    }
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

  // Handle photo upload after accident is saved
  const handlePhotoUpload = async (accidentId) => {
    if (selectedFiles.length === 0) {
      return; // No photos to upload
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

      await accidentService.addPhotos(accidentId, formData);
      toast.success('Photos uploaded successfully');

      // Clear selection
      setSelectedFiles([]);
      setPhotoPreviews([]);
      setCaptions({});
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedFiles([]);
    setPhotoPreviews([]);
    setCaptions({});
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
      let accidentId = id;

      if (id) {
        await accidentService.update(id, dataToSend);
        toast.success('Accident updated successfully');
      } else {
        const response = await accidentService.create(dataToSend);
        accidentId = response.data.data.id;
        toast.success('Accident created successfully');
      }

      // Upload photos if any are selected
      if (selectedFiles.length > 0) {
        await handlePhotoUpload(accidentId);
      }

      navigate('/accidents');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save accident');
    }
  };

  if (loading) {
    return <>Loading...</>;
  }

  return (
    <>
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
            {/* Photo Upload Section */}
            <div className="mb-4">
              <h5 className="mb-3">
                <i className="bi bi-images me-2"></i>Accident Photos {!id && <span className="text-muted small">(Optional - will be uploaded after saving)</span>}
              </h5>
              <div className="card border-primary">
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Select Photos (Max 4 photos, 5MB each)</label>
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

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleClearSelection}
                        disabled={uploading}
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  {id ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                id ? 'Update' : 'Create'
              )}
            </button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/accidents')} disabled={uploading}>Cancel</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AccidentForm;
