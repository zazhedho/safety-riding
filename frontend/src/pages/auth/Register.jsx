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

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return '#ef4444';
    if (passwordStrength === 2) return '#f59e0b';
    if (passwordStrength === 3) return '#10b981';
    return '#059669';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-vh-100 d-flex overflow-hidden">
      <style>
        {`
          .login-split-container {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-wrap: wrap;
          }
          
          .brand-section {
            flex: 1;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            padding: 2rem;
            overflow: hidden;
            min-height: 300px;
          }

          .form-section {
            flex: 1;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            position: relative;
            min-width: 320px;
            overflow-y: auto;
          }

          /* Road markings effect */
          .road-line {
            position: absolute;
            width: 4px;
            height: 100px;
            background: rgba(255, 255, 255, 0.15);
            left: 50%;
            transform: translateX(-50%);
            animation: moveRoad 3s linear infinite;
          }
          
          .road-line:nth-child(1) { top: -100px; animation-delay: 0s; }
          .road-line:nth-child(2) { top: 50%; animation-delay: 1s; }
          .road-line:nth-child(3) { top: 100%; animation-delay: 2s; }

          @keyframes moveRoad {
            0% { top: -150px; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }

          .safety-pattern {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 10px;
            background: repeating-linear-gradient(
              45deg,
              #fbbf24,
              #fbbf24 10px,
              #1e293b 10px,
              #1e293b 20px
            );
          }

          .input-wrapper {
            display: flex;
            align-items: center;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 0.5rem 1rem;
            transition: all 0.3s ease;
            background: white;
            margin-bottom: 1rem;
          }

          .input-wrapper.focused {
            border-color: #3b82f6;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            transform: translateY(-1px);
          }

          .input-wrapper i {
            font-size: 1.2rem;
            color: #94a3b8;
            margin-right: 1rem;
            transition: color 0.3s ease;
          }

          .input-wrapper.focused i {
            color: #3b82f6;
          }

          .input-wrapper input {
            border: none;
            outline: none;
            width: 100%;
            color: #1e293b;
            font-weight: 500;
          }

          .input-wrapper input::placeholder {
            color: #cbd5e1;
          }

          .btn-register {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border: none;
            padding: 1rem;
            border-radius: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .btn-register:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
          }

          .btn-register::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: 0.5s;
          }

          .btn-register:hover::after {
            left: 100%;
          }

          .brand-circle {
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
          }

          .password-strength-bar {
            height: 4px;
            border-radius: 2px;
            background: #e2e8f0;
            overflow: hidden;
            margin-top: 0.5rem;
          }

          .password-strength-fill {
            height: 100%;
            transition: width 0.3s ease, background-color 0.3s ease;
          }

          @media (max-width: 768px) {
            .brand-section {
              display: none;
            }
            .form-section {
              padding: 1rem;
            }
          }
        `}
      </style>

      {/* Left Side - Brand/Theme */}
      <div className="brand-section">
        <div className="road-line"></div>
        <div className="road-line"></div>
        <div className="road-line"></div>

        <div className="brand-circle">
          <i className="bi bi-person-plus-fill" style={{ fontSize: '3.5rem' }}></i>
        </div>

        <h1 className="fw-bold mb-3 display-5 text-center">Join Us</h1>
        <p className="text-center text-light opacity-75 fs-5" style={{ maxWidth: '400px' }}>
          Become part of the Safety Riding community
        </p>

        <div className="safety-pattern"></div>
      </div>

      {/* Right Side - Form */}
      <div className="form-section">
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div className="text-center mb-4 d-md-none">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-shield-check fs-2"></i>
            </div>
            <h2 className="fw-bold text-dark">Safety Riding</h2>
          </div>

          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-2">Create Account</h2>
            <p className="text-secondary">Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-6">
                <div className={`input-wrapper ${focusedInput === 'name' ? 'focused' : ''}`}>
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Full Name"
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className={`input-wrapper ${focusedInput === 'phone' ? 'focused' : ''}`}>
                  <i className="bi bi-telephone"></i>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Phone"
                    required
                  />
                </div>
              </div>
            </div>

            <div className={`input-wrapper ${focusedInput === 'email' ? 'focused' : ''}`}>
              <i className="bi bi-envelope"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Email Address"
                required
              />
            </div>

            <div className={`input-wrapper ${focusedInput === 'password' ? 'focused' : ''}`}>
              <i className="bi bi-lock"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className={`bi bi-eye${showPassword ? '-slash' : ''} m-0`}></i>
              </button>
            </div>

            {formData.password && (
              <div className="mb-3 px-1">
                <div className="password-strength-bar">
                  <div
                    className="password-strength-fill"
                    style={{
                      width: `${(passwordStrength / 4) * 100}%`,
                      backgroundColor: getStrengthColor()
                    }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small style={{ color: getStrengthColor(), fontWeight: '600' }}>
                    {getStrengthText()}
                  </small>
                  <small className="text-secondary" style={{ fontSize: '0.75rem' }}>
                    {passwordStrength}/5 requirements
                  </small>
                </div>

                <div className="row g-1 mt-2">
                  <div className="col-6">
                    <small className={`d-block ${passwordValidation.minLength ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.minLength ? 'check-circle-fill' : 'circle'} me-1`}></i> Min 8 chars
                    </small>
                    <small className={`d-block ${passwordValidation.hasLowercase ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasLowercase ? 'check-circle-fill' : 'circle'} me-1`}></i> Lowercase
                    </small>
                    <small className={`d-block ${passwordValidation.hasUppercase ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasUppercase ? 'check-circle-fill' : 'circle'} me-1`}></i> Uppercase
                    </small>
                  </div>
                  <div className="col-6">
                    <small className={`d-block ${passwordValidation.hasNumber ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasNumber ? 'check-circle-fill' : 'circle'} me-1`}></i> Number
                    </small>
                    <small className={`d-block ${passwordValidation.hasSymbol ? 'text-success' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                      <i className={`bi bi-${passwordValidation.hasSymbol ? 'check-circle-fill' : 'circle'} me-1`}></i> Symbol
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className={`input-wrapper ${focusedInput === 'confirmPassword' ? 'focused' : ''}`}>
              <i className="bi bi-shield-lock"></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onFocus={() => setFocusedInput('confirmPassword')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Confirm Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''} m-0`}></i>
              </button>
            </div>

            {formData.confirmPassword && (
              <div className="mb-3 px-1">
                {formData.password === formData.confirmPassword ? (
                  <small className="text-success fw-semibold">
                    <i className="bi bi-check-circle-fill me-1"></i> Passwords match
                  </small>
                ) : (
                  <small className="text-danger fw-semibold">
                    <i className="bi bi-exclamation-circle-fill me-1"></i> Passwords do not match
                  </small>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-register text-white w-100 mb-4 mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center pb-4">
              <p className="text-secondary mb-0">
                Already have an account?{' '}
                <Link to="/login" className="text-primary fw-semibold text-decoration-none">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
