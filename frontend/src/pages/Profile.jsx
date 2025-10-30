import React, { useState } from 'react'
import { Card, Form, Button, Alert, Row, Col, InputGroup } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Profile = () => {
  const { user, updateProfile } = useAuth()

  // State for profile information
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // State for password change
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setProfileLoading(true)

    const result = await updateProfile(profileData)

    if (result.success) {
      setProfileSuccess('Profile updated successfully')
    } else {
      const errorPayload = result.error
      if (errorPayload && errorPayload.message) {
        setProfileError(errorPayload.message)
      } else if (errorPayload) {
        setProfileError(String(errorPayload))
      } else {
        setProfileError('Profile update failed')
      }
    }
    setProfileLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordLoading(true)

    try {
      await api.put('/user/change/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      setPasswordSuccess('Password changed successfully')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (err) {
      const errorPayload = err.response?.data
      if (errorPayload && errorPayload.error && errorPayload.error.message) {
        setPasswordError(errorPayload.error.message)
      } else if (errorPayload && errorPayload.error) {
          setPasswordError(String(errorPayload.error))
      } else if (errorPayload && errorPayload.message) {
        setPasswordError(errorPayload.message)
      } else {
        setPasswordError('Failed to change password.')
      }
    }
    setPasswordLoading(false)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Profile Settings</h2>
      </div>

      <Row>
        <Col md={8} lg={6}>
          {/* Update Profile Information Card */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Update Profile Information</h5>
            </Card.Header>
            <Card.Body>
              {profileError && <Alert variant="danger">{profileError}</Alert>}
              {profileSuccess && <Alert variant="success">{profileSuccess}</Alert>}

              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={profileLoading}
                  className="w-100"
                >
                  {profileLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Updating Profile...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Change Password Card */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Change Password</h5>
            </Card.Header>
            <Card.Body>
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
              {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter your current password"
                    />
                    <InputGroup.Text onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ cursor: 'pointer' }}>
                      <i className={showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter new password"
                    />
                    <InputGroup.Text onClick={() => setShowNewPassword(!showNewPassword)} style={{ cursor: 'pointer' }}>
                      <i className={showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password"
                    />
                    <InputGroup.Text onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ cursor: 'pointer' }}>
                      <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </InputGroup.Text>
                  </InputGroup>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={passwordLoading}
                  className="w-100"
                >
                  {passwordLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} lg={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Account Information</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <i className="fas fa-user-circle fa-5x text-muted"></i>
              </div>
              
              <div className="mb-3">
                <strong>Name:</strong>
                <p className="mb-0">{user?.name}</p>
              </div>
              
              <div className="mb-3">
                <strong>Email:</strong>
                <p className="mb-0">{user?.email}</p>
              </div>
              
              <div className="mb-3">
                <strong>Phone:</strong>
                <p className="mb-0">{user?.phone}</p>
              </div>
              
              <div className="mb-3">
                <strong>Role:</strong>
                <p className="mb-0">
                  <span className="badge bg-primary">{user?.role}</span>
                </p>
              </div>
              
              <div className="mb-3">
                <strong>Member Since:</strong>
                <p className="mb-0">
                  {user?.created_at && new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile