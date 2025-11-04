import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import menuService from '../../services/menuService';
import { toast } from 'react-toastify';

const MenuList = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });

  useEffect(() => {
    fetchMenus();
  }, [pagination.page, pagination.limit]);

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const response = await menuService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        order_by: 'order_index',
        order_direction: 'asc',
      });
      setMenus(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
      }));
    } catch (error) {
      toast.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (menu) => {
    setMenuToDelete(menu);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!menuToDelete) return;

    try {
      await menuService.delete(menuToDelete.id);
      toast.success('Menu deleted successfully');
      fetchMenus();
      setShowDeleteModal(false);
      setMenuToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete menu');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setMenuToDelete(null);
  };

  const handleToggleActive = async (menu) => {
    try {
      await menuService.update(menu.id, {
        is_active: !menu.is_active,
      });
      toast.success(`Menu ${menu.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchMenus();
    } catch (error) {
      toast.error('Failed to update menu status');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Menu Management</h2>
        <Link to="/menus/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Add New Menu
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
          ) : menus.length > 0 ? (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Order</th>
                      <th style={{ width: '80px' }}>Icon</th>
                      <th>Name</th>
                      <th>Display Name</th>
                      <th>Path</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menus.map(menu => (
                      <tr key={menu.id}>
                        <td className="text-center">
                          <span className="badge bg-secondary">{menu.order_index}</span>
                        </td>
                        <td className="text-center">
                          {menu.icon && (
                            <i
                              className={`bi ${menu.icon}`}
                              style={{ fontSize: '1.5rem', color: '#6a9ae0' }}
                              title={menu.icon}
                            ></i>
                          )}
                        </td>
                        <td>
                          <code>{menu.name}</code>
                        </td>
                        <td>
                          <strong>{menu.display_name}</strong>
                        </td>
                        <td>
                          <span className="text-muted">{menu.path}</span>
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={menu.is_active}
                              onChange={() => handleToggleActive(menu)}
                              title={menu.is_active ? 'Click to deactivate' : 'Click to activate'}
                            />
                            <label className="form-check-label">
                              {menu.is_active ? (
                                <span className="badge bg-success">Active</span>
                              ) : (
                                <span className="badge bg-secondary">Inactive</span>
                              )}
                            </label>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Link
                              to={`/menus/${menu.id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClick(menu)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
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
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} menus
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
              <p className="mt-2">No menus found</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Menu"
        message={`Are you sure you want to delete menu "${menuToDelete?.display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </DashboardLayout>
  );
};

export default MenuList;
