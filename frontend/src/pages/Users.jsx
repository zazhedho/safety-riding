import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Badge, Form, Row, Col, Pagination, Alert } from 'react-bootstrap'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Users = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    role: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [currentPage, search, filters])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(search && { search }),
        ...(filters.role && { 'filters[role]': filters.role })
      })

      const response = await api.get(`/users?${params}`)
      setUsers(response.data.data || [])
      setTotalPages(response.data.total_pages || 1)
    } catch (err) {
      const errorPayload = err.response?.data || err
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message)
      } else {
        setError('Failed to fetch users.')
      }
      setUsers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
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

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      cashier: 'info',
      customer: 'success',
      mechanic: 'warning'
    }
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Check if user has permission to view users
  if (user?.role !== 'admin' && user?.role !== 'cashier') {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <i className="fas fa-lock fa-3x text-muted mb-3"></i>
          <h4>Access Denied</h4>
          <p className="text-muted">You don't have permission to view this page.</p>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Users Management</h2>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search Users</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={handleSearch}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filter by Role</Form.Label>
                <Form.Select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                  <option value="customer">Customer</option>
                  <option value="mechanic">Mechanic</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Users Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Users List</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length > 0 ? (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-user-circle fa-2x text-muted me-3"></i>
                          <div>
                            <div className="fw-bold">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{formatDate(user.created_at)}</td>
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
            !error && <p className="text-muted text-center py-4">No users found</p>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default Users