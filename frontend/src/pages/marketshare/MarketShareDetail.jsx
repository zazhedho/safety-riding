import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import marketShareService from '../../services/marketShareService';
import AuditInfoCard from '../../components/common/AuditInfoCard';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const MarketShareDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await marketShareService.getById(id);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load market share');
      navigate('/marketshare');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await marketShareService.delete(id);
      toast.success('Market share deleted successfully');
      navigate('/marketshare');
    } catch (error) {
      toast.error('Failed to delete market share');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) return <><div className="text-center py-5"><div className="spinner-border"></div></div></>;
  if (!data) return <><div className="alert alert-danger">Data not found</div></>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Market Share Detail</h2>
        <div className="d-flex gap-2">
          {hasPermission('update_market_shares') && (
            <Link to={`/marketshare/${id}/edit`} className="btn btn-warning">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
          {hasPermission('delete_market_shares') && (
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger">
              <i className="bi bi-trash me-2"></i>Delete
            </button>
          )}
          <Link to="/marketshare" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header"><h5>Location Information</h5></div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr><td className="text-muted"><strong>Province</strong></td><td>{data.province_name}</td></tr>
                  <tr><td className="text-muted"><strong>City</strong></td><td>{data.city_name}</td></tr>
                  <tr><td className="text-muted"><strong>District</strong></td><td>{data.district_name}</td></tr>
                  <tr><td className="text-muted"><strong>Period</strong></td><td>{new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card">
            <div className="card-header"><h5>Sales Performance</h5></div>
            <div className="card-body">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td colSpan="2" className="pb-2">
                      <h6 className="mb-0 text-primary">
                        <i className="bi bi-building me-2"></i>Company
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-4" style={{ width: '40%' }}>Monthly Sales</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">{formatCurrency(data.monthly_sales)}</span>
                        <span className="badge bg-primary">{data.monthly_sales_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-4">Yearly Sales</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">{formatCurrency(data.yearly_sales)}</span>
                        <span className="badge bg-primary">{data.yearly_sales_percentage}%</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="2" className="py-2"></td>
                  </tr>

                  <tr>
                    <td colSpan="2" className="pb-2">
                      <h6 className="mb-0 text-secondary">
                        <i className="bi bi-shop me-2"></i>Competitor
                      </h6>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-4">Monthly Sales</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">{formatCurrency(data.monthly_competitor_sales)}</span>
                        <span className="badge bg-secondary">{data.monthly_competitor_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-4">Yearly Sales</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">{formatCurrency(data.yearly_competitor_sales)}</span>
                        <span className="badge bg-secondary">{data.yearly_competitor_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {data.notes && (
        <div className="card mb-4">
          <div className="card-header"><h5>Notes</h5></div>
          <div className="card-body">{data.notes}</div>
        </div>
      )}

      <AuditInfoCard data={data} />

      <ConfirmationModal
        show={showDeleteModal}
        title="Delete Market Share"
        message="Are you sure you want to delete this market share data?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default MarketShareDetail;
