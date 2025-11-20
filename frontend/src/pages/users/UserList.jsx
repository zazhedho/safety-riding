import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const UserList = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    search: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    role: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    order_by: 'updated_at',
    order_direction: 'desc'
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, appliedFilters, sorting]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        order_by: sorting.order_by,
        order_direction: sorting.order_direction
      };

      if (appliedFilters.role) params['filters[role]'] = appliedFilters.role;
      if (appliedFilters.search) params.search = appliedFilters.search;

      const response = await api.get('/users', { params });

      setUsers(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
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
      role: '',
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const variants = {
      superadmin: 'bg-dark',
      admin: 'bg-danger',
      staff: 'bg-primary',
      member: 'bg-success',
      viewer: 'bg-secondary'
    };
    return <span className={`badge ${variants[role] || 'bg-secondary'}`}>{role?.toUpperCase()}</span>;
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
    return (
      <>
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-lock fs-1 text-primary mb-3"></i>
            <h4>Access Denied</h4>
            <p className="text-muted">Only administrators can view this page.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Users Management</h2>
        <Link to="/users/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>Add User
        </Link>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or phone..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="col-md-4">
              <select
                className="form-select"
                name="role"
                value={filters.role}
                onChange={handleFilterChange}
              >
                <option value="">All Roles</option>
                {currentUser?.role === 'superadmin' && <option value="superadmin">Superadmin</option>}
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-fill" onClick={handleSearch}>
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
          ) : users.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                        Name {getSortIcon('name')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('email')}>
                        Email {getSortIcon('email')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('phone')}>
                        Phone {getSortIcon('phone')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('role')}>
                        Role {getSortIcon('role')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                        Created At {getSortIcon('created_at')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="avatar-circle bg-primary text-white me-3">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold">{user.name}</div>
                              {user.id === currentUser?.id && (
                                <small className="text-muted">(You)</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone || '-'}</td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>
                          <Link to={`/users/${user.id}/edit`} className="btn btn-sm btn-outline-warning">
                            <i className="bi bi-pencil"></i>
                          </Link>
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
              No users found
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserList;
