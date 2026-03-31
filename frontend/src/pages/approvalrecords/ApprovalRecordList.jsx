import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import approvalRecordService from '../../services/approvalRecordService';
import { useAuth } from '../../contexts/AuthContext';

const statusBadgeClass = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'approve' || normalized === 'approved' || normalized === 'complete' || normalized === 'success') {
    return 'bg-success text-white';
  }
  if (normalized === 'in progress' || normalized === 'current') return 'bg-warning text-dark';
  if (normalized === 'decline' || normalized === 'declined' || normalized === 'rejected') {
    return 'bg-danger text-white';
  }
  return 'bg-secondary text-white';
};

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const ApprovalRecordList = () => {
  const { hasPermission } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    latest_status: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sorting, setSorting] = useState({
    order_by: 'submitted_at',
    order_direction: 'desc',
  });

  const canSync = hasPermission('approval_records', 'sync');
  const canViewConfigs = hasPermission('configs', 'view');

  const fetchConfig = async () => {
    try {
      const response = await approvalRecordService.getConfig();
      const source = response.data.data;
      setConfig(source);
    } catch (error) {
      toast.error('Failed to load approval records configuration');
    }
  };

  const fetchRecords = async (page = pagination.page, nextFilters = filters, nextSorting = sorting) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        order_by: nextSorting.order_by,
        order_direction: nextSorting.order_direction,
      };

      if (nextFilters.search) params.search = nextFilters.search;
      if (nextFilters.latest_status) params['filters[latest_status]'] = nextFilters.latest_status;

      const response = await approvalRecordService.getAll(params);
      const totalData = response.data.total_data || 0;
      const totalPages = response.data.total_pages || 0;

      if (totalPages > 0 && page > totalPages) {
        await fetchRecords(totalPages, nextFilters, nextSorting);
        return;
      }

      setRecords(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        page,
        total: totalData,
        totalPages,
      }));
    } catch (error) {
      toast.error('Failed to load approval records');
    } finally {
      setLoading(false);
    }
  };

  const syncRecords = async (force = false, silent = false) => {
    if (!canSync) return;

    try {
      setSyncing(true);
      const response = await approvalRecordService.sync(force);
      const result = response.data.data;

      if (result?.source) {
        setConfig(result.source);
      }

      if (!silent) {
        if (result?.skipped) {
          toast.info(result.message || 'Sync skipped');
        } else {
          toast.success(
            result?.message ||
              `Sync completed. Inserted ${result?.inserted_rows || 0}, updated ${result?.updated_rows || 0}`
          );
        }
      }
    } catch (error) {
      if (!silent) {
        toast.error(error.response?.data?.error || 'Failed to sync approval records');
      }
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const initializePage = async () => {
    setLoading(true);
    try {
      await fetchConfig();
      if (canSync) {
        await syncRecords(false, true);
      }
      await fetchRecords(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializePage();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchRecords(1, filters);
  };

  const handleManualSync = async () => {
    await syncRecords(true, false);
    await fetchRecords(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchRecords(page);
  };

  const handleSort = (column) => {
    const nextSorting = {
      order_by: column,
      order_direction:
        sorting.order_by === column && sorting.order_direction === 'asc' ? 'desc' : 'asc',
    };

    setSorting(nextSorting);
    fetchRecords(1, filters, nextSorting);
  };

  const getSortIcon = (column) => {
    if (sorting.order_by !== column) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }

    return sorting.order_direction === 'asc'
      ? <i className="bi bi-arrow-up ms-1"></i>
      : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const handleCopySheetUrl = async () => {
    if (!config?.sheet_url) return;

    try {
      await navigator.clipboard.writeText(config.sheet_url);
      setCopied(true);
      toast.success('Sheet URL copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy sheet URL');
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="mb-1">Approval Records</h2>
          <p className="text-muted mb-0">
            Submitted forms with the latest approval status from Google Sheets.
          </p>
        </div>
        {canSync && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleManualSync}
            disabled={syncing}
          >
            <i className={`bi ${syncing ? 'bi-arrow-repeat' : 'bi-cloud-download'} me-2`}></i>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-light text-primary flex-shrink-0"
                  style={{ width: '42px', height: '42px' }}
                >
                  <i className="bi bi-arrow-repeat"></i>
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.04em' }}>
                    Sync Status
                  </div>
                  <div className="fw-semibold lh-sm">{formatDateTime(config?.last_synced_at)}</div>
                  <div
                    className="small text-muted mt-1"
                    title={config?.last_sync_message || ''}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {config?.last_sync_message || 'No sync activity yet'}
                  </div>
                </div>
                <span className={`badge ${statusBadgeClass(config?.last_sync_status)}`}>
                  {config?.last_sync_status || 'unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle bg-light text-success flex-shrink-0"
                  style={{ width: '42px', height: '42px' }}
                >
                  <i className="bi bi-link-45deg"></i>
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="small text-muted text-uppercase mb-1" style={{ letterSpacing: '0.04em' }}>
                    Google Sheets Source
                  </div>
                  <div
                    className="small mb-0"
                    title={config?.sheet_url || ''}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {config?.sheet_url || '-'}
                  </div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0 align-self-start">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleCopySheetUrl}
                    disabled={!config?.sheet_url}
                    title={copied ? 'Copied' : 'Copy sheet URL'}
                    aria-label={copied ? 'Copied' : 'Copy sheet URL'}
                  >
                    <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`}></i>
                  </button>
                  {canViewConfigs && (
                    <Link
                      to="/configs"
                      className="btn btn-sm btn-outline-primary"
                      title="Open configurations"
                      aria-label="Open configurations"
                    >
                      <i className="bi bi-sliders"></i>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-5">
              <input
                type="text"
                name="search"
                className="form-control"
                placeholder="Request number, full name, email, phone, activity"
                aria-label="Search submitted forms"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters();
                }}
              />
            </div>
            <div className="col-12 col-md-4">
              <select
                name="latest_status"
                className="form-select"
                aria-label="Filter by latest status"
                value={filters.latest_status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="In progress">In progress</option>
                <option value="Decline">Decline</option>
              </select>
            </div>
            <div className="col-12 col-md-3">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary flex-fill"
                  onClick={handleApplyFilters}
                  aria-label="Apply filters"
                >
                  <i className="bi bi-search me-2" aria-hidden="true"></i>
                  Search
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    const nextFilters = { search: '', latest_status: '' };
                    setFilters(nextFilters);
                    fetchRecords(1, nextFilters);
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
            <h5 className="card-title mb-0">Submitted Forms</h5>
            <small className="text-muted">Total: {pagination.total}</small>
          </div>

          {loading && records.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">No submitted forms found.</div>
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
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('submitted_at')}>
                      Submitted At {getSortIcon('submitted_at')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('full_name')}>
                      Full Name {getSortIcon('full_name')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('activity_name')}>
                      Activity {getSortIcon('activity_name')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('participant_count')}>
                      Participants {getSortIcon('participant_count')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('latest_status')}>
                      Latest Status {getSortIcon('latest_status')}
                    </th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>{formatDateTime(record.submitted_at)}</td>
                      <td style={{ maxWidth: '220px' }}>
                        <div
                          className="text-truncate"
                          title={record.full_name || ''}
                        >
                          {record.full_name || '-'}
                        </div>
                      </td>
                      <td style={{ maxWidth: '260px' }}>
                        <div
                          className="text-truncate"
                          title={record.activity_name || ''}
                        >
                          {record.activity_name || '-'}
                        </div>
                      </td>
                      <td>{record.participant_count || 0}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass(record.latest_status)}`}>
                          {record.latest_status || '-'}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/approval-records/${record.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          Detail
                        </Link>
                      </td>
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
                onClick={() => handlePageChange(pagination.page - 1)}
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
                onClick={() => handlePageChange(pagination.page + 1)}
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

export default ApprovalRecordList;
