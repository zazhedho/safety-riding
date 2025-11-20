import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import marketShareService from '../../services/marketShareService';
import locationService from '../../services/locationService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const MarketShareList = () => {
  const { hasPermission } = useAuth();
  const [marketShares, setMarketShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    year: new Date().getFullYear(),
    month: '',
    province_id: '',
    city_id: '',
    district_id: ''
  });
  const [summaryFilters, setSummaryFilters] = useState({
    level: 'province',
    year: new Date().getFullYear(),
    month: '',
    province_id: '',
    city_id: '',
    district_id: ''
  });
  const [summaryData, setSummaryData] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filtersVersion, setFiltersVersion] = useState(0);

  useEffect(() => {
    fetchMarketShares();
  }, [pagination.page, pagination.limit, filtersVersion]);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (summaryFilters.province_id) {
      loadCities(summaryFilters.province_id);
    } else {
      setCities([]);
      setDistricts([]);
    }
  }, [summaryFilters.province_id]);

  useEffect(() => {
    if (summaryFilters.province_id && summaryFilters.city_id) {
      loadDistricts(summaryFilters.province_id, summaryFilters.city_id);
    } else {
      setDistricts([]);
    }
  }, [summaryFilters.city_id, summaryFilters.province_id]);

  useEffect(() => {
    if (filters.province_id) {
      loadCities(filters.province_id);
    }
  }, [filters.province_id]);

  useEffect(() => {
    if (filters.province_id && filters.city_id) {
      loadDistricts(filters.province_id, filters.city_id);
    }
  }, [filters.city_id, filters.province_id]);

  const fetchMarketShares = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (filters.search) params.search = filters.search;
      if (filters.year) params['filters[year]'] = Number(filters.year);
      if (filters.month) params['filters[month]'] = Number(filters.month);
      if (filters.province_id) params['filters[province_id]'] = filters.province_id;
      if (filters.city_id) params['filters[city_id]'] = filters.city_id;
      if (filters.district_id) params['filters[district_id]'] = filters.district_id;
      const response = await marketShareService.getAll(params);
      setMarketShares(response.data.data || []);
      setPagination(prev => ({ ...prev, total: response.data.total_data || 0 }));
    } catch (error) {
      toast.error('Failed to load market shares');
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const res = await locationService.getProvinces();
      setProvinces(res.data.data || []);
    } catch (error) {
      console.error('Failed to load provinces', error);
    }
  };

  const loadCities = async (provinceId) => {
    try {
      const res = await locationService.getCities(provinceId);
      setCities(res.data.data || []);
    } catch (error) {
      console.error('Failed to load cities', error);
      setCities([]);
    }
  };

  const loadDistricts = async (provinceId, cityId) => {
    try {
      const res = await locationService.getDistricts(provinceId, cityId);
      setDistricts(res.data.data || []);
    } catch (error) {
      console.error('Failed to load districts', error);
      setDistricts([]);
    }
  };

  const handleDelete = (id) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await marketShareService.delete(selectedId);
      toast.success('Market share deleted successfully');
      setShowDeleteModal(false);
      fetchMarketShares();
    } catch (error) {
      toast.error('Failed to delete market share');
    }
  };

  const handleListFilterChange = (name, value) => {
    setFilters(prev => {
      if (name === 'province_id') {
        if (!value) {
          setCities([]);
          setDistricts([]);
        }
        return { ...prev, province_id: value, city_id: '', district_id: '' };
      }
      if (name === 'city_id') {
        if (!value) {
          setDistricts([]);
        }
        return { ...prev, city_id: value, district_id: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const applyListFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFiltersVersion(prev => prev + 1);
    setSummaryFilters(prev => ({
      ...prev,
      year: filters.year,
      month: filters.month,
      province_id: prev.level === 'province' ? '' : filters.province_id,
      city_id: prev.level === 'district' ? filters.city_id : '',
      district_id: prev.level === 'district' ? filters.district_id : ''
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatUnits = (value) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value || 0);

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  const formatPercentage = (value) => `${Number(value || 0).toFixed(1)}%`;

  const locationLabel = (item) => {
    if (item.district_name) {
      return `${item.district_name}, ${item.city_name}`;
    }
    if (item.city_name) {
      return `${item.city_name}, ${item.province_name}`;
    }
    return item.province_name || '-';
  };

  useEffect(() => {
    setSummaryFilters(prev => ({
      ...prev,
      year: filters.year,
      month: filters.month
    }));
  }, [filters.year, filters.month]);

  const handleSummaryLevelChange = (e) => {
    const level = e.target.value;
    setSummaryFilters(prev => ({
      ...prev,
      level,
      province_id: level === 'province' ? '' : prev.province_id,
      city_id: level === 'district' ? prev.city_id : '',
      district_id: ''
    }));
  };

  const handleSummaryLocationChange = (name, value) => {
    setSummaryFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'province_id' ? { city_id: '', district_id: '' } : {}),
      ...(name === 'city_id' ? { district_id: '' } : {})
    }));
  };

  const handleSummaryFieldChange = (name, value) => {
    setSummaryFilters(prev => ({ ...prev, [name]: value }));
  };

  const loadSummaryData = async () => {
    try {
      setSummaryLoading(true);
      const params = {
        level: summaryFilters.level,
        year: Number(summaryFilters.year) || new Date().getFullYear(),
      };
      if (summaryFilters.month) params.month = Number(summaryFilters.month);
      if (summaryFilters.province_id) params.province_id = summaryFilters.province_id;
      if (summaryFilters.city_id) params.city_id = summaryFilters.city_id;
      if (summaryFilters.district_id) params.district_id = summaryFilters.district_id;

      const response = await marketShareService.getSummary(params);
      setSummaryData(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load market share summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [
    summaryFilters.level,
    summaryFilters.year,
    summaryFilters.month,
    summaryFilters.province_id,
    summaryFilters.city_id,
    summaryFilters.district_id
  ]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Market Share</h2>
        {hasPermission('create_market_shares') && (
          <Link to="/marketshare/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Market Share
          </Link>
        )}
      </div>

      {/* Summary and Insights */}
      <div className="card mb-4">
        <div className="card-header d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <h5 className="mb-1">Market Share Summary</h5>
            <small className="text-muted">Aggregate sales and competitor statistics by region</small>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => loadSummaryData()} disabled={summaryLoading}>
              {summaryLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Summary Level</label>
              <select className="form-select" value={summaryFilters.level} onChange={handleSummaryLevelChange}>
                <option value="province">Province</option>
                <option value="city">City / Regency</option>
                <option value="district">District</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Year</label>
              <input type="number" className="form-control" value={summaryFilters.year} min="2000" onChange={(e) => handleSummaryFieldChange('year', e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Month</label>
              <select className="form-select" value={summaryFilters.month} onChange={(e) => handleSummaryFieldChange('month', e.target.value)}>
                <option value="">All Months</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>
            {summaryFilters.level !== 'province' && (
              <div className="col-md-2">
                <label className="form-label">Province</label>
                <select className="form-select" value={summaryFilters.province_id} onChange={(e) => handleSummaryLocationChange('province_id', e.target.value)}>
                  <option value="">All Provinces</option>
                  {provinces.map((prov) => (
                    <option key={prov.code} value={prov.code}>{prov.name}</option>
                  ))}
                </select>
              </div>
            )}
            {summaryFilters.level === 'district' && (
              <>
                <div className="col-md-2">
                  <label className="form-label">City / Regency</label>
                  <select className="form-select" value={summaryFilters.city_id} onChange={(e) => handleSummaryLocationChange('city_id', e.target.value)} disabled={!summaryFilters.province_id}>
                    <option value="">All Cities</option>
                    {cities.map((city) => (
                      <option key={city.code} value={city.code}>{city.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">District</label>
                  <select className="form-select" value={summaryFilters.district_id} onChange={(e) => handleSummaryLocationChange('district_id', e.target.value)} disabled={!summaryFilters.city_id}>
                    <option value="">All Districts</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>{district.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="table-responsive mt-4">
            {summaryLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : summaryData.length > 0 ? (
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Monthly Units</th>
                    <th>Competitor Units (Monthly)</th>
                    <th>Market Share</th>
                    <th>Competitor Share</th>
                    <th>Yearly Units</th>
                    <th>Competitor Units (Yearly)</th>
                    <th>Yearly Market Share</th>
                    <th>Yearly Competitor Share</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((item, idx) => {
                    const secondaryLabel = item.district_name
                      ? `${item.city_name}, ${item.province_name}`
                      : item.city_name
                      ? item.province_name
                      : '';
                    return (
                      <tr key={idx}>
                        <td>
                          <strong>{locationLabel(item)}</strong>
                          {secondaryLabel && (
                            <div className="text-muted small">{secondaryLabel}</div>
                          )}
                        </td>
                        <td>{formatUnits(item.total_monthly_sales || 0)}</td>
                        <td>{formatUnits(item.total_monthly_competitor_sales || 0)}</td>
                        <td>{formatPercentage(item.avg_monthly_market_share || 0)}</td>
                        <td>{formatPercentage(item.avg_monthly_competitor_share || 0)}</td>
                        <td>{formatUnits(item.total_yearly_sales || 0)}</td>
                        <td>{formatUnits(item.total_yearly_competitor_sales || 0)}</td>
                        <td>{formatPercentage(item.avg_yearly_market_share || 0)}</td>
                        <td>{formatPercentage(item.avg_yearly_competitor_share || 0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-muted mb-0">No summary data available for the selected filters.</p>
            )}
          </div>
        </div>
      </div>

      {/* Record Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filter Market Share Records</h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-lg-1">
              <label className="form-label">Year</label>
              <select
                className="form-select"
                value={filters.year}
                onChange={(e) => handleListFilterChange('year', e.target.value)}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label">Month</label>
              <select
                className="form-select"
                value={filters.month}
                onChange={(e) => handleListFilterChange('month', e.target.value)}
              >
                <option value="">All Months</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>)}
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <label className="form-label">Province</label>
              <select
                className="form-select"
                value={filters.province_id}
                onChange={(e) => handleListFilterChange('province_id', e.target.value)}
              >
                <option value="">All Provinces</option>
                {provinces.map((prov) => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <label className="form-label">City / Regency</label>
              <select
                className="form-select"
                value={filters.city_id}
                onChange={(e) => handleListFilterChange('city_id', e.target.value)}
                disabled={!filters.province_id}
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-2">
              <label className="form-label">District</label>
              <select
                className="form-select"
                value={filters.district_id}
                onChange={(e) => handleListFilterChange('district_id', e.target.value)}
                disabled={!filters.city_id}
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>{district.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-3">
              <label className="form-label d-none d-lg-block">&nbsp;</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-primary flex-fill"
                  onClick={applyListFilters}
                >
                  Apply Filters
                </button>
                <button
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() => {
                    setFilters({
                      search: '',
                      year: new Date().getFullYear(),
                      month: '',
                      province_id: '',
                      city_id: '',
                      district_id: ''
                    });
                    setCities([]);
                    setDistricts([]);
                    setPagination({ page: 1, limit: 10, total: 0 });
                    setFiltersVersion(prev => prev + 1);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
            <div className="col-12">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by location..."
                value={filters.search}
                onChange={(e) => handleListFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border"></div></div>
          ) : marketShares.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Location</th>
                    <th>Monthly Units</th>
                    <th>Market Share</th>
                    <th>Competitor Units</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marketShares.map(item => (
                    <tr key={item.id}>
                      <td>{getMonthName(item.month)} {item.year}</td>
                      <td>{item.district_name}, {item.city_name}</td>
                      <td>{formatUnits(item.monthly_sales)}</td>
                      <td>{item.monthly_sales_percentage.toFixed(1)}%</td>
                      <td>{formatUnits(item.monthly_competitor_sales)}</td>
                      <td>
                        <Link to={`/marketshare/${item.id}`} className="btn btn-sm btn-outline-info me-1 d-inline-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                          <i className="bi bi-eye"></i>
                        </Link>
                        {hasPermission('update_market_shares') && (
                          <Link to={`/marketshare/${item.id}/edit`} className="btn btn-sm btn-outline-warning me-1 d-inline-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                            <i className="bi bi-pencil"></i>
                          </Link>
                        )}
                        {hasPermission('delete_market_shares') && (
                          <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-outline-danger d-inline-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination.total > pagination.limit && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </button>
                      </li>

                      {[...Array(Math.ceil(pagination.total / pagination.limit))].map((_, index) => {
                        const pageNum = index + 1;
                        const totalPages = Math.ceil(pagination.total / pagination.limit);
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                        ) {
                          return (
                            <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        } else if (
                          pageNum === pagination.page - 2 ||
                          pageNum === pagination.page + 2
                        ) {
                          return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                        }
                        return null;
                      })}

                      <li className={`page-item ${pagination.page >= Math.ceil(pagination.total / pagination.limit) ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No market share data found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Market Share"
        message="Are you sure you want to delete this market share data?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default MarketShareList;
