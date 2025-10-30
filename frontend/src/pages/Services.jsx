import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Modal, Form, Row, Col, Pagination, Alert } from 'react-bootstrap'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Services = () => {
  const { user } = useAuth()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: ''
  })

  useEffect(() => {
    fetchServices()
  }, [currentPage, search])

  const fetchServices = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(search && { search })
      })

      const response = await api.get(`/services?${params}`)
      setServices(response.data.data || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to fetch services.')
      }
      setServices([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleShowModal = (service = null) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString()
      })
    } else {
      setEditingService(null)
      setFormData({
        name: '',
        description: '',
        price: ''
      })
    }
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingService(null)
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
      const submitData = {
        ...formData,
        price: parseFloat(formData.price)
      }

      if (editingService) {
        await api.put(`/service/${editingService.id}`, submitData)
        setSuccess('Service updated successfully')
      } else {
        await api.post('/service', submitData)
        setSuccess('Service created successfully')
      }
      
      fetchServices()
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

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await api.delete(`/service/${serviceId}`)
        setSuccess('Service deleted successfully')
        fetchServices()
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR'
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const canModify = user?.role === 'admin'
  const showCreatedAt = user?.role !== 'customer'

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Services Management</h2>
        {canModify && (
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="fas fa-plus me-2"></i>
            Add Service
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
                <Form.Label>Search Services</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name or description..."
                  value={search}
                  onChange={handleSearch}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Services Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Services List</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : services.length > 0 ? (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    {showCreatedAt && <th>Created At</th>}
                    {canModify && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-tools fa-2x text-primary me-3"></i>
                          <div>
                            <div className="fw-bold">{service.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{service.description || '-'}</td>
                      <td className="fw-bold text-success">{formatPrice(service.price)}</td>
                      {showCreatedAt && <td>{formatDate(service.created_at)}</td>}
                      {canModify && (
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowModal(service)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
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
            !error && <p className="text-muted text-center py-4">No services found</p>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Service Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Service Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Oil Change"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Service description..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price *</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingService ? 'Update Service' : 'Add Service'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}

export default Services
