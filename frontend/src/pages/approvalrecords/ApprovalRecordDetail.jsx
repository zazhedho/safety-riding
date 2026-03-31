import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import approvalRecordService from '../../services/approvalRecordService';

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const statusBadgeClass = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'complete' || normalized === 'approved') return 'bg-success-subtle text-success';
  if (normalized === 'in progress' || normalized === 'current') return 'bg-warning-subtle text-warning';
  if (normalized === 'rejected') return 'bg-danger-subtle text-danger';
  return 'bg-secondary-subtle text-secondary';
};

const safeParseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const shouldHideDetailField = (key) => {
  if (!key) return true;
  return /^Recipient \d+( |$)/.test(key);
};

const ApprovalRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await approvalRecordService.getById(id);
        setRecord(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to load approval record detail');
        navigate('/approval-records');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate]);

  const recipients = useMemo(
    () => safeParseJson(record?.recipients_json, []),
    [record]
  );

  const detailFieldRows = useMemo(() => {
    const payload = safeParseJson(record?.raw_payload_json, {});

    return Object.entries(payload)
      .filter(([key, value]) => !shouldHideDetailField(key) && String(value || '').trim() !== '')
      .map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value),
      }));
  }, [record]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!record) {
    return <div className="alert alert-danger">Approval record not found.</div>;
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2>Approval Record Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/approval-records">Approval Records</Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <Link to="/approval-records" className="btn btn-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back
        </Link>
      </div>

      <div className="alert alert-primary mb-4">
        <h4 className="alert-heading mb-1">
          <i className="bi bi-clipboard-data me-2"></i>
          Request #{record.request_number || '-'} Revision {record.revision_number || 0}
        </h4>
        <p className="mb-0">
          <i className="bi bi-person me-2"></i>
          {record.requestor || 'Unknown requestor'}
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Request #</h6>
                  <h4 className="mb-0 text-primary text-truncate">{record.request_number || '-'}</h4>
                </div>
                <div className="text-primary flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-hash"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-info h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Revision</h6>
                  <h4 className="mb-0 text-info text-truncate">{record.revision_number || 0}</h4>
                </div>
                <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-arrow-repeat"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-warning h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Status</h6>
                  <div>
                    <span className={`badge ${statusBadgeClass(record.overall_status)}`}>
                      {record.overall_status || '-'}
                    </span>
                  </div>
                </div>
                <div className="text-warning flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-flag-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card border-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Recipients</h6>
                  <h4 className="mb-0 text-success text-truncate">{record.total_recipients || 0}</h4>
                </div>
                <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-people-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'recipients' ? 'active' : ''}`}
                onClick={() => setActiveTab('recipients')}
              >
                Recipients
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'form' ? 'active' : ''}`}
                onClick={() => setActiveTab('form')}
              >
                Form Details
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          <div className="tab-content">
            {activeTab === 'details' && (
              <div className="row">
                <div className="col-lg-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-info-circle me-2"></i>Request Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{ width: '40%' }}>
                              <strong>Requestor</strong>
                            </td>
                            <td>{record.requestor || '-'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Response ID</strong>
                            </td>
                            <td className="text-break">{record.response_id || '-'}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Status</strong>
                            </td>
                            <td>
                              <span className={`badge ${statusBadgeClass(record.overall_status)}`}>
                                {record.overall_status || '-'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Edit Response</strong>
                            </td>
                            <td>
                              {record.edit_response_url ? (
                                <a href={record.edit_response_url} target="_blank" rel="noreferrer">
                                  Open Link
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 mb-4">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>Sync Information
                      </h5>
                    </div>
                    <div className="card-body">
                      <table className="table table-borderless">
                        <tbody>
                          <tr>
                            <td className="text-muted" style={{ width: '40%' }}>
                              <strong>Submitted At</strong>
                            </td>
                            <td>{formatDateTime(record.submitted_at)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Synced At</strong>
                            </td>
                            <td>{formatDateTime(record.synced_at)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Created At</strong>
                            </td>
                            <td>{formatDateTime(record.created_at)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Updated At</strong>
                            </td>
                            <td>{formatDateTime(record.updated_at)}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">
                              <strong>Source Row Number</strong>
                            </td>
                            <td>{record.source_row_number || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recipients' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-people me-2"></i>Recipients Information
                  </h5>
                </div>
                <div className="card-body">
                  {recipients.length === 0 ? (
                    <div className="text-muted">No recipients data.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Recipient</th>
                            <th>Status</th>
                            <th>Issue Date</th>
                            <th>Response Date</th>
                            <th>Comment</th>
                            <th>Settings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipients.map((recipient, index) => (
                            <tr key={`${recipient.recipient || 'recipient'}-${index}`}>
                              <td className="text-break">{recipient.recipient || '-'}</td>
                              <td>{recipient.status || '-'}</td>
                              <td>{recipient.issue_date || '-'}</td>
                              <td>{recipient.response_date || '-'}</td>
                              <td className="text-break">{recipient.comment || '-'}</td>
                              <td className="text-break">{recipient.settings || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'form' && (
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <i className="bi bi-card-list me-2"></i>Form Details
                  </h5>
                </div>
                <div className="card-body">
                  {detailFieldRows.length === 0 ? (
                    <div className="text-muted">No form details available.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-borderless align-middle mb-0">
                        <tbody>
                          {detailFieldRows.map((row) => (
                            <tr key={row.key}>
                              <td className="text-muted" style={{ width: '35%' }}>
                                <strong>{row.key}</strong>
                              </td>
                              <td className="text-break">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalRecordDetail;
