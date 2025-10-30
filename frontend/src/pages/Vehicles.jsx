import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Row, Col, Pagination, Alert } from 'react-bootstrap'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Vehicles = () => {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    license_plate: '',
    color: ''
  })

  useEffect(() => {
    fetchVehicles()
  }, [currentPage, search])

  const fetchVehicles = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(search && { search })
      })

      const response = await api.get(`/vehicles?${params}`)
      setVehicles(response.data.data || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to fetch vehicles.')
      }
      setVehicles([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleShowModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setFormData({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        license_plate: vehicle.license_plate,
        color: vehicle.color
      })
    } else {
      setEditingVehicle(null)
      setFormData({
        brand: '',
        model: '',
        year: '',
        license_plate: '',
        color: ''
      })
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingVehicle(null)
    setError('')
    setSuccess('')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingVehicle) {
        await api.put(`/vehicle/${editingVehicle.id}`, formData)
        setSuccess('Vehicle updated successfully')
      } else {
        await api.post('/vehicle', formData)
        setSuccess('Vehicle created successfully')
      }
      
      fetchVehicles()
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

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await api.delete(`/vehicle/${vehicleId}`)
        setSuccess('Vehicle deleted successfully')
        fetchVehicles()
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        const errorPayload = err.response?.data || err
        if (errorPayload && errorPayload.message) {
          setError(errorPayload.message)
        } else {
          setError('Delete failed.')
        }
        setTimeout(() => setError(''), 3000)
      }
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const canModify = user?.role === 'admin' || user?.role === 'customer'
  const showOwner = user?.role === 'admin' || user?.role === 'cashier'

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Vehicles Management</h2>
        {canModify && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="fas fa-plus me-2"></i>
            Add Vehicle
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Search */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search Vehicles</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by license plate, brand, model..."
                  value={search}
                  onChange={handleSearch}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Vehicles List</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : vehicles.length > 0 ? (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>License Plate</th>
                    {showOwner && <th>Owner</th>}
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th>Color</th>
                    <th>Created At</th>
                    {canModify && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-car fa-2x text-primary me-3"></i>
                          <div>
                            <div className="fw-bold">{vehicle.license_plate}</div>
                          </div>
                        </div>
                      </td>
                      {showOwner && <td>{vehicle.User?.name || 'N/A'}</td>}
                      <td>{vehicle.brand}</td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.year}</td>
                      <td>{vehicle.color}</td>
                      <td>{formatDate(vehicle.created_at)}</td>
                      {canModify && (
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(vehicle)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
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
            !error && <p className="text-muted text-center py-4">No vehicles found</p>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Vehicle Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand *</Form.Label>
                  <Form.Control
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Toyota"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Model *</Form.Label>
                  <Form.Control
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Camry"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year *</Form.Label>
                  <Form.Control
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 2020"
                    maxLength={4}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color *</Form.Label>
                  <Form.Control
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Red"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>License Plate *</Form.Label>
              <Form.Control
                type="text"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                required
                placeholder="e.g., B 1234 CD"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default Vehicles