import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Login successful!');
      if (result.user?.role === 'admin' || result.user?.role === 'viewer') {
        navigate('/dashboard');
      } else {
        navigate('/profile');
      }
    } else {
      toast.error(result.error || 'Login failed');
    }

    setLoading(false);
  };

  const inputStyle = {
    padding: '0.75rem 1rem 0.75rem 2.75rem',
    fontSize: '0.95rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc'
  };

  const inputFocusStyle = {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    transform: 'translateY(-1px)',
    backgroundColor: '#ffffff'
  };

  const iconStyle = {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.1rem',
    color: '#64748b',
    transition: 'color 0.3s ease',
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        overflow: 'hidden'
      }}
    >
      {/* Modern geometric patterns */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        opacity: 0.4
      }}>
        <div style={{
          position: 'absolute',
          top: '-5%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          animation: 'morphing 8s ease-in-out infinite',
          filter: 'blur(40px)'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '250px',
          height: '250px',
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          borderRadius: '70% 30% 30% 70% / 70% 70% 30% 30%',
          animation: 'morphing 10s ease-in-out infinite reverse',
          filter: 'blur(40px)'
        }}></div>
      </div>

      <style>
        {`
          @keyframes morphing {
            0%, 100% {
              border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
              transform: rotate(0deg) scale(1);
            }
            50% {
              border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
              transform: rotate(180deg) scale(1.1);
            }
          }

          .login-card {
            background: #ffffff;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid rgba(148, 163, 184, 0.1);
          }

          .login-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          }

          .btn-login {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border: none;
            padding: 0.85rem;
            font-weight: 600;
            letter-spacing: 0.3px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .btn-login::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s ease;
          }

          .btn-login:hover::before {
            left: 100%;
          }

          .btn-login:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
          }

          .btn-login:active {
            transform: translateY(0);
          }

          .password-toggle {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 0.25rem;
            transition: color 0.3s ease;
          }

          .password-toggle:hover {
            color: #3b82f6;
          }

          .brand-icon {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
          }

          .form-label {
            font-weight: 600;
            font-size: 0.9rem;
            color: #334155;
            margin-bottom: 0.5rem;
          }
        `}
      </style>

      <div
        className="card login-card shadow-lg"
        style={{
          maxWidth: '440px',
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
              <i className="bi bi-shield-check text-white" style={{ fontSize: '2rem' }}></i>
            </div>
            <h2 className="fw-bold mb-2" style={{
              color: '#0f172a',
              fontSize: '1.75rem',
              letterSpacing: '-0.5px'
            }}>
              Welcome Back
            </h2>
            <p className="mb-0" style={{
              fontSize: '0.95rem',
              color: '#64748b'
            }}>
              Promotion & Safety Riding Management
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Email Address</label>
              <div className="position-relative">
                <i
                  className="bi bi-envelope"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'email' ? '#3b82f6' : '#64748b'
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

            <div className="mb-4">
              <label className="form-label">Password</label>
              <div className="position-relative">
                <i
                  className="bi bi-lock"
                  style={{
                    ...iconStyle,
                    color: focusedInput === 'password' ? '#3b82f6' : '#64748b'
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
                  placeholder="Enter your password"
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
            </div>

            <button
              type="submit"
              className="btn btn-login text-white w-100"
              disabled={loading}
              style={{
                borderRadius: '12px',
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="mb-0" style={{
              fontSize: '0.9rem',
              color: '#64748b'
            }}>
              Don't have an account? {' '}
              <Link
                to="/register"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
