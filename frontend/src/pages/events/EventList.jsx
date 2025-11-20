import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import eventService from '../../services/eventService';
import schoolService from '../../services/schoolService';
import publicService from '../../services/publicService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const EventList = () => {
  const { hasPermission, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [publics, setPublics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [filters, setFilters] = useState({
    entity_type: '',
    school_id: '',
    public_id: '',
    search: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    entity_type: '',
    school_id: '',
    public_id: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    order_by: 'event_date',
    order_direction: 'desc'
  });

  useEffect(() => {
    fetchSchools();
    fetchPublics();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, appliedFilters, sorting]);

  const fetchSchools = async () => {
    try {
      const response = await schoolService.getAll({ limit: 1000 });
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load schools');
    }
  };

  const fetchPublics = async () => {
    try {
      const response = await publicService.getAll({ limit: 1000 });
      setPublics(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load public entities');
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        order_by: sorting.order_by,
        order_direction: sorting.order_direction,
      };
      if (appliedFilters.school_id) params['filters[school_id]'] = appliedFilters.school_id;
      if (appliedFilters.public_id) params['filters[public_id]'] = appliedFilters.public_id;
      if (appliedFilters.search) params.search = appliedFilters.search;

      const response = await eventService.getAll(params);
      setEvents(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0
      }));
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // If changing entity_type, reset school_id and public_id
    if (name === 'entity_type') {
      setFilters(prev => ({ ...prev, entity_type: value, school_id: '', public_id: '' }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      entity_type: '',
      school_id: '',
      public_id: '',
      search: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSort = (column) => {
    setSorting(prev => ({
      order_by: column,
      order_direction: prev.order_by === column && prev.order_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (column) => {
    if (sorting.order_by !== column) {
      return <i className="bi bi-arrow-down-up ms-1 text-muted"></i>;
    }
    return sorting.order_direction === 'asc'
      ? <i className="bi bi-arrow-up ms-1"></i>
      : <i className="bi bi-arrow-down ms-1"></i>;
  };

  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      await eventService.delete(eventToDelete.id);
      toast.success('Event deleted successfully');
      fetchEvents();
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Events Management</h2>
        {hasPermission('create_events') && (
          <Link to="/events/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Add Event
          </Link>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by event and instructor name..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                name="entity_type"
                value={filters.entity_type}
                onChange={handleFilterChange}
              >
                <option value="">All Entity Types</option>
                <option value="school">School</option>
                <option value="public">Public</option>
              </select>
            </div>
            {filters.entity_type === 'school' && (
              <div className="col-md-3">
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
            )}
            {filters.entity_type === 'public' && (
              <div className="col-md-3">
                <select
                  className="form-select"
                  name="public_id"
                  value={filters.public_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All Public Entities</option>
                  {publics.map(pub => (
                    <option key={pub.id} value={pub.id}>{pub.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={filters.entity_type ? "col-md-3" : "col-md-6"}>
              <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={handleSearch}>
                  <i className="bi bi-search me-2"></i>Search
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClearFilters} title="Clear all filters">
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
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
            <>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                      Event Name {getSortIcon('title')}
                    </th>
                    <th>Entity</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('event_date')}>
                      Event Date {getSortIcon('event_date')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('attendees_count')}>
                      Participants {getSortIcon('attendees_count')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('instructor_name')}>
                      Instructor {getSortIcon('instructor_name')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>
                        {event.school ? (
                          <div>
                            <span className="badge bg-info me-2">School</span>
                            {event.school.name}
                          </div>
                        ) : event.public ? (
                          <div>
                            <span className="badge bg-secondary me-2">Public</span>
                            {event.public.name}
                          </div>
                        ) : '-'}
                      </td>
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
                      <td>
                        <div className="btn-group">
                          {hasPermission('view_events') && (
                            <Link
                              to={`/events/${event.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                          )}
                          {hasPermission('update_events') && (event.status !== 'completed' || user?.role === 'admin' || user?.role === 'superadmin') && (
                            <Link
                              to={`/events/${event.id}/edit`}
                              className="btn btn-sm btn-outline-warning"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                          {hasPermission('delete_events') && (
                            <button
                              onClick={() => handleDeleteClick(event)}
                              className="btn btn-sm btn-outline-danger"
                              disabled={event.status === 'completed' && user?.role !== 'admin' && user?.role !== 'superadmin'}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
              No events found
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Event"
        message={`Are you sure you want to delete the event "${eventToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default EventList;
