import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import budgetService from '../../services/budgetService';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [formData, setFormData] = useState({
    event_id: '',
    category: '',
    description: '',
    budget_amount: '',
    actual_spent: '',
    budget_date: '',
    status: 'planned',
    notes: ''
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    fetchEvents();
    if (id) {
      fetchBudget(id);
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchBudget = async (budgetId) => {
    try {
      const response = await budgetService.getById(budgetId);
      const budgetData = response.data.data;
      setFormData(budgetData);

      // Check if budget status is final (completed or cancelled)
      const finalStatuses = ['completed', 'cancelled'];
      setIsFinalized(finalStatuses.includes(budgetData.status?.toLowerCase()));
    } catch (error) {
      toast.error('Failed to fetch budget');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 1000 });
      setEvents(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load events');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle budget amount fields (budget_amount, actual_spent)
    const amountFields = ['budget_amount', 'actual_spent'];
    if (amountFields.includes(name)) {
      // Allow empty string or valid positive number only
      if (value === '' || (value >= 0 && !value.includes('-'))) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler to select all text on focus for number fields
  const handleNumberFocus = (e) => {
    e.target.select();
  };

  // Handler to prevent negative number input (block minus/dash key)
  const handleNumberKeyDown = (e) => {
    // Block minus/dash (-), plus (+), and 'e' keys for number inputs
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        budget_amount: formData.budget_amount === '' ? 0 : parseFloat(formData.budget_amount) || 0,
        actual_spent: formData.actual_spent === '' ? 0 : parseFloat(formData.actual_spent) || 0,
      };

      if (id) {
        await budgetService.update(id, dataToSend);
        toast.success('Budget updated successfully');
      } else {
        await budgetService.create(dataToSend);
        toast.success('Budget created successfully');
      }
      navigate('/budgets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save budget');
    }
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  const isAdmin = hasRole(['admin']);
  const isSuperadmin = hasRole(['superadmin']);
  const isAdminOrSuperadmin = isAdmin || isSuperadmin;
  const shouldDisable = isFinalized && !isAdminOrSuperadmin;

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Budget' : 'Add Budget'}</h2>

      {/* Warning for finalized budgets */}
      {isFinalized && !isAdminOrSuperadmin && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Budget is Finalized!</strong> This budget has status "{formData.status}" and cannot be modified.
          All fields are read-only.
        </div>
      )}
      {isFinalized && isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Superadmin Access:</strong> This budget has status "{formData.status}" (finalized), but you can still modify it as a superadmin.
        </div>
      )}
      {isFinalized && isAdmin && !isSuperadmin && (
        <div className="alert alert-info mb-4" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          <strong>Admin Access:</strong> This budget has status "{formData.status}" (finalized), but you can still modify it as an admin.
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event</label>
                <select className="form-select" name="event_id" value={formData.event_id} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="">Select Event</option>
                  {events.map(event => <option key={event.id} value={event.id}>{event.title} - {event.school?.name}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Category</label>
                <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Venue Rental" required disabled={shouldDisable} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., Budget for renting the main hall for the seminar" disabled={shouldDisable} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Budget Amount</label>
                <input type="number" min="0" step="any" className="form-control" name="budget_amount" value={formData.budget_amount} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 5000000" required disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Actual Spent</label>
                <input type="number" min="0" step="any" className="form-control" name="actual_spent" value={formData.actual_spent} onChange={handleChange} onFocus={handleNumberFocus} onKeyDown={handleNumberKeyDown} placeholder="e.g., 4500000" disabled={shouldDisable} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Budget Date</label>
                <input type="date" className="form-control" name="budget_date" value={formData.budget_date} onChange={handleChange} required disabled={shouldDisable} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange} required disabled={shouldDisable}>
                  <option value="planned">Planned</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g., Received a 10% discount from the venue provider." disabled={shouldDisable} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={shouldDisable}>{id ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/budgets')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BudgetForm;
