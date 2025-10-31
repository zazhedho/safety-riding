import { useState, useEffect } from 'react';
import DashboardLayout from '../components/common/DashboardLayout';
import schoolService from '../services/schoolService';
import eventService from '../services/eventService';
import accidentService from '../services/accidentService';
import budgetService from '../services/budgetService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState({
    schools: 0,
    events: 0,
    accidents: 0,
    budgets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [schoolsRes, eventsRes, accidentsRes, budgetsRes] = await Promise.all([
        schoolService.getAll({ limit: 1 }),
        eventService.getAll({ limit: 1 }),
        accidentService.getAll({ limit: 1 }),
        budgetService.getAll({ limit: 1 })
      ]);

      setStats({
        schools: schoolsRes.data.total_data || 0,
        events: eventsRes.data.total_data || 0,
        accidents: accidentsRes.data.total_data || 0,
        budgets: budgetsRes.data.total_data || 0
      });
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h2 className="mb-4">Dashboard Overview</h2>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Total Schools</h6>
                <div className="stats-number">{stats.schools}</div>
              </div>
              <i className="bi bi-building fs-1 text-danger"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Total Events</h6>
                <div className="stats-number">{stats.events}</div>
              </div>
              <i className="bi bi-calendar-event fs-1 text-danger"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Total Accidents</h6>
                <div className="stats-number">{stats.accidents}</div>
              </div>
              <i className="bi bi-exclamation-triangle fs-1 text-danger"></i>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="stats-card">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-muted mb-1">Total Budgets</h6>
                <div className="stats-number">{stats.budgets}</div>
              </div>
              <i className="bi bi-cash-stack fs-1 text-danger"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <a href="/schools" className="btn btn-outline-danger w-100">
                    <i className="bi bi-building me-2"></i>Manage Schools
                  </a>
                </div>
                <div className="col-md-3">
                  <a href="/events" className="btn btn-outline-danger w-100">
                    <i className="bi bi-calendar-event me-2"></i>Manage Events
                  </a>
                </div>
                <div className="col-md-3">
                  <a href="/accidents" className="btn btn-outline-danger w-100">
                    <i className="bi bi-exclamation-triangle me-2"></i>View Accidents
                  </a>
                </div>
                <div className="col-md-3">
                  <a href="/budgets" className="btn btn-outline-danger w-100">
                    <i className="bi bi-cash-stack me-2"></i>Budget Reports
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
