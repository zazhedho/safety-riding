import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom' // Import useNavigate
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate() // Get the navigate function
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalVehicles: 0,
    totalServices: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, vehiclesRes, servicesRes] = await Promise.all([
        api.get('/bookings?limit=5'),
        api.get('/vehicles?limit=1'),
        api.get('/services?limit=1')
      ])

      const bookings = bookingsRes.data.data || []
      const pendingCount = bookings.filter(b => b.status === 'pending').length

      setStats({
        totalBookings: bookingsRes.data.total_data || 0,
        pendingBookings: pendingCount,
        totalVehicles: vehiclesRes.data.total_data || 0,
        totalServices: servicesRes.data.total_data || 0
      })

      setRecentBookings(bookings)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      'on progress': 'primary',
      completed: 'success',
      cancelled: 'danger'
    }
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <p className="text-muted mb-0">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="stats-card" onClick={() => navigate('/bookings')} style={{ cursor: 'pointer' }}>
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h3 className="mb-0">{stats.totalBookings}</h3>
                <p className="mb-0">Total Bookings</p>
              </div>
              <i className="fas fa-calendar-check stats-icon"></i>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="stats-card" onClick={() => navigate('/bookings?status=pending')} style={{ cursor: 'pointer' }}>
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h3 className="mb-0">{stats.pendingBookings}</h3>
                <p className="mb-0">Pending Bookings</p>
              </div>
              <i className="fas fa-clock stats-icon"></i>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="stats-card" onClick={() => navigate('/vehicles')} style={{ cursor: 'pointer' }}>
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h3 className="mb-0">{stats.totalVehicles}</h3>
                <p className="mb-0">Total Vehicles</p>
              </div>
              <i className="fas fa-car stats-icon"></i>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="stats-card" onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <h3 className="mb-0">{stats.totalServices}</h3>
                <p className="mb-0">Total Services</p>
              </div>
              <i className="fas fa-tools stats-icon"></i>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Bookings */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Recent Bookings</h5>
        </Card.Header>
        <Card.Body>
          {recentBookings.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Booking Date</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{formatDate(booking.booking_date)}</td>
                    <td>{booking.Vehicle.model}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>{booking.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-4">No recent bookings found</p>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default Dashboard