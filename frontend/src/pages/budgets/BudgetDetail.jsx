import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import budgetService from '../../services/budgetService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const BudgetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchBudgetDetail();
  }, [id]);

  const fetchBudgetDetail = async () => {
    setLoading(true);
    try {
      const response = await budgetService.getById(id);
      setBudget(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load budget details');
      navigate('/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await budgetService.delete(id);
      toast.success('Budget deleted successfully');
      setShowDeleteModal(false);
      navigate('/budgets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'planned': { class: 'bg-info', label: 'Planned' },
      'approved': { class: 'bg-success', label: 'Approved' },
      'in_progress': { class: 'bg-warning', label: 'In Progress' },
      'completed': { class: 'bg-primary', label: 'Completed' },
      'cancelled': { class: 'bg-danger', label: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || { class: 'bg-secondary', label: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!budget) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">Budget not found</div>
      </DashboardLayout>
    );
  }

  const budgetAmount = Number(budget.budget_amount) || 0;
  const actualSpent = Number(budget.actual_spent) || 0;
  const remaining = budgetAmount - actualSpent;
  const percentageRaw = budgetAmount > 0
    ? Number(((actualSpent / budgetAmount) * 100).toFixed(1))
    : 0;
  const percentage = Number.isFinite(percentageRaw) ? percentageRaw : 0;
  const hasUtilization = percentage > 0;
  const percentageDisplay = hasUtilization ? percentage.toFixed(1) : '0';
  const isOverBudget = remaining < 0;

  // Check if budget is finalized
  const finalStatuses = ['completed', 'cancelled'];
  const isFinalized = finalStatuses.includes(budget.status?.toLowerCase());
  const isAdmin = hasRole(['admin']);
  const isSuperadmin = hasRole(['superadmin']);
  const isAdminOrSuperadmin = isAdmin || isSuperadmin;

  return (
    <DashboardLayout>
      {/* Warning for finalized budgets */}
      {isFinalized && !isAdminOrSuperadmin && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Budget is Finalized!</strong> This budget has status "{budget.status}" and cannot be modified or deleted.
        </div>
      )}
      {isFinalized && isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Superadmin Access:</strong> This budget has status "{budget.status}" (finalized), but you can still modify it as a superadmin.
        </div>
      )}
      {isFinalized && isAdmin && !isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Admin Access:</strong> This budget has status "{budget.status}" (finalized), but you can still modify it as an admin.
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Budget Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/budgets">Budgets</Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          {hasPermission('update_budgets') && !(isFinalized && !isAdminOrSuperadmin) && (
            <Link to={`/budgets/${id}/edit`} className="btn btn-warning">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {hasPermission('delete_budgets') && !(isFinalized && !isAdminOrSuperadmin) && (
            <button onClick={handleDeleteClick} className="btn btn-danger">
              <i className="bi bi-trash me-2"></i>Delete
            </button>
          )}
          <Link to="/budgets" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-primary h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2 small">Budget Amount</h6>
              <h4 className="mb-0 text-primary">{formatCurrency(budgetAmount)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2 small">Actual Spent</h6>
              <h4 className="mb-0 text-warning">{formatCurrency(actualSpent)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className={`card ${isOverBudget ? 'border-danger' : 'border-success'} h-100`}>
            <div className="card-body">
              <h6 className="text-muted mb-2 small">Remaining</h6>
              <h4 className={`mb-0 ${isOverBudget ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(remaining)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-info h-100">
            <div className="card-body">
              <h6 className="text-muted mb-2 small">Utilization</h6>
              <h4 className="mb-0 text-info">{percentageDisplay}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Budget Utilization</h5>
        </div>
        <div className="card-body">
          <div className="progress position-relative" style={{ height: '30px' }}>
            <div
              className={`progress-bar ${
                percentage > 100 ? 'bg-danger' :
                percentage > 80 ? 'bg-warning' :
                'bg-success'
              } d-flex align-items-center justify-content-center`}
              role="progressbar"
              style={{ width: `${Math.min(percentage, 100)}%` }}
              aria-valuenow={percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {hasUtilization ? `${percentageDisplay}%` : ''}
            </div>
            {!hasUtilization && (
              <span
                className="position-absolute top-50 start-50 translate-middle fw-semibold text-dark"
                style={{ fontSize: '0.9rem' }}
              >
                {percentageDisplay}%
              </span>
            )}
          </div>
          {isOverBudget && (
            <div className="alert alert-danger mt-3 mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Over Budget!</strong> You have exceeded the budget by {formatCurrency(Math.abs(remaining))}.
            </div>
          )}
        </div>
      </div>

      <div className="row">
        {/* Budget Information */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>Budget Information
              </h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="text-muted" style={{ width: '40%' }}>
                      <strong>Category</strong>
                    </td>
                    <td>
                      <span className="badge bg-primary">{budget.category}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Status</strong>
                    </td>
                    <td>{getStatusBadge(budget.status)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Budget Date</strong>
                    </td>
                    <td>{budget.budget_date}</td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Period</strong>
                    </td>
                    <td>
                      {new Date(0, budget.budget_month - 1).toLocaleString('en-US', { month: 'long' })} {budget.budget_year}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted">
                      <strong>Description</strong>
                    </td>
                    <td>{budget.description || '-'}</td>
                  </tr>
                  {budget.notes && (
                    <tr>
                      <td className="text-muted">
                        <strong>Notes</strong>
                      </td>
                      <td>{budget.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Event Information */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-calendar-event me-2"></i>Related Event
              </h5>
            </div>
            <div className="card-body">
              {budget.event ? (
                <>
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <td className="text-muted" style={{ width: '40%' }}>
                          <strong>Event Title</strong>
                        </td>
                        <td>
                          <Link to={`/events/${budget.event.id}`} className="text-decoration-none">
                            {budget.event.title}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <strong>Event Date</strong>
                        </td>
                        <td>{budget.event.event_date}</td>
                      </tr>
                      <tr>
                        <td className="text-muted">
                          <strong>Event Type</strong>
                        </td>
                        <td>
                          <span className="badge bg-info">{budget.event.event_type.toUpperCase()}</span>
                        </td>
                      </tr>
                      {budget.event.school && (
                        <tr>
                          <td className="text-muted">
                            <strong>School</strong>
                          </td>
                          <td>
                            <Link to={`/schools/${budget.event.school.id}`} className="text-decoration-none">
                              <i className="bi bi-building me-1"></i>
                              {budget.event.school.name}
                            </Link>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="text-muted">
                          <strong>Location</strong>
                        </td>
                        <td>{budget.event.location || '-'}</td>
                      </tr>
                      {budget.event.description && (
                        <tr>
                          <td className="text-muted">
                            <strong>Description</strong>
                          </td>
                          <td>{budget.event.description}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="text-muted mb-0">No event information available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Information */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>Audit Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong className="text-muted">Created At:</strong>{' '}
                {new Date(budget.created_at).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Created By:</strong> {budget.created_by || '-'}
              </p>
            </div>
            <div className="col-md-6">
              <p className="mb-2">
                <strong className="text-muted">Updated At:</strong>{' '}
                {new Date(budget.updated_at).toLocaleString()}
              </p>
              <p className="mb-0">
                <strong className="text-muted">Updated By:</strong> {budget.updated_by || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default BudgetDetail;
