import React, { useState, useEffect } from 'react'
import { Card, Button, Table, Badge, Modal, Form, Alert, Spinner, Row, Col, Pagination } from 'react-bootstrap'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const WorkOrders = () => {
  const { user } = useAuth()
  const [workOrders, setWorkOrders] = useState([])
  const [bookings, setBookings] = useState([])
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null)

  const [createFormData, setCreateFormData] = useState({ booking_id: '' })
  const [assignMechanicData, setAssignMechanicData] = useState({ mechanic_id: '' })

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchWorkOrders()
    if (user.role === 'admin' || user.role === 'cashier') {
      fetchConfirmedBookings()
      fetchMechanics()
    }
  }, [currentPage, search])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: currentPage, limit: 10, search })
      const response = await api.get('/workorders', { params })
      setWorkOrders(response.data.data || [])
      setTotalPages(response.data.total_pages || 1)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch work orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchConfirmedBookings = async () => {
    try {
      const response = await api.get('/bookings', { params: { 'filters[status]': 'confirmed', limit: 100 } })
      setBookings(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch confirmed bookings:', err)
    }
  }

  const fetchMechanics = async () => {
    try {
      const response = await api.get('/users', { params: { 'filters[role]': 'mechanic', limit: 100 } })
      setMechanics(response.data.data || [])
    } catch (err) {
      console.error('Failed to fetch mechanics:', err)
    }
  }

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await api.post(`/workorder/from-booking/${createFormData.booking_id}`)
      setSuccess('Work order created successfully')
      setShowCreateModal(false)
      setCreateFormData({ booking_id: '' })
      fetchWorkOrders()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create work order')
    }
  }

  const handleViewDetails = (workOrder) => {
    setSelectedWorkOrder(workOrder)
    setShowDetailModal(true)
  }

  const handleAssignMechanic = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await api.put(`/workorder/${selectedWorkOrder.id}/assign-mechanic`, assignMechanicData)
      setSuccess('Mechanic assigned successfully')
      setShowAssignModal(false)
      setAssignMechanicData({ mechanic_id: '' })
      fetchWorkOrders() // Refresh the list
      // Optionally, refresh the details modal if it's open
      if (showDetailModal) {
        const updatedWorkOrder = { ...selectedWorkOrder, mechanic_id: assignMechanicData.mechanic_id };
        setSelectedWorkOrder(updatedWorkOrder);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign mechanic')
    }
  }

  const handleUpdateStatus = async (workOrderId, newStatus) => {
    setError('')
    setSuccess('')

    try {
      await api.put(`/workorder/${workOrderId}/status`, { status: newStatus })
      setSuccess(`Work order status updated to ${newStatus}`)
      fetchWorkOrders() // Refresh the list
      // Optionally, refresh the details modal if it's open
      if (showDetailModal && selectedWorkOrder?.id === workOrderId) {
        const updatedWorkOrder = { ...selectedWorkOrder, status: newStatus };
        setSelectedWorkOrder(updatedWorkOrder);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      'in progress': 'info',
      completed: 'success',
      cancelled: 'danger'
    }
    return <Badge bg={variants[status] || 'secondary'}>{status?.replace('_', ' ').toUpperCase()}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  }

  const canPerformActions = user.role === 'admin' || user.role === 'cashier';

  if (loading && workOrders.length === 0) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-clipboard-list me-2"></i>
          Work Orders
        </h2>
        {canPerformActions && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <i className="fas fa-plus me-2"></i>
            New Work Order
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <Form.Group>
            <Form.Label>Search Work Orders</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by vehicle, customer, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Mechanic</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center"><Spinner animation="border" size="sm" /></td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No work orders found
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td>
                      <small className="font-monospace">{wo.id.slice(0, 8)}</small>
                    </td>
                    <td>{wo.Vehicle?.model || 'N/A'} ({wo.Vehicle?.license_plate || 'N/A'})</td>
                    <td>{wo.User?.name || 'N/A'}</td>
                    <td>{wo.Mechanic?.name || 'Unassigned'}</td>
                    <td>{getStatusBadge(wo.status)}</td>
                    <td>{new Date(wo.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleViewDetails(wo)}
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      {canPerformActions && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedWorkOrder(wo)
                            setShowAssignModal(true)
                          }}
                        >
                          <i className="fas fa-user-plus"></i>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="justify-content-center">
              <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} />
              {[...Array(totalPages).keys()].map(p => (
                <Pagination.Item key={p + 1} active={p + 1 === currentPage} onClick={() => setCurrentPage(p + 1)}>
                  {p + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} />
            </Pagination>
          )}
        </Card.Body>
      </Card>

      {/* Create Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Work Order from Booking</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateWorkOrder}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Confirmed Booking</Form.Label>
              <Form.Select
                value={createFormData.booking_id}
                onChange={(e) => setCreateFormData({ booking_id: e.target.value })}
                required
              >
                <option value="">Select a confirmed booking</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.Vehicle.model} ({b.Vehicle.license_plate}) - {new Date(b.booking_date).toLocaleDateString()}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Details Modal */}
      {selectedWorkOrder && (
        <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Work Order Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <p><strong>ID:</strong> <span className="font-monospace">{selectedWorkOrder.id}</span></p>
                <p><strong>Vehicle:</strong> {selectedWorkOrder.Vehicle?.model} ({selectedWorkOrder.Vehicle?.license_plate})</p>
                <p><strong>Customer:</strong> {selectedWorkOrder.User?.name}</p>
              </Col>
              <Col md={6}>
                <p><strong>Status:</strong> {getStatusBadge(selectedWorkOrder.status)}</p>
                <p><strong>Mechanic:</strong> {selectedWorkOrder.Mechanic?.name || 'Unassigned'}</p>
                <p><strong>Created:</strong> {new Date(selectedWorkOrder.created_at).toLocaleString()}</p>
              </Col>
            </Row>
            <hr />
            <h5>Services</h5>
            <Table bordered size="sm">
              <thead><tr><th>Name</th><th>Price</th></tr></thead>
              <tbody>
                {selectedWorkOrder.Services?.map(s => (
                  <tr key={s.id}><td>{s.service_name}</td><td>{formatCurrency(s.price)}</td></tr>
                ))}
              </tbody>
            </Table>
            <div className="text-end fw-bold">Total: {formatCurrency(selectedWorkOrder.total_price)}</div>
            
            {canPerformActions && (
              <div className="mt-4">
                <strong>Update Status:</strong>
                <div className="btn-group w-100 mt-2">
                  {['pending', 'in progress', 'completed', 'cancelled'].map(status => (
                    <Button 
                      key={status} 
                      variant={selectedWorkOrder.status === status ? 'primary' : 'outline-primary'}
                      onClick={() => handleUpdateStatus(selectedWorkOrder.id, status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Assign Mechanic Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Mechanic</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAssignMechanic}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Select Mechanic</Form.Label>
              <Form.Select
                value={assignMechanicData.mechanic_id}
                onChange={(e) => setAssignMechanicData({ mechanic_id: e.target.value })}
                required
              >
                <option value="">Choose a mechanic</option>
                {mechanics.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Assign</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkOrders
