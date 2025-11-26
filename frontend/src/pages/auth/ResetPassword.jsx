import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumber: false,
    hasSymbol: false
  });

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Invalid password reset link.');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'newPassword') {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasLowercase: /[a-z]/.test(value),
        hasUppercase: /[A-Z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSymbol: /[^a-zA-Z0-9]/.test(value)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password requirements
    const allRequirementsMet = Object.values(passwordValidation).every(val => val === true);
    if (!allRequirementsMet) {
      toast.error('New password does not meet all requirements');
      return;
    }

    setLoading(true);

    const result = await resetPassword(token, formData.newPassword);

    if (result.success) {
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } else {
      toast.error(result.error || 'Failed to reset password');
    }

    setLoading(false);
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
            margin-bottom: 1.5rem;
          }

          .input-wrapper:focus-within {
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

          .input-wrapper:focus-within i {
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

          .btn-primary-custom {
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

          .btn-primary-custom:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
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

          @media (max-width: 768px) {
            .brand-section {
              display: none;
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
          <i className="bi bi-shield-check" style={{ fontSize: '3.5rem' }}></i>
        </div>

        <h1 className="fw-bold mb-3 display-5 text-center">Reset Password</h1>
        <p className="text-center text-light opacity-75 fs-5" style={{ maxWidth: '400px' }}>
          Create a new strong password for your account
        </p>

        <div className="safety-pattern"></div>
      </div>

      {/* Right Side - Form */}
      <div className="form-section">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-5 d-md-none">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-shield-check fs-2"></i>
            </div>
            <h2 className="fw-bold text-dark">Safety Riding</h2>
          </div>

          <div className="mb-5">
            <h2 className="fw-bold text-dark mb-2">New Password</h2>
            <p className="text-secondary">Please enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <i className="bi bi-lock"></i>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New Password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className={`bi bi-eye${showNewPassword ? '-slash' : ''} m-0`}></i>
              </button>
            </div>

            {formData.newPassword && (
              <div className="mb-3 p-3 bg-light rounded">
                <small className="d-block fw-bold mb-2 text-secondary">Password Requirements:</small>
                <div className="d-flex flex-column gap-1">
                  <small className={passwordValidation.minLength ? 'text-success' : 'text-danger'}>
                    <i className={`bi bi-${passwordValidation.minLength ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                    Minimum 8 characters
                  </small>
                  <small className={passwordValidation.hasLowercase ? 'text-success' : 'text-danger'}>
                    <i className={`bi bi-${passwordValidation.hasLowercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                    At least 1 lowercase letter (a-z)
                  </small>
                  <small className={passwordValidation.hasUppercase ? 'text-success' : 'text-danger'}>
                    <i className={`bi bi-${passwordValidation.hasUppercase ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                    At least 1 uppercase letter (A-Z)
                  </small>
                  <small className={passwordValidation.hasNumber ? 'text-success' : 'text-danger'}>
                    <i className={`bi bi-${passwordValidation.hasNumber ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                    At least 1 number (0-9)
                  </small>
                  <small className={passwordValidation.hasSymbol ? 'text-success' : 'text-danger'}>
                    <i className={`bi bi-${passwordValidation.hasSymbol ? 'check-circle-fill' : 'x-circle-fill'} me-1`}></i>
                    At least 1 symbol (!@#$%^&*...)
                  </small>
                </div>
              </div>
            )}

            <div className="input-wrapper">
              <i className="bi bi-shield-lock"></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer' }}
              >
                <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''} m-0`}></i>
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary-custom text-white w-100 mb-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-secondary text-decoration-none fw-semibold">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
