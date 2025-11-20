import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSymbol: false
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Calculate password strength and validation
    if (name === 'password') {
      const validation = {
        minLength: value.length >= 8,
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[^a-zA-Z0-9]/.test(value)
      };
      setPasswordValidation(validation);

      let strength = 0;
      if (validation.minLength) strength++;
      if (validation.hasLowercase && validation.hasUppercase) strength++;
      if (validation.hasNumber) strength++;
      if (validation.hasSymbol) strength++;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password requirements
    const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
    if (!allRequirementsMet) {
      toast.error('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    });

    if (result.success) {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } else {
      toast.error(result.error || 'Registration failed');
    }

    setLoading(false);
  };

  const inputStyle = {
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    fontSize: '0.95rem',
    border: '2px solid #e9ecef',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
  };

  const inputFocusStyle = {
    borderColor: '#6a9ae0',
    boxShadow: '0 0 0 0.25rem rgba(106, 154, 224, 0.15)',
    transform: 'translateY(-1px)',
  };

  const iconStyle = {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.1rem',
    color: '#6c757d',
    transition: 'color 0.3s ease',
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return '#dc3545';
    if (passwordStrength === 2) return '#ffc107';
    if (passwordStrength === 3) return '#20c997';
    return '#28a745';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative py-5"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        overflow: 'hidden'
      }}
    >
      {/* Animated background shapes */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
      </div>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(5deg); }
          }

          .register-card {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.95);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .register-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2) !important;
          }

          .btn-register {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            padding: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .btn-register::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s ease;
          }

          .btn-register:hover::before {
            left: 100%;
          }

          .btn-register:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
          }

          .btn-register:active {
            transform: translateY(0);
          }

          .password-toggle {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0.25rem;
            transition: color 0.3s ease;
          }

          .password-toggle:hover {
            color: #6a9ae0;
          }

          .brand-icon {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }

          .form-label {
            font-weight: 600;
            font-size: 0.9rem;
            color: #495057;
            margin-bottom: 0.5rem;
          }

          .password-strength-bar {
            height: 4px;
            border-radius: 2px;
            background: #e9ecef;
            overflow: hidden;
            margin-top: 0.5rem;
          }

          .password-strength-fill {
            height: 100%;
            transition: width 0.3s ease, background-color 0.3s ease;
          }
        `}
      </style>

      <div
        className="card register-card shadow-lg"
        style={{
          maxWidth: '480px',
          width: '90%',
          borderRadius: '24px',
          border: 'none',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div className="brand-icon">
              <i className="bi bi-person-plus-fill text-white" style={{ fontSize: '2rem' }}></i>
            </div>
            <h2 className="fw-bold mb-2" style={{
              color: '#2d3748',
              fontSize: '1.75rem',
              letterSpacing: '-0.5px'
            }}>
              Create Account
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                                Join Promotion & Safety Riding Management            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <div className="position-relative">
                <i
                  className="bi bi-person"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'name' ? '#6a9ae0' : '#6c757d'
                  }}
                ></i>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Enter your full name"
                  required
                  style={{
                    ...inputStyle,
                    ...(focusedInput === 'name' ? inputFocusStyle : {})
                  }}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <div className="position-relative">
                <i
                  className="bi bi-envelope"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'email' ? '#6a9ae0' : '#6c757d'
                  }}
                ></i>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Enter your email"
                  required
                  style={{
                    ...inputStyle,
                    ...(focusedInput === 'email' ? inputFocusStyle : {})
                  }}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <div className="position-relative">
                <i
                  className="bi bi-telephone"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'phone' ? '#6a9ae0' : '#6c757d'
                  }}
                ></i>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Enter your phone number"
                  required
                  style={{
                    ...inputStyle,
                    ...(focusedInput === 'phone' ? inputFocusStyle : {})
                  }}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="position-relative">
                <i
                  className="bi bi-lock"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'password' ? '#6a9ae0' : '#6c757d'
                  }}
                ></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Create a strong password"
                  required
                  style={{
                    ...inputStyle,
                    paddingRight: '3rem',
                    ...(focusedInput === 'password' ? inputFocusStyle : {})
                  }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              {formData.password && (
                <div>
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${(passwordStrength / 4) * 100}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    ></div>
                  </div>
                  <div className="mt-2">
                    <small className="d-block fw-bold mb-1" style={{ color: '#495057' }}>Password Requirements:</small>
                    <small className={`d-block ${passwordValidation.minLength ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.minLength ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      Minimum 8 characters
                    </small>
                    <small className={`d-block ${passwordValidation.hasLowercase ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasLowercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 lowercase letter (a-z)
                    </small>
                    <small className={`d-block ${passwordValidation.hasUppercase ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasUppercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 uppercase letter (A-Z)
                    </small>
                    <small className={`d-block ${passwordValidation.hasNumber ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasNumber ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 number (0-9)
                    </small>
                    <small className={`d-block ${passwordValidation.hasSymbol ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasSymbol ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                      At least 1 symbol (!@#$%^&*...)
                    </small>
                    <small className="d-block mt-1" style={{ color: getStrengthColor(), fontSize: '0.8rem', fontWeight: '600' }}>
                      Strength: {getStrengthText()}
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm Password</label>
              <div className="position-relative">
                <i
                  className="bi bi-shield-lock"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'confirmPassword' ? '#6a9ae0' : '#6c757d'
                  }}
                ></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Confirm your password"
                  required
                  style={{
                    ...inputStyle,
                    paddingRight: '3rem',
                    ...(focusedInput === 'confirmPassword' ? inputFocusStyle : {})
                  }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small className="text-danger" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-exclamation-circle me-1"></i>
                  Passwords do not match
                </small>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <small className="text-success" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-check-circle me-1"></i>
                  Passwords match
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-register text-white w-100"
              disabled={loading}
              style={{
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-check me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
              Already have an account? {' '}
              <Link
                to="/login"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#764ba2'}
                onMouseLeave={(e) => e.target.style.color = '#667eea'}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
