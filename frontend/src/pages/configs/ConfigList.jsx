import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import appConfigService from '../../services/appConfigService';
import { useAuth } from '../../contexts/AuthContext';

const statusBadgeClass = (isActive) => (isActive ? 'bg-success' : 'bg-danger');

const ConfigList = () => {
  const { hasPermission } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [editingConfig, setEditingConfig] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [configToToggle, setConfigToToggle] = useState(null);
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
      const totalData = response.data.total_data || 0;
      const totalPages = response.data.total_pages || 0;
      const items = response.data.data || [];

      if (totalPages > 0 && page > totalPages) {
        await fetchConfigs(totalPages, nextFilters);
        return;
      }

      setConfigs(items);
      setPagination((prev) => ({
        ...prev,
        page,
        total: totalData,
        totalPages,
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

  const handleOpenEditModal = (config) => {
    setEditingConfig(config);
    setEditValue(config.value || '');
  };

  const handleCloseEditModal = () => {
    if (savingId) return;
    setEditingConfig(null);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    try {
      setSavingId(editingConfig.id);
      const response = await appConfigService.update(editingConfig.id, {
        value: editValue,
        is_active: editingConfig.is_active,
      });
      const updated = response.data.data;
      setConfigs((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setEditingConfig(null);
      setEditValue('');
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
        value: config.value,
        is_active: !config.is_active,
      });
      const updated = response.data.data;
      setConfigs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (editingConfig?.id === updated.id) {
        setEditingConfig(updated);
      }
      setShowToggleModal(false);
      setConfigToToggle(null);
      toast.success(`Configuration ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update configuration');
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleClick = (config) => {
    setConfigToToggle(config);
    setShowToggleModal(true);
  };

  const handleToggleCancel = () => {
    if (savingId) return;
    setShowToggleModal(false);
    setConfigToToggle(null);
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
            <div className="col-12 col-md-5">
              <input
                type="text"
                className="form-control"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchConfigs(1, filters);
                }}
                placeholder="Search config key, display name, category"
                aria-label="Search configurations"
              />
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary flex-fill text-nowrap"
                  onClick={() => fetchConfigs(1, filters)}
                  aria-label="Apply filters"
                >
                  <i className="bi bi-search me-2" aria-hidden="true"></i>
                  Search
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    const nextFilters = { search: '', category: '' };
                    setFilters(nextFilters);
                    fetchConfigs(1, nextFilters);
                  }}
                  title="Clear all filters"
                  aria-label="Clear all filters"
                >
                  <i className="bi bi-x-circle" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Configuration Items</h5>
            <small className="text-muted">Total: {pagination.total}</small>
          </div>

          {loading && configs.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-5 text-muted">No configurations found.</div>
          ) : (
            <div className="table-responsive position-relative">
              {loading && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50"
                  style={{ zIndex: 1 }}
                >
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
              )}
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
                      <td style={{ maxWidth: '220px' }}>
                        <div className="text-truncate" title={config.display_name || ''}>
                          {config.display_name || '-'}
                        </div>
                      </td>
                      <td style={{ maxWidth: '260px' }}>
                        <code
                          className="d-inline-block text-truncate"
                          title={config.config_key || ''}
                          style={{ maxWidth: '100%' }}
                        >
                          {config.config_key}
                        </code>
                      </td>
                      <td style={{ maxWidth: '160px' }}>
                        <div className="text-truncate" title={config.category || ''}>
                          {config.category || '-'}
                        </div>
                      </td>
                      <td style={{ minWidth: '320px' }}>
                        <div
                          className="text-truncate"
                          title={config.value || ''}
                          style={{ maxWidth: '320px' }}
                        >
                          {config.value || '-'}
                        </div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div className="text-truncate" title={config.description || ''}>
                          {config.description || '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(config.is_active)}`}>
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
                              onClick={() => handleOpenEditModal(config)}
                              title="Edit configuration"
                              aria-label="Edit configuration"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              disabled={savingId === config.id}
                              onClick={() => handleToggleClick(config)}
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

      {editingConfig && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title mb-1">Edit Configuration</h5>
                    <div className="text-muted small">{editingConfig.display_name || editingConfig.config_key}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={handleCloseEditModal}
                    disabled={!!savingId}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Key</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingConfig.config_key || ''}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingConfig.category || '-'}
                      disabled
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label">Value</label>
                    <textarea
                      className="form-control"
                      rows="6"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Enter configuration value"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCloseEditModal}
                    disabled={!!savingId}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={savingId === editingConfig.id}
                  >
                    {savingId === editingConfig.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <ConfirmationModal
        show={showToggleModal}
        title={configToToggle?.is_active ? 'Disable Configuration' : 'Enable Configuration'}
        message={
          configToToggle
            ? `Are you sure you want to ${configToToggle.is_active ? 'disable' : 'enable'} configuration "${configToToggle.display_name}"?`
            : ''
        }
        confirmText={configToToggle?.is_active ? 'Disable' : 'Enable'}
        onConfirm={() => configToToggle && handleToggleActive(configToToggle)}
        onCancel={handleToggleCancel}
      />
    </div>
  );
};

export default ConfigList;
