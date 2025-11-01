import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import eventService from '../../services/eventService';
import schoolService from '../../services/schoolService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EventList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    school_id: '',
    search: ''
  });

  useEffect(() => {
    fetchSchools();
    fetchEvents();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await schoolService.getAll({ limit: 1000 });
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load schools');
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.school_id) params['filters[school_id]'] = filters.school_id;
      if (filters.search) params.search = filters.search;

      const response = await eventService.getAll(params);
      setEvents(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    fetchEvents();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventService.delete(id);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canPerformActions = user?.role === 'admin' || user?.role === 'staff';

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Events Management</h2>
        {canPerformActions && (
          <Link to="/events/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Event
          </Link>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by event and instructor name..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                name="school_id"
                value={filters.school_id}
                onChange={handleFilterChange}
              >
                <option value="">All Schools</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary" onClick={handleSearch}>
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
          ) : events.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>School</th>
                    <th>Event Date</th>
                    <th>Participants</th>
                    <th>Instructor</th>
                    <th>Status</th>
                    {canPerformActions && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>{event.school?.name || '-'}</td>
                      <td>{formatDate(event.event_date)}</td>
                      <td>{event.attendees_count || 0}</td>
                      <td>{event.instructor_name || '-'}</td>
                      <td>
                        <span className={`badge ${
                          event.status === 'completed' ? 'bg-success' :
                          event.status === 'ongoing' ? 'bg-primary' :
                          event.status === 'cancelled' ? 'bg-danger' :
                          'bg-warning'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                      </td>
                      {canPerformActions && (
                        <td>
                          <div className="btn-group">
                            <Link
                              to={`/events/${event.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                            <Link
                              to={`/events/${event.id}/edit`}
                              className="btn btn-sm btn-outline-warning"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="btn btn-sm btn-outline-danger"
                              disabled={event.status === 'completed'}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5 text-muted">
              No events found
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EventList;
