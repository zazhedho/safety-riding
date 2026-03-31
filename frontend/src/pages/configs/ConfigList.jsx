import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import appConfigService from '../../services/appConfigService';
import { useAuth } from '../../contexts/AuthContext';

const ConfigList = () => {
  const { hasPermission } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const canUpdate = hasPermission('configs', 'update');

  const fetchConfigs = async (page = pagination.page, nextFilters = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
      };
      if (nextFilters.search) params.search = nextFilters.search;
      if (nextFilters.category) params['filters[category]'] = nextFilters.category;

      const response = await appConfigService.getAll(params);
      const items = (response.data.data || []).map((item) => ({
        ...item,
        draft_value: item.value || '',
      }));

      setConfigs(items);
      setPagination((prev) => ({
        ...prev,
        page,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0,
      }));
    } catch (error) {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs(1);
  }, []);

  const handleDraftChange = (id, value) => {
    setConfigs((prev) =>
      prev.map((config) => (config.id === id ? { ...config, draft_value: value } : config))
    );
  };

  const handleSave = async (config) => {
    try {
      setSavingId(config.id);
      const response = await appConfigService.update(config.id, {
        value: config.draft_value,
        is_active: config.is_active,
      });
      const updated = response.data.data;
      setConfigs((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...updated, draft_value: updated.value || '' } : item
        )
      );
      toast.success('Configuration updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update configuration');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleActive = async (config) => {
    try {
      setSavingId(config.id);
      const response = await appConfigService.update(config.id, {
        value: config.draft_value,
        is_active: !config.is_active,
      });
      const updated = response.data.data;
      setConfigs((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...updated, draft_value: updated.value || '' } : item
        )
      );
      toast.success(`Configuration ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update configuration');
    } finally {
      setSavingId(null);
    }
  };

  const categories = [...new Set(configs.map((config) => config.category).filter(Boolean))];

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Configurations</h2>
          <p className="text-muted mb-0">Generic application configuration stored in the database.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchConfigs(1, filters);
                }}
                placeholder="Search config key, display name, category"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-primary" onClick={() => fetchConfigs(1, filters)}>
              Apply Filters
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                const nextFilters = { search: '', category: '' };
                setFilters(nextFilters);
                fetchConfigs(1, nextFilters);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-5 text-muted">No configurations found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Key</th>
                    <th>Category</th>
                    <th>Value</th>
                    <th>Description</th>
                    <th>Status</th>
                    {canUpdate && <th className="text-end">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id}>
                      <td>{config.display_name}</td>
                      <td><code>{config.config_key}</code></td>
                      <td>{config.category}</td>
                      <td style={{ minWidth: '320px' }}>
                        {canUpdate ? (
                          <textarea
                            className="form-control"
                            rows="3"
                            value={config.draft_value}
                            onChange={(e) => handleDraftChange(config.id, e.target.value)}
                          />
                        ) : (
                          <div className="text-break">{config.value}</div>
                        )}
                      </td>
                      <td className="text-break">{config.description || '-'}</td>
                      <td>
                        <span className={`badge ${config.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canUpdate && (
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              disabled={savingId === config.id}
                              onClick={() => handleSave(config)}
                              title="Save configuration"
                              aria-label="Save configuration"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={savingId === config.id}
                              onClick={() => handleToggleActive(config)}
                              title={config.is_active ? 'Disable configuration' : 'Enable configuration'}
                              aria-label={config.is_active ? 'Disable configuration' : 'Enable configuration'}
                            >
                              <i className={`bi ${config.is_active ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchConfigs(pagination.page - 1, filters)}
              >
                Previous
              </button>
              <span className="text-muted">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchConfigs(pagination.page + 1, filters)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigList;
