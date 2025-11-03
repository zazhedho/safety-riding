import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import budgetService from '../../services/budgetService';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const BudgetList = () => {
  const { hasPermission } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    event_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchEvents();
    fetchBudgets();
    fetchSummary();
  }, []);

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
      const params = {};
      if (filters.event_id) params['filters[event_id]'] = filters.event_id;
      if (filters.month) params['filters[month]'] = filters.month;
      if (filters.year) params['filters[year]'] = filters.year;

      const response = await budgetService.getAll(params);
      setBudgets(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await budgetService.getMonthlySummary(filters.month, filters.year);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchBudgets();
    fetchSummary();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetService.delete(id);
      toast.success('Budget deleted successfully');
      fetchBudgets();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Budget Management</h2>
        {hasPermission('create_budgets') && (
          <Link to="/budgets/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Budget
          </Link>
        )}
      </div>

      {summary && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="stats-card">
              <h6 className="text-muted mb-1">Total Budget</h6>
              <div className="stats-number">{formatCurrency(summary.total_budget || 0)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card">
              <h6 className="text-muted mb-1">Total Spent</h6>
              <div className="stats-number">{formatCurrency(summary.total_spent || 0)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card">
              <h6 className="text-muted mb-1">Remaining</h6>
              <div className="stats-number">{formatCurrency(summary.remaining || 0)}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card">
              <h6 className="text-muted mb-1">Total Events</h6>
              <div className="stats-number">{summary.event_count || 0}</div>
            </div>
          </div>
        </div>
      )}

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
                  <option key={event.id} value={event.id}>{event.event_name}</option>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map(budget => {
                    const remaining = budget.budget_amount - budget.actual_spent;
                    const percentage = (budget.actual_spent / budget.budget_amount) * 100;

                    return (
                      <tr key={budget.id}>
                        <td>{budget.Event?.event_name || '-'}</td>
                        <td>{budget.budget_date}</td>
                        <td>{formatCurrency(budget.budget_amount)}</td>
                        <td>{formatCurrency(budget.actual_spent)}</td>
                        <td>
                          <span className={remaining < 0 ? 'text-danger' : 'text-success'}>
                            {formatCurrency(remaining)}
                          </span>
                        </td>
                        <td>
                          <div className="progress" style={{ width: '100px' }}>
                            <div
                              className={`progress-bar ${
                                percentage > 100 ? 'bg-danger' :
                                percentage > 80 ? 'bg-warning' :
                                'bg-success'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            >
                              {percentage.toFixed(0)}%
                            </div>
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
                            {hasPermission('update_budgets') && (
                              <Link
                                to={`/budgets/${budget.id}/edit`}
                                className="btn btn-sm btn-outline-warning"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                            )}
                            {hasPermission('delete_budgets') && (
                              <button
                                onClick={() => handleDelete(budget.id)}
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
          ) : (
            <div className="text-center py-5 text-muted">
              No budgets found
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BudgetList;
