import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import poldaService from '../../services/poldaService';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);
const months = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
  { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
];

const PoldaList = () => {
  const { hasPermission } = useAuth();
  const [poldaData, setPoldaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filters, setFilters] = useState({
    period_year: '',
    period_month: '',
    search: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    period_year: '',
    period_month: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sorting, setSorting] = useState({
    order_by: 'period',
    order_direction: 'desc'
  });

  useEffect(() => {
    fetchPoldaData();
  }, [pagination.page, appliedFilters, sorting]);

  const fetchPoldaData = async () => {
    try {
      setLoading(true);
      const period = appliedFilters.period_year 
        ? (appliedFilters.period_month ? `${appliedFilters.period_year}-${appliedFilters.period_month}` : appliedFilters.period_year)
        : '';
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: appliedFilters.search,
        order_by: sorting.order_by,
        order_direction: sorting.order_direction,
        filters: JSON.stringify({
          period: period
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
      period_year: '',
      period_month: '',
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
              <div className="row mb-3 g-2 align-items-center">
                <div className="col-md-5">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search police unit..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    name="period_year"
                    value={filters.period_year}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Years</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    name="period_month"
                    value={filters.period_month}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Months</option>
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary" onClick={applyFilters}>
                      <i className="bi bi-search me-2"></i>Search
                    </button>
                    <button className="btn btn-outline-secondary" onClick={resetFilters} title="Clear all filters">
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('police_unit')}>
                        Police Unit {getSortIcon('police_unit')}
                      </th>
                      <th style={{ cursor: 'pointer' }} onClick={() => handleSort('period')}>
                        Period {getSortIcon('period')}
                      </th>
                      <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_accidents')}>
                        Total Accidents {getSortIcon('total_accidents')}
                      </th>
                      <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_deaths')}>
                        Deaths {getSortIcon('total_deaths')}
                      </th>
                      <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_severe_injury')}>
                        Severe Injury {getSortIcon('total_severe_injury')}
                      </th>
                      <th className="text-center" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_minor_injury')}>
                        Minor Injury {getSortIcon('total_minor_injury')}
                      </th>
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
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete POLDA Data"
        message={`Are you sure you want to delete data for ${itemToDelete?.police_unit} - ${itemToDelete?.period}?`}
        confirmText="Delete"
      />
    </div>
  );
};

export default PoldaList;
