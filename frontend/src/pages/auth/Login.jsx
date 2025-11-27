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

          .input-group-text {
            background: transparent;
            border-right: none;
            color: #64748b;
          }
          
          .form-control {
            border-left: none;
            padding-left: 0;
          }
          
          .form-control:focus {
            box-shadow: none;
            border-color: #cbd5e1;
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

          .btn-login {
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

          .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
          }

          .btn-login::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: 0.5s;
          }

          .btn-login:hover::after {
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

        <h1 className="fw-bold mb-3 display-5 text-center">Promotion & Safety Riding</h1>
        <p className="text-center text-light opacity-75 fs-5" style={{ maxWidth: '400px' }}>
          Management System
        </p>

        <div className="safety-pattern"></div>
      </div>

      {/* Right Side - Form */}
      <div className="form-section">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-5 d-md-none">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-shield-check fs-2" aria-hidden="true"></i>
            </div>
            <h1 className="fw-bold text-dark h2">Promotion & Safety Riding</h1>
          </div>

          <div className="mb-5">
            <h2 className="fw-bold text-dark mb-2">Welcome Back!</h2>
            <p className="text-secondary">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={`input-wrapper ${focusedInput === 'email' ? 'focused' : ''}`}>
              <i className="bi bi-envelope" aria-hidden="true"></i>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Email Address"
                required
                aria-label="Email Address"
              />
            </div>

            <div className={`input-wrapper ${focusedInput === 'password' ? 'focused' : ''}`}>
              <i className="bi bi-lock" aria-hidden="true"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Password"
                required
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', cursor: 'pointer' }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`bi bi-eye${showPassword ? '-slash' : ''} m-0`} aria-hidden="true"></i>
              </button>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label text-secondary small" htmlFor="remember">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-primary text-decoration-none small fw-semibold">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-login text-white w-100 mb-4"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center">
              <p className="text-secondary mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary fw-semibold text-decoration-none">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
