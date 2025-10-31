import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import schoolService from '../../services/schoolService';
import { toast } from 'react-toastify';

const SchoolDetail = () => {
  const { id } = useParams();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchool();
  }, [id]);

  const fetchSchool = async () => {
    setLoading(true);
    try {
      const response = await schoolService.getById(id);
      setSchool(response.data.data);
    } catch (error) {
      toast.error('Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!school) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <h2>School not found</h2>
          <Link to="/schools" className="btn btn-primary">Back to list</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>School Details</h2>
        <Link to="/schools" className="btn btn-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to List
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <dl className="row">
                <dt className="col-sm-4">NPSN</dt>
                <dd className="col-sm-8">{school.npsn}</dd>

                <dt className="col-sm-4">Name</dt>
                <dd className="col-sm-8">{school.name}</dd>

                <dt className="col-sm-4">Address</dt>
                <dd className="col-sm-8">{school.address}</dd>

                <dt className="col-sm-4">Postal Code</dt>
                <dd className="col-sm-8">{school.postal_code || '-'}</dd>

                <dt className="col-sm-4">Phone</dt>
                <dd className="col-sm-8">{school.phone || '-'}</dd>

                <dt className="col-sm-4">Email</dt>
                <dd className="col-sm-8">{school.email || '-'}</dd>

                <dt className="col-sm-4">Coordinates</dt>
                <dd className="col-sm-8">
                  {school.latitude && school.longitude ? (
                    <span className="badge bg-success">
                      {school.latitude}, {school.longitude}
                    </span>
                  ) : (
                    <span className="badge bg-secondary">No location</span>
                  )}
                </dd>
              </dl>
            </div>
            <div className="col-md-6">
               <dl className="row">
                <dt className="col-sm-4">Province</dt>
                <dd className="col-sm-8">{school.province_name}</dd>

                <dt className="col-sm-4">City/Regency</dt>
                <dd className="col-sm-8">{school.city_name}</dd>

                <dt className="col-sm-4">District</dt>
                <dd className="col-sm-8">{school.district_name}</dd>

                <dt className="col-sm-4">Student Count</dt>
                <dd className="col-sm-8">{school.student_count}</dd>

                <dt className="col-sm-4">Teacher Count</dt>
                <dd className="col-sm-8">{school.teacher_count}</dd>

                <dt className="col-sm-4">Major Count</dt>
                <dd className="col-sm-8">{school.major_count}</dd>

                <dt className="col-sm-4">Visit Count</dt>
                <dd className="col-sm-8">{school.visit_count}</dd>

                <dt className="col-sm-4">Is Educated</dt>
                <dd className="col-sm-8">
                  {school.is_educated ? (
                    <span className="badge bg-success">Yes</span>
                  ) : (
                    <span className="badge bg-danger">No</span>
                  )}
                </dd>

                <dt className="col-sm-4">Last Visit At</dt>
                <dd className="col-sm-8">{formatDate(school.last_visit_at)}</dd>
              </dl>
            </div>
          </div>
          <hr />
          <div className="row">
            <div className="col-md-6">
              <dl className="row">
                <dt className="col-sm-4">Created At</dt>
                <dd className="col-sm-8">{formatDate(school.created_at)}</dd>
              </dl>
            </div>
            <div className="col-md-6">
              <dl className="row">
                <dt className="col-sm-4">Updated At</dt>
                <dd className="col-sm-8">{formatDate(school.updated_at)}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolDetail;