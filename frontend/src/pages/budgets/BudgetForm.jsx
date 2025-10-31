import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import budgetService from '../../services/budgetService';
import eventService from '../../services/eventService';
import { toast } from 'react-toastify';

const BudgetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    event_id: '',
    category: '',
    description: '',
    budget_amount: 0,
    actual_spent: 0,
    budget_date: '',
    status: 'planned',
    notes: ''
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setFormData(response.data.data);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await budgetService.update(id, formData);
        toast.success('Budget updated successfully');
      } else {
        await budgetService.create(formData);
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

  return (
    <DashboardLayout>
      <h2>{id ? 'Edit Budget' : 'Add Budget'}</h2>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event</label>
                <select className="form-select" name="event_id" value={formData.event_id} onChange={handleChange} required>
                  <option value="">Select Event</option>
                  {events.map(event => <option key={event.id} value={event.id}>{event.event_name}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Category</label>
                <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} required />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Budget Amount</label>
                <input type="number" className="form-control" name="budget_amount" value={formData.budget_amount} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Actual Spent</label>
                <input type="number" className="form-control" name="actual_spent" value={formData.actual_spent} onChange={handleChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Budget Date</label>
                <input type="date" className="form-control" name="budget_date" value={formData.budget_date} onChange={handleChange} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={formData.status} onChange={handleChange} required>
                  <option value="planned">Planned</option>
                  <option value="approved">Approved</option>
                  <option value="spent">Spent</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea className="form-control" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary">{id ? 'Update' : 'Create'}</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/budgets')}>Cancel</button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BudgetForm;
