import React, { useState, useEffect } from 'react'
import { Card, Form, Button, Alert, Container, InputGroup } from 'react-bootstrap'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      })
    }

    if (error) setError('')
    if (showChangePassword) setShowChangePassword(false)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowChangePassword(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      const errorPayload = result.error
      let errorMessage = 'Login failed'

      if (errorPayload && errorPayload.message) {
        errorMessage = errorPayload.message
      } else if (errorPayload) {
        errorMessage = String(errorPayload)
      }
      
      setError(errorMessage)

      if (errorMessage.includes('Invalid Credentials')) {
        setShowChangePassword(true)
      }
    }

    setLoading(false)
  }

  return (
    <div className="login-container">
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <h2 className="mb-2">
                    <i className="fas fa-wrench text-primary me-2"></i>
                    Workshop
                  </h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                {successMessage && (
                  <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
                    {successMessage}
                  </Alert>
                )}
                {error && <Alert variant="danger">{error}</Alert>}

                {showChangePassword && (
                  <div className="d-grid gap-2 mb-3">
                    <Button variant="warning" onClick={() => navigate('/forgot-password')}>
                      Forgot Password?
                    </Button>
                  </div>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      isInvalid={!!validationErrors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Password</Form.Label>
                    <InputGroup hasValidation>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        isInvalid={!!validationErrors.password}
                      />
                      <InputGroup.Text onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer' }}>
                        <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                      </InputGroup.Text>
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Password must be at least 8 characters
                    </Form.Text>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary">
                      Sign up
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Login