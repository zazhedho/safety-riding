import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import marketShareService from '../../services/marketShareService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';

const MarketShareForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    province_id: '', province_name: '', city_id: '', city_name: '', district_id: '', district_name: '',
    month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    monthly_sales: '', yearly_sales: '', monthly_sales_percentage: '', yearly_sales_percentage: '',
    monthly_competitor_sales: '', yearly_competitor_sales: '',
    monthly_competitor_percentage: '', yearly_competitor_percentage: '', notes: ''
  });
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProvinces();
    if (id) fetchMarketShare(id);
  }, [id]);

  useEffect(() => { if (formData.province_id) fetchCities(formData.province_id); }, [formData.province_id]);
  useEffect(() => { if (formData.city_id) fetchDistricts(formData.province_id, formData.city_id); }, [formData.city_id]);

  const fetchProvinces = async () => {
    try {
      const res = await locationService.getProvinces();
      setProvinces(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load provinces');
    }
  };

  const fetchCities = async (provinceCode) => {
    try {
      const res = await locationService.getCities(provinceCode);
      setCities(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load cities');
    }
  };

  const fetchDistricts = async (provinceCode, cityCode) => {
    try {
      const res = await locationService.getDistricts(provinceCode, cityCode);
      setDistricts(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load districts');
    }
  };

  const fetchMarketShare = async (marketShareId) => {
    try {
      const res = await marketShareService.getById(marketShareId);
      setFormData(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch market share');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const intFields = ['month', 'year'];
    const floatFields = [
      'monthly_sales',
      'yearly_sales',
      'monthly_sales_percentage',
      'yearly_sales_percentage',
      'monthly_competitor_sales',
      'yearly_competitor_sales',
      'monthly_competitor_percentage',
      'yearly_competitor_percentage'
    ];

    // Validate positive numbers for numeric fields
    if ([...intFields, ...floatFields].includes(name)) {
      // Allow empty string or valid positive number only
      if (value === '' || (value >= 0 && !value.includes('-'))) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    if (name === 'province_id') {
      const province = provinces.find(p => p.code === value);
      setFormData(prev => ({ ...prev, province_id: value, province_name: province?.name || '', city_id: '', district_id: '' }));
    } else if (name === 'city_id') {
      const city = cities.find(c => c.code === value);
      setFormData(prev => ({ ...prev, city_id: value, city_name: city?.name || '', district_id: '' }));
    } else if (name === 'district_id') {
      const district = districts.find(d => d.code === value);
      setFormData(prev => ({ ...prev, district_id: value, district_name: district?.name || '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        month: formData.month === '' ? 0 : Number(formData.month) || 0,
        year: formData.year === '' ? 0 : Number(formData.year) || 0,
        monthly_sales: formData.monthly_sales === '' ? 0 : parseFloat(formData.monthly_sales) || 0,
        yearly_sales: formData.yearly_sales === '' ? 0 : parseFloat(formData.yearly_sales) || 0,
        monthly_sales_percentage: formData.monthly_sales_percentage === '' ? 0 : parseFloat(formData.monthly_sales_percentage) || 0,
        yearly_sales_percentage: formData.yearly_sales_percentage === '' ? 0 : parseFloat(formData.yearly_sales_percentage) || 0,
        monthly_competitor_sales: formData.monthly_competitor_sales === '' ? 0 : parseFloat(formData.monthly_competitor_sales) || 0,
        yearly_competitor_sales: formData.yearly_competitor_sales === '' ? 0 : parseFloat(formData.yearly_competitor_sales) || 0,
        monthly_competitor_percentage: formData.monthly_competitor_percentage === '' ? 0 : parseFloat(formData.monthly_competitor_percentage) || 0,
        yearly_competitor_percentage: formData.yearly_competitor_percentage === '' ? 0 : parseFloat(formData.yearly_competitor_percentage) || 0,
      };

      if (id) {
        await marketShareService.update(id, payload);
        toast.success('Market share updated successfully');
      } else {
        await marketShareService.create(payload);
        toast.success('Market share created successfully');
      }
      navigate('/marketshare');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save market share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit' : 'Add'} Market Share</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label>Province</label>
                <select className="form-select" name="province_id" value={formData.province_id} onChange={handleLocationChange} required>
                  <option value="">Select Province</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label>City</label>
                <select className="form-select" name="city_id" value={formData.city_id} onChange={handleLocationChange} required disabled={!formData.province_id}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-md-4 mb-3">
                <label>District</label>
                <select className="form-select" name="district_id" value={formData.district_id} onChange={handleLocationChange} required disabled={!formData.city_id}>
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label>Month</label>
                <select className="form-select" name="month" value={formData.month} onChange={handleChange} required>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label>Year</label>
                <input type="number" className="form-control" name="year" value={formData.year} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 2024" min="2000" required />
              </div>
            </div>

            <h5 className="mt-3">Company Sales</h5>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label>Monthly Sales</label>
                <input type="number" step="0.01" className="form-control" name="monthly_sales" value={formData.monthly_sales} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 50000000" min="0" required />
              </div>
              <div className="col-md-3 mb-3">
                <label>Monthly %</label>
                <input type="number" step="0.01" className="form-control" name="monthly_sales_percentage" value={formData.monthly_sales_percentage} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 45.5" min="0" max="100" required />
              </div>
              <div className="col-md-3 mb-3">
                <label>Yearly Sales</label>
                <input type="number" step="0.01" className="form-control" name="yearly_sales" value={formData.yearly_sales} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 600000000" min="0" required />
              </div>
              <div className="col-md-3 mb-3">
                <label>Yearly %</label>
                <input type="number" step="0.01" className="form-control" name="yearly_sales_percentage" value={formData.yearly_sales_percentage} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 42.3" min="0" max="100" required />
              </div>
            </div>

            <h5 className="mt-3">Competitor Sales</h5>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label>Monthly Sales</label>
                <input type="number" step="0.01" className="form-control" name="monthly_competitor_sales" value={formData.monthly_competitor_sales} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 60000000" min="0" required />
              </div>
              <div className="col-md-3 mb-3">
                <label>Monthly %</label>
                <input type="number" step="0.01" className="form-control" name="monthly_competitor_percentage" value={formData.monthly_competitor_percentage} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 54.5" min="0" max="100" required />
              </div>
              <div className="col-md-3 mb-3">
                <label>Yearly Sales</label>
                <input type="number" step="0.01" className="form-control" name="yearly_competitor_sales" value={formData.yearly_competitor_sales} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 820000000" min="0" required />
              </div>
              <div className="col-md-3 mb-3">
                <label>Yearly %</label>
                <input type="number" step="0.01" className="form-control" name="yearly_competitor_percentage" value={formData.yearly_competitor_percentage} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 57.7" min="0" max="100" required />
              </div>
            </div>

            <div className="mb-3">
              <label>Notes</label>
              <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., Market share increased due to successful promotional campaign" rows="3"></textarea>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : id ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/marketshare')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketShareForm;
