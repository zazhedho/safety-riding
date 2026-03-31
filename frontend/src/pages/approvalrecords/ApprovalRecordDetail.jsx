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

const formatDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
};

const statusBadgeClass = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'complete') {
    return 'bg-success-subtle text-success';
  }
  if (normalized === 'in progress' || normalized === 'current') {
    return 'bg-warning-subtle text-warning';
  }
  if (normalized === 'decline' || normalized === 'declined' || normalized === 'rejected') {
    return 'bg-danger-subtle text-danger';
  }
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

  const flattenedRecipients = useMemo(() => {
    if (!record?.approvals?.length) return [];

    return record.approvals.flatMap((approval) => {
      const recipients = safeParseJson(approval.recipients_json, []);
      return recipients.map((recipient, index) => ({
        id: `${approval.id}-${index}`,
        revision_number: approval.revision_number,
        overall_status: approval.overall_status,
        requestor: approval.requestor,
        recipient: recipient.recipient || '-',
        status: recipient.status || '-',
        issue_date: recipient.issue_date || '-',
        response_date: recipient.response_date || '-',
        comment: recipient.comment || '-',
        settings: recipient.settings || '-',
      }));
    });
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
          {record.activity_name || 'Submitted Form'}
        </h4>
        <p className="mb-0">
          <i className="bi bi-person me-2"></i>
          {record.full_name || 'Unknown submitter'}
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
          <div className="card border-warning h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 pe-2">
                  <h6 className="text-muted mb-1 small">Latest Status</h6>
                  <div>
                    <span className={`badge ${statusBadgeClass(record.latest_status)}`}>
                      {record.latest_status || '-'}
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
                  <h6 className="text-muted mb-1 small">Participants</h6>
                  <h4 className="mb-0 text-success text-truncate">{record.participant_count || 0}</h4>
                </div>
                <div className="text-success flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-people-fill"></i>
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
                  <h6 className="text-muted mb-1 small">Approvals</h6>
                  <h4 className="mb-0 text-info text-truncate">{record.approvals?.length || 0}</h4>
                </div>
                <div className="text-info flex-shrink-0" style={{ fontSize: '2rem' }}>
                  <i className="bi bi-check2-square"></i>
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
                className={`nav-link ${activeTab === 'approvals' ? 'active' : ''}`}
                onClick={() => setActiveTab('approvals')}
              >
                Approval History
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
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'details' && (
            <div className="row">
              <div className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-person-lines-fill me-2"></i>Submitter Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '40%' }}>
                            <strong>Full Name</strong>
                          </td>
                          <td>{record.full_name || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Email</strong>
                          </td>
                          <td className="text-break">{record.email || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Whatsapp</strong>
                          </td>
                          <td>{record.whatsapp || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Address</strong>
                          </td>
                          <td className="text-break">{record.full_address || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
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
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 mb-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-journal-text me-2"></i>Training Request Information
                    </h5>
                  </div>
                  <div className="card-body">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '40%' }}>
                            <strong>Activity</strong>
                          </td>
                          <td>{record.activity_name || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Participants</strong>
                          </td>
                          <td>{record.participant_count || 0}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Event Date</strong>
                          </td>
                          <td>{formatDate(record.event_date)}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Event Time</strong>
                          </td>
                          <td>{record.event_time || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Material</strong>
                          </td>
                          <td className="text-break">{record.material || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Training Type</strong>
                          </td>
                          <td>{record.training_type || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Duration</strong>
                          </td>
                          <td>{record.training_duration || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Area Type</strong>
                          </td>
                          <td>{record.area_type || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Event Location</strong>
                          </td>
                          <td className="text-break">{record.event_location_address || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Sheet Status</strong>
                          </td>
                          <td>
                            <span className={`badge ${statusBadgeClass(record.sheet_status)}`}>
                              {record.sheet_status || '-'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-list-check me-2"></i>Approval History
                </h5>
              </div>
              <div className="card-body">
                {!record.approvals?.length ? (
                  <div className="text-muted">No approval history available.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Revision</th>
                          <th>Status</th>
                          <th>Requestor</th>
                          <th>Submitted At</th>
                          <th>Recipients</th>
                          <th>Response ID</th>
                          <th>Edit Response</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.approvals.map((approval) => (
                          <tr key={approval.id}>
                            <td>{approval.revision_number || 0}</td>
                            <td>
                              <span className={`badge ${statusBadgeClass(approval.overall_status)}`}>
                                {approval.overall_status || '-'}
                              </span>
                            </td>
                            <td className="text-break">{approval.requestor || '-'}</td>
                            <td>{formatDateTime(approval.submitted_at)}</td>
                            <td>{approval.total_recipients || 0}</td>
                            <td className="text-break">{approval.response_id || '-'}</td>
                            <td>
                              {approval.edit_response_url ? (
                                <a href={approval.edit_response_url} target="_blank" rel="noreferrer">
                                  Open Link
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recipients' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>Recipients
                </h5>
              </div>
              <div className="card-body">
                {flattenedRecipients.length === 0 ? (
                  <div className="text-muted">No recipient data available.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Revision</th>
                          <th>Approval Status</th>
                          <th>Recipient</th>
                          <th>Status</th>
                          <th>Issue Date</th>
                          <th>Response Date</th>
                          <th>Comment</th>
                          <th>Settings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flattenedRecipients.map((recipient) => (
                          <tr key={recipient.id}>
                            <td>{recipient.revision_number || 0}</td>
                            <td>
                              <span className={`badge ${statusBadgeClass(recipient.overall_status)}`}>
                                {recipient.overall_status || '-'}
                              </span>
                            </td>
                            <td className="text-break">{recipient.recipient}</td>
                            <td>{recipient.status}</td>
                            <td>{recipient.issue_date}</td>
                            <td>{recipient.response_date}</td>
                            <td className="text-break">{recipient.comment}</td>
                            <td className="text-break">{recipient.settings}</td>
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
    </>
  );
};

export default ApprovalRecordDetail;
