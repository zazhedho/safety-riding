import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import budgetService from '../../services/budgetService';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const BudgetList = () => {
  const { hasPermission, hasRole } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [yearSummary, setYearSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [filters, setFilters] = useState({
    event_id: '',
    month: '',
    year: new Date().getFullYear()
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [summaryView, setSummaryView] = useState('yearly');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [pagination.page, filters]);

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 1000 });
      setEvents(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load events');
    }
  };

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (filters.event_id) params['filters[event_id]'] = filters.event_id;
      if (filters.month) params['filters[budget_month]'] = filters.month;
      if (filters.year) params['filters[budget_year]'] = filters.year;

      const response = await budgetService.getAll(params);
      setBudgets(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0
      }));
    } catch (error) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (filters.month) {
      try {
        const response = await budgetService.getMonthlySummary(filters.month, filters.year);
        setSummary(response.data.data);
      } catch (error) {
        setSummary(null);
        console.error('Failed to load monthly summary');
      }
    } else {
      setSummary(null);
    }

    try {
      const yearlyResponse = await budgetService.getYearlySummary(filters.year);
      const yearlyData = yearlyResponse.data.data;

      if (Array.isArray(yearlyData) && yearlyData.length > 0) {
        const aggregated = yearlyData.reduce((acc, item) => {
          const totalBudget = Number(item.total_budget) || 0;
          const totalSpent = Number(item.total_spent) || 0;
          const remaining = Number(item.remaining) || 0;
          const eventCount = Number(item.event_count) || 0;

          return {
            total_budget: acc.total_budget + totalBudget,
            total_spent: acc.total_spent + totalSpent,
            remaining: acc.remaining + remaining,
            event_count: acc.event_count + eventCount,
          };
        }, { total_budget: 0, total_spent: 0, remaining: 0, event_count: 0 });

        setYearSummary(aggregated);
      } else if (yearlyData && typeof yearlyData === 'object') {
        setYearSummary({
          total_budget: Number(yearlyData.total_budget) || 0,
          total_spent: Number(yearlyData.total_spent) || 0,
          remaining: Number(yearlyData.remaining) || 0,
          event_count: Number(yearlyData.event_count) || 0,
        });
      } else {
        setYearSummary({
          total_budget: 0,
          total_spent: 0,
          remaining: 0,
          event_count: 0,
        });
      }
    } catch (error) {
      setYearSummary(null);
      console.error('Failed to load yearly summary');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };

    setFilters(updatedFilters);
    setHasSearched(false);
    setPagination(prev => ({ ...prev, page: 1 }));

    if (name === 'month') {
      setSummary(null);
      if (value === '') {
        setSummaryView('yearly');
      }
      return;
    }

    if (name === 'year') {
      setSummary(null);
      setYearSummary(null);
      if (!updatedFilters.month) {
        setSummaryView('yearly');
      }
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    setSummaryView(filters.month ? 'monthly' : 'yearly');
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBudgets();
    fetchSummary();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteClick = (budget) => {
    setBudgetToDelete(budget);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;

    try {
      await budgetService.delete(budgetToDelete.id);
      toast.success('Budget deleted successfully');
      fetchBudgets();
      fetchSummary();
      setShowDeleteModal(false);
      setBudgetToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBudgetToDelete(null);
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

  const isFinalized = (status) => {
    const finalStatuses = ['completed', 'cancelled'];
    return finalStatuses.includes(status?.toLowerCase());
  };

  const renderSummaryCards = (data) => (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
      <div className="col">
        <div className="stats-card h-100">
          <h6 className="text-muted mb-1 small">Total Budget</h6>
          <div className="stats-number text-truncate" title={formatCurrency(data.total_budget || 0)}>
            {formatCurrency(data.total_budget || 0)}
          </div>
        </div>
      </div>
      <div className="col">
        <div className="stats-card h-100">
          <h6 className="text-muted mb-1 small">Total Spent</h6>
          <div className="stats-number text-truncate" title={formatCurrency(data.total_spent || 0)}>
            {formatCurrency(data.total_spent || 0)}
          </div>
        </div>
      </div>
      <div className="col">
        <div className="stats-card h-100">
          <h6 className="text-muted mb-1 small">Remaining</h6>
          <div className="stats-number text-truncate" title={formatCurrency(data.remaining || 0)}>
            {formatCurrency(data.remaining || 0)}
          </div>
        </div>
      </div>
      <div className="col">
        <div className="stats-card h-100">
          <h6 className="text-muted mb-1 small">Total Events</h6>
          <div className="stats-number">{data.event_count || 0}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Budget Management</h2>
        {hasPermission('create_budgets') && (
          <Link to="/budgets/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Budget
          </Link>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <div>
              <h5 className="mb-1">Budget Summary</h5>
              <small className="text-muted">
                {summaryView === 'monthly' && filters.month && filters.year
                  ? `${new Date(0, Number(filters.month) - 1).toLocaleString('en-US', { month: 'long' })} ${filters.year}`
                  : summaryView === 'yearly' && filters.year
                  ? `Year ${filters.year}`
                  : 'Select filters to view summary'}
              </small>
            </div>
            <div className="btn-group">
              <button
                type="button"
                className={`btn btn-sm ${summaryView === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSummaryView('monthly')}
                disabled={!filters.month}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`btn btn-sm ${summaryView === 'yearly' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setSummaryView('yearly')}
                disabled={!yearSummary}
              >
                Yearly
              </button>
            </div>
          </div>

          {summaryView === 'monthly'
            ? summary
              ? renderSummaryCards(summary)
              : (
                <div className="alert alert-light border mb-0" role="alert">
                  {filters.month
                    ? hasSearched
                      ? 'No monthly data available. Adjust your filters and search again.'
                      : 'Press Search to load the monthly summary.'
                    : 'Select a month and press Search to view the monthly summary.'}
                </div>
              )
            : yearSummary
              ? renderSummaryCards(yearSummary)
              : (
                <div className="alert alert-light border mb-0" role="alert">
                  {hasSearched
                    ? 'No yearly data available. Adjust your filters and search again.'
                    : 'Press Search to load the yearly summary.'}
                </div>
              )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <select
                className="form-select"
                name="event_id"
                value={filters.event_id}
                onChange={handleFilterChange}
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title} {event.school?.name ? `- ${event.school.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-primary w-100" onClick={handleSearch}>
                <i className="bi bi-search me-2"></i>Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : budgets.length > 0 ? (
            <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Budget Amount</th>
                    <th>Actual Spent</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Utilization</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(budget => {
                    const budgetAmount = Number(budget.budget_amount) || 0;
                    const actualSpent = Number(budget.actual_spent) || 0;
                    const remaining = budgetAmount - actualSpent;
                    const percentageRaw = budgetAmount > 0
                      ? Number(((actualSpent / budgetAmount) * 100).toFixed(1))
                      : 0;
                    const percentage = Number.isFinite(percentageRaw) ? percentageRaw : 0;
                    const hasUtilization = percentage > 0;
                    const percentageLabel = hasUtilization ? Math.round(percentage).toString() : '0';

                    return (
                      <tr key={budget.id}>
                        <td>
                          <div className="mb-1">
                            <strong>{budget.event?.title || '-'}</strong>
                          </div>
                          {budget.event?.school?.name && (
                            <small className="text-muted">
                              <i className="bi bi-building me-1"></i>
                              {budget.event.school.name}
                            </small>
                          )}
                        </td>
                        <td>{budget.budget_date}</td>
                        <td>{formatCurrency(budgetAmount)}</td>
                        <td>{formatCurrency(actualSpent)}</td>
                        <td>
                          <span className={remaining < 0 ? 'text-danger' : 'text-success'}>
                            {formatCurrency(remaining)}
                          </span>
                        </td>
                        <td>
                          {getStatusBadge(budget.status)}
                        </td>
                        <td>
                          <div className="progress position-relative" style={{ width: '100px', height: '24px' }}>
                            <div
                              className={`progress-bar ${
                                percentage > 100 ? 'bg-danger' :
                                percentage > 80 ? 'bg-warning' :
                                'bg-success'
                              } d-flex align-items-center justify-content-center`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            >
                              {hasUtilization ? `${percentageLabel}%` : ''}
                            </div>
                            {!hasUtilization && (
                              <span
                                className="position-absolute top-50 start-50 translate-middle fw-semibold text-dark"
                                style={{ fontSize: '0.75rem' }}
                              >
                                {percentageLabel}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="btn-group">
                            {hasPermission('view_budgets') && (
                              <Link
                                to={`/budgets/${budget.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                            )}
                            {hasPermission('update_budgets') && (!isFinalized(budget.status) || hasRole(['admin', 'superadmin'])) && (
                              <Link
                                to={`/budgets/${budget.id}/edit`}
                                className="btn btn-sm btn-outline-warning"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                            )}
                            {hasPermission('delete_budgets') && (!isFinalized(budget.status) || hasRole(['admin', 'superadmin'])) && (
                              <button
                                onClick={() => handleDeleteClick(budget)}
                                className="btn btn-sm btn-outline-danger"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
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

                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
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

                    <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-5 text-muted">
              No budgets found
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Budget"
        message={`Are you sure you want to delete this budget${budgetToDelete?.event?.title ? ` for "${budgetToDelete.event.title}"` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default BudgetList;
