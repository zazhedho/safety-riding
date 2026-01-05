import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import poldaService from '../../services/poldaService';
import { toast } from 'react-toastify';

const PoldaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    police_unit: '',
    total_accidents: 0,
    total_deaths: 0,
    total_severe_injury: 0,
    total_minor_injury: 0,
    period: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchPoldaData();
    }
  }, [id, isEdit]);

  const fetchPoldaData = async () => {
    try {
      setLoading(true);
      const response = await poldaService.getById(id);
      setFormData(response.data.data);
    } catch (error) {
      console.error('Error fetching POLDA data:', error);
      toast.error('Failed to fetch POLDA data');
      navigate('/polda-accidents');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value) || 0) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.police_unit.trim()) {
      newErrors.police_unit = 'Police unit is required';
    }

    if (!formData.period.trim()) {
      newErrors.period = 'Period is required';
    }

    if (formData.total_accidents < 0 || formData.total_accidents === '') {
      newErrors.total_accidents = 'Total accidents cannot be negative';
    }

    if (formData.total_deaths < 0 || formData.total_deaths === '') {
      newErrors.total_deaths = 'Total deaths cannot be negative';
    }

    if (formData.total_severe_injury < 0 || formData.total_severe_injury === '') {
      newErrors.total_severe_injury = 'Total severe injury cannot be negative';
    }

    if (formData.total_minor_injury < 0 || formData.total_minor_injury === '') {
      newErrors.total_minor_injury = 'Total minor injury cannot be negative';
    }

    // Logical validation
    const totalAccidents = formData.total_accidents === '' ? 0 : formData.total_accidents;
    const totalDeaths = formData.total_deaths === '' ? 0 : formData.total_deaths;
    const totalSevere = formData.total_severe_injury === '' ? 0 : formData.total_severe_injury;
    const totalMinor = formData.total_minor_injury === '' ? 0 : formData.total_minor_injury;
    
    const totalCasualties = totalDeaths + totalSevere + totalMinor;
    if (totalCasualties > totalAccidents && totalAccidents > 0) {
      newErrors.total_accidents = 'Total casualties cannot exceed total accidents';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setLoading(true);
      
      // Convert empty strings to 0 for number fields before submit
      const submitData = {
        ...formData,
        total_accidents: formData.total_accidents === '' ? 0 : formData.total_accidents,
        total_deaths: formData.total_deaths === '' ? 0 : formData.total_deaths,
        total_severe_injury: formData.total_severe_injury === '' ? 0 : formData.total_severe_injury,
        total_minor_injury: formData.total_minor_injury === '' ? 0 : formData.total_minor_injury,
      };
      
      if (isEdit) {
        await poldaService.update(id, submitData);
        toast.success('POLDA data updated successfully');
      } else {
        await poldaService.create(submitData);
        toast.success('POLDA data created successfully');
      }
      
      navigate('/polda-accidents');
    } catch (error) {
      console.error('Error saving POLDA data:', error);
      toast.error(error.response?.data?.message || 'Failed to save POLDA data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/polda-accidents');
  };

  if (loading && isEdit) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-clipboard-data me-2"></i>
                {isEdit ? 'Edit POLDA Data' : 'Add New POLDA Data'}
              </h5>
            </div>

            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Police Unit */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="police_unit" className="form-label">
                      Police Unit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.police_unit ? 'is-invalid' : ''}`}
                      id="police_unit"
                      name="police_unit"
                      value={formData.police_unit}
                      onChange={handleInputChange}
                      placeholder="e.g., POLRES MATARAM"
                    />
                    {errors.police_unit && (
                      <div className="invalid-feedback">{errors.police_unit}</div>
                    )}
                  </div>

                  {/* Period */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="period" className="form-label">
                      Period <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.period ? 'is-invalid' : ''}`}
                      id="period"
                      name="period"
                      value={formData.period}
                      onChange={handleInputChange}
                      placeholder="e.g., 2024-01, 2024-Q1, 2024"
                    />
                    {errors.period && (
                      <div className="invalid-feedback">{errors.period}</div>
                    )}
                    <div className="form-text">
                      Format examples: 2024-01 (monthly), 2024-Q1 (quarterly), 2024 (yearly)
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Total Accidents */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="total_accidents" className="form-label">
                      Total Accidents <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.total_accidents ? 'is-invalid' : ''}`}
                      id="total_accidents"
                      name="total_accidents"
                      value={formData.total_accidents}
                      onChange={handleInputChange}
                      min="0"
                    />
                    {errors.total_accidents && (
                      <div className="invalid-feedback">{errors.total_accidents}</div>
                    )}
                  </div>

                  {/* Total Deaths */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="total_deaths" className="form-label">
                      Total Deaths <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.total_deaths ? 'is-invalid' : ''}`}
                      id="total_deaths"
                      name="total_deaths"
                      value={formData.total_deaths}
                      onChange={handleInputChange}
                      min="0"
                    />
                    {errors.total_deaths && (
                      <div className="invalid-feedback">{errors.total_deaths}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  {/* Total Severe Injury */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="total_severe_injury" className="form-label">
                      Total Severe Injury <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.total_severe_injury ? 'is-invalid' : ''}`}
                      id="total_severe_injury"
                      name="total_severe_injury"
                      value={formData.total_severe_injury}
                      onChange={handleInputChange}
                      min="0"
                    />
                    {errors.total_severe_injury && (
                      <div className="invalid-feedback">{errors.total_severe_injury}</div>
                    )}
                  </div>

                  {/* Total Minor Injury */}
                  <div className="col-md-6 mb-3">
                    <label htmlFor="total_minor_injury" className="form-label">
                      Total Minor Injury <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.total_minor_injury ? 'is-invalid' : ''}`}
                      id="total_minor_injury"
                      name="total_minor_injury"
                      value={formData.total_minor_injury}
                      onChange={handleInputChange}
                      min="0"
                    />
                    {errors.total_minor_injury && (
                      <div className="invalid-feedback">{errors.total_minor_injury}</div>
                    )}
                  </div>
                </div>

                {/* Summary Card */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-title">Summary</h6>
                        <div className="row text-center">
                          <div className="col-md-3">
                            <div className="text-primary">
                              <i className="bi bi-exclamation-triangle display-6"></i>
                              <div className="mt-2">
                                <strong>{formData.total_accidents === '' ? 0 : formData.total_accidents}</strong>
                                <div className="small text-muted">Total Accidents</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-danger">
                              <i className="bi bi-x-circle display-6"></i>
                              <div className="mt-2">
                                <strong>{formData.total_deaths === '' ? 0 : formData.total_deaths}</strong>
                                <div className="small text-muted">Deaths</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-warning">
                              <i className="bi bi-bandaid display-6"></i>
                              <div className="mt-2">
                                <strong>{formData.total_severe_injury === '' ? 0 : formData.total_severe_injury}</strong>
                                <div className="small text-muted">Severe Injury</div>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="text-success">
                              <i className="bi bi-heart-pulse display-6"></i>
                              <div className="mt-2">
                                <strong>{formData.total_minor_injury === '' ? 0 : formData.total_minor_injury}</strong>
                                <div className="small text-muted">Minor Injury</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            {isEdit ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-1"></i>
                            {isEdit ? 'Update Data' : 'Create Data'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoldaForm;
