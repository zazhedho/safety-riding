import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Row, Col, Pagination, Alert, Badge } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Bookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    status: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    vehicle_id: '',
    booking_date: null,
    notes: '',
    service_ids: []
  })

  const [statusData, setStatusData] = useState({
    status: ''
  })

  useEffect(() => {
    fetchBookings()
    fetchVehicles()
    fetchServices()
  }, [currentPage, search, filters])

  const fetchBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(search && { search }),
        ...(filters.status && { 'filters[status]': filters.status })
      })

      const response = await api.get(`/bookings?${params}`)
      setBookings(response.data.data || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to fetch bookings.')
      }
      setBookings([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles?limit=100')
      setVehicles(response.data.data || [])
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to fetch vehicles.')
      }
    }
  }

  const fetchServices = async () => {
    try {
      const response = await api.get('/services?limit=100')
      setServices(response.data.data || [])
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to fetch services.')
      }
    }
  }

  const getInitialBookingDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now;
  };

  const handleShowModal = () => {
    setFormData({
      vehicle_id: '',
      booking_date: getInitialBookingDate(),
      notes: '',
      service_ids: []
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setError('')
    setSuccess('')
  }

  const handleShowStatusModal = (booking) => {
    setSelectedBooking(booking)
    setStatusData({ status: booking.status })
    setShowStatusModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseStatusModal = () => {
    setShowStatusModal(false)
    setSelectedBooking(null)
    setError('')
    setSuccess('')
  }

  const handleShowCancelModal = (bookingId) => {
    setBookingToCancel(bookingId)
    setShowCancelModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseCancelModal = () => {
    setBookingToCancel(null)
    setShowCancelModal(false)
    setError('')
    setSuccess('')
  }

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, booking_date: date }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'service_ids') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          service_ids: [...prev.service_ids, value]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          service_ids: prev.service_ids.filter(id => id !== value)
        }))
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleStatusChange = (e) => {
    setStatusData({
      status: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.service_ids.length === 0) {
      setError('Please select at least one service.');
      return;
    }

    if (!formData.booking_date) {
      setError('Booking date is required.');
      return;
    }

    const now = new Date()
    const bookingDate = new Date(formData.booking_date)
    const bookingHour = bookingDate.getHours()

    if (bookingDate.getTime() - now.getTime() < 60 * 60 * 1000) {
        setError('Booking must be at least 1 hour from now.');
        return;
    }

    if (bookingHour < 8 || bookingHour >= 20) {
      setError('Booking time must be between 8:00 AM and 8:00 PM.')
      return
    }

    try {
      // Get the local timezone offset in minutes
      const offsetMinutes = bookingDate.getTimezoneOffset();
      // Convert to hours and format as +/-HH:MM
      const offsetSign = offsetMinutes > 0 ? '-' : '+'; // Invert sign for ISO 8601
      const absOffsetMinutes = Math.abs(offsetMinutes);
      const offsetHours = String(Math.floor(absOffsetMinutes / 60)).padStart(2, '0');
      const offsetRemainderMinutes = String(absOffsetMinutes % 60).padStart(2, '0');
      const timezoneOffset = `${offsetSign}${offsetHours}:${offsetRemainderMinutes}`;

      // Manually construct ISO string with local timezone offset
      const year = bookingDate.getFullYear();
      const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(bookingDate.getDate()).padStart(2, '0');
      const hours = String(bookingDate.getHours()).padStart(2, '0');
      const minutes = String(bookingDate.getMinutes()).padStart(2, '0');
      const seconds = String(bookingDate.getSeconds()).padStart(2, '0');
      const localDateTimeWithOffset = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneOffset}`;

      const submitData = {
        ...formData,
        booking_date: localDateTimeWithOffset
      }

      await api.post('/booking', submitData)
      setSuccess('Booking created successfully')
      
      fetchBookings()
      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Operation failed.')
      }
    }
  }

  const handleStatusSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await api.put(`/booking/${selectedBooking.id}/status`, statusData)
      setSuccess('Booking status updated successfully')
      
      fetchBookings()
      setTimeout(() => {
        handleCloseStatusModal()
      }, 1500)
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Status update failed.')
      }
    }
  }

  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel) return

    setError('')
    setSuccess('')
    try {
      await api.put(`/booking/${bookingToCancel}/status`, { status: 'cancelled' })
      setSuccess('Booking cancelled successfully')
      fetchBookings()
      handleCloseCancelModal()
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to cancel booking.')
      }
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB'
  }

  const filterTime = (time) => {
    const now = new Date();
    const selectedDate = new Date(time);
    const isToday = selectedDate.toDateString() === now.toDateString();

    if (isToday && selectedDate.getTime() < now.getTime() + 60 * 60 * 1000) {
      return false;
    }

    const hour = selectedDate.getHours();
    return hour >= 8 && hour < 20;
  };

  const canCreate = user?.role === 'customer' || user?.role === 'admin'
  const canUpdateStatus = user?.role === 'admin' || user?.role === 'cashier'
  const canCancel = user?.role === 'customer'

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bookings Management</h2>
        {canCreate && (
          <Button variant="primary" onClick={handleShowModal}>
            <i className="fas fa-plus me-2"></i>
            New Booking
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search Bookings</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by notes..."
                  value={search}
                  onChange={handleSearch}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="on progress">On Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Bookings List</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : bookings.length > 0 ? (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Booking Date</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Created At</th>
                    {(canUpdateStatus || canCancel) && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{formatDate(booking.booking_date)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <div className="fw-bold">{booking.Vehicle.model + ' - ' + booking.Vehicle.license_plate.replace(/\s+/g, '')}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(booking.status)}</td>
                      <td>{booking.notes || '-'}</td>
                      <td>{formatDate(booking.created_at)}</td>
                      {(canUpdateStatus || canCancel) && (
                        <td>
                          {canUpdateStatus && !['cancelled'].includes(booking.status) && (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowStatusModal(booking)}
                            >
                                <i className="fas fa-edit me-1"></i>
                                Update Status
                            </Button>
                          )}
                          {canCancel && ['pending', 'confirmed'].includes(booking.status) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleShowCancelModal(booking.id)}
                              className="ms-2"
                            >
                              <i className="fas fa-times me-1"></i>
                              Cancel
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            !error && <p className="text-muted text-center py-4">No bookings found</p>
          )}
        </Card.Body>
      </Card>

      {/* Add Booking Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Booking</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vehicle *</Form.Label>
                  <Form.Select
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Booking Date *</Form.Label>
                  <div>
                    <DatePicker
                      selected={formData.booking_date}
                      onChange={handleDateChange}
                      showTimeSelect
                      filterTime={filterTime}
                      minDate={new Date()}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="form-control"
                      wrapperClassName="w-100"
                      popperPlacement="top-end"
                      required
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Services *</Form.Label>
              <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {services.map((service) => (
                  <Form.Check
                    key={service.id}
                    type="checkbox"
                    id={`service-${service.id}`}
                    name="service_ids"
                    value={service.id}
                    label={`${service.name}`}
                    onChange={handleChange}
                    className="mb-2"
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create Booking
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={handleCloseStatusModal}>
        <Modal.Header closeButton>
          <Modal.Title>Update Booking Status</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleStatusSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Status *</Form.Label>
              <Form.Select
                name="status"
                value={statusData.status}
                onChange={handleStatusChange}
                required
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="on progress">On Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseStatusModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Status
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Cancel Booking Confirmation Modal */}
      <Modal show={showCancelModal} onHide={handleCloseCancelModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel this booking?
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCancelModal}>
            Close
          </Button>
          <Button variant="danger" onClick={handleConfirmCancelBooking}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Bookings
