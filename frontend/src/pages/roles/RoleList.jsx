import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import roleService from '../../services/roleService';
import { toast } from 'react-toastify';

const RoleList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  useEffect(() => {
    fetchRoles();
  }, [pagination.page, pagination.limit]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await roleService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        order_by: 'name',
        order_direction: 'asc',
      });
      setRoles(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
      }));
    } catch (error) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (role) => {
    if (role.is_system) {
      toast.error('Cannot delete system roles');
      return;
    }
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await roleService.delete(roleToDelete.id);
      toast.success('Role deleted successfully');
      fetchRoles();
      setShowDeleteModal(false);
      setRoleToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Roles Management</h2>
        <Link to="/roles/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Add New Role
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : roles.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Display Name</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(role => (
                      <tr key={role.id}>
                        <td>
                          <strong>{role.name}</strong>
                        </td>
                        <td>{role.display_name}</td>
                        <td>{role.description || '-'}</td>
                        <td>
                          {role.is_system ? (
                            <span className="badge bg-info">System</span>
                          ) : (
                            <span className="badge bg-secondary">Custom</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Link
                              to={`/roles/${role.id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            {!role.is_system && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteClick(role)}
                                title="Delete"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} roles
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>Previous</button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => (
                        <li key={index + 1} className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => handlePageChange(index + 1)}>{index + 1}</button>
                        </li>
                      )).slice(Math.max(0, pagination.page - 3), Math.min(pagination.page + 2, totalPages))}
                      <li className={`page-item ${pagination.page >= totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>Next</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
              <p className="mt-2">No roles found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Role"
        message={`Are you sure you want to delete role "${roleToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default RoleList;
