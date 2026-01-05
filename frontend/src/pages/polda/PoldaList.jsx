import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import poldaService from '../../services/poldaService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PoldaList = () => {
  const { hasPermission } = useAuth();
  const [poldaData, setPoldaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filters, setFilters] = useState({
    police_unit: '',
    period: '',
    search: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    police_unit: '',
    period: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchPoldaData();
  }, [pagination.page, appliedFilters]);

  const fetchPoldaData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: appliedFilters.search,
        filters: JSON.stringify({
          police_unit: appliedFilters.police_unit,
          period: appliedFilters.period
        })
      };

      const response = await poldaService.getAll(params);
      setPoldaData(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || Math.ceil((response.data.total_data || 0) / prev.limit)
      }));
    } catch (error) {
      console.error('Error fetching POLDA data:', error);
      toast.error('Failed to fetch POLDA data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    const resetFilters = {
      police_unit: '',
      period: '',
      search: ''
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    try {
      await poldaService.delete(itemToDelete.id);
      toast.success('POLDA data deleted successfully');
      fetchPoldaData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting POLDA data:', error);
      toast.error('Failed to delete POLDA data');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <i className="bi bi-clipboard-data me-2"></i>
                Data Laka NTB by POLDA
              </h5>
              {hasPermission('create_polda_accidents') && (
                <Link to="/polda-accidents/create" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-1"></i>
                  Add New Data
                </Link>
              )}
            </div>

            <div className="card-body">
              {/* Filters */}
              <div className="row mb-3">
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Police Unit"
                    name="police_unit"
                    value={filters.police_unit}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Period (e.g., 2024-01)"
                    name="period"
                    value={filters.period}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-primary me-2" onClick={applyFilters}>
                    <i className="bi bi-search me-1"></i>Filter
                  </button>
                  <button className="btn btn-outline-secondary" onClick={resetFilters}>
                    <i className="bi bi-arrow-clockwise me-1"></i>Reset
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Police Unit</th>
                      <th>Period</th>
                      <th className="text-center">Total Accidents</th>
                      <th className="text-center">Deaths</th>
                      <th className="text-center">Severe Injury</th>
                      <th className="text-center">Minor Injury</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poldaData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <i className="bi bi-inbox display-4 text-muted d-block mb-2"></i>
                          No POLDA data found
                        </td>
                      </tr>
                    ) : (
                      poldaData.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.police_unit}</strong>
                          </td>
                          <td>
                            <span className="badge bg-info">{item.period}</span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary">{item.total_accidents}</span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${item.total_deaths > 0 ? 'bg-danger' : 'bg-secondary'}`}>
                              {item.total_deaths}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${item.total_severe_injury > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                              {item.total_severe_injury}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${item.total_minor_injury > 0 ? 'bg-success' : 'bg-secondary'}`}>
                              {item.total_minor_injury}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group" role="group">
                              {hasPermission('view_polda_accidents') && (
                                <Link
                                  to={`/polda-accidents/${item.id}`}
                                  className="btn btn-sm btn-outline-info"
                                  title="View Details"
                                >
                                  <i className="bi bi-eye"></i>
                                </Link>
                              )}
                              {hasPermission('update_polda_accidents') && (
                                <Link
                                  to={`/polda-accidents/${item.id}/edit`}
                                  className="btn btn-sm btn-outline-warning"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </Link>
                              )}
                              {hasPermission('delete_polda_accidents') && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  title="Delete"
                                  onClick={() => {
                                    setItemToDelete(item);
                                    setShowDeleteModal(true);
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <nav aria-label="Page navigation">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(pagination.totalPages)].map((_, index) => (
                      <li key={index + 1} className={`page-item ${pagination.page === index + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
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
              )}

              {/* Summary */}
              {pagination.total > 0 && (
                <div className="row mt-3">
                  <div className="col-12">
                    <small className="text-muted">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete POLDA Data"
        message={`Are you sure you want to delete data for ${itemToDelete?.police_unit} - ${itemToDelete?.period}?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PoldaList;
