import React, { useState } from 'react';
import { Card, Form, Button, Alert, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/forgot-password', { email });
      setSuccess('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      const errorPayload = err.response?.data || err;
      if (errorPayload && errorPayload.message) {
        setError(errorPayload.message);
      } else {
        setError('Failed to send password reset link.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <Card className="login-card">
              <Card.Body>
                <div className="text-center mb-4">
                  <h2 className="mb-2">
                    <i className="fas fa-key text-primary me-2"></i>
                    Forgot Password
                  </h2>
                  <p className="text-muted">Enter your email to receive a password reset link.</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
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
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="mb-0">
                    Back to{' '}
                    <Link to="/login" className="text-primary">
                      Login
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ForgotPassword;