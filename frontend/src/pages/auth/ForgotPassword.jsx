import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { forgotPassword } = useAuth();

  useEffect(() => {
    // Check for existing countdown on mount
    const storedEndTime = localStorage.getItem('forgotPasswordCountdownEnd');
    if (storedEndTime) {
      const remaining = Math.ceil((parseInt(storedEndTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setCountdown(remaining);
        setSubmitted(true);
        // Restore email if possible, or just show a generic message if email wasn't stored
        // For now, we'll assume the user remembers or we can store email too if needed
        const storedEmail = localStorage.getItem('forgotPasswordEmail');
        if (storedEmail) setEmail(storedEmail);
      } else {
        localStorage.removeItem('forgotPasswordCountdownEnd');
        localStorage.removeItem('forgotPasswordEmail');
      }
    }
  }, []);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('forgotPasswordCountdownEnd');
            localStorage.removeItem('forgotPasswordEmail');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startCountdown = () => {
    const duration = 300; // 5 minutes
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem('forgotPasswordCountdownEnd', endTime.toString());
    localStorage.setItem('forgotPasswordEmail', email);
    setCountdown(duration);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    const result = await forgotPassword(email);
    if (result.success) {
      toast.success('Password reset instructions resent.');
      startCountdown();
    } else {
      toast.error(result.error || 'Failed to resend email');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setSubmitted(true);
      startCountdown();
      toast.success('Password reset instructions sent to your email.');
    } else {
      toast.error(result.error || 'Failed to send reset email');
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
          <i className="bi bi-shield-lock" style={{ fontSize: '3.5rem' }}></i>
        </div>

        <h1 className="fw-bold mb-3 display-5 text-center">Account Recovery</h1>
        <p className="text-center text-light opacity-75 fs-5" style={{ maxWidth: '400px' }}>
          Don't worry, we'll help you get back on track
        </p>

        <div className="safety-pattern"></div>
      </div>

      {/* Right Side - Form */}
      <div className="form-section">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div className="text-center mb-5 d-md-none">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-shield-lock fs-2"></i>
            </div>
            <h2 className="fw-bold text-dark">Safety Riding</h2>
          </div>

          <div className="mb-5">
            <h2 className="fw-bold text-dark mb-2">Forgot Password?</h2>
            <p className="text-secondary">Enter your email address and we'll send you instructions to reset your password.</p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <i className="bi bi-envelope"></i>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom text-white w-100 mb-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center mb-4">
              <div className="mb-3 text-success">
                <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
              </div>
              <h4 className="fw-bold">Check your email</h4>
              <p className="text-secondary mb-3">
                We have sent password reset instructions to <strong>{email}</strong>.
              </p>

              {countdown > 0 && (
                <div className="alert alert-warning py-2 mb-3">
                  <small><i className="bi bi-hourglass-split me-1"></i> Please wait {formatTime(countdown)} before trying again.</small>
                </div>
              )}

              <button
                onClick={handleResend}
                className="btn btn-primary-custom text-white w-100 mb-3"
                disabled={countdown > 0 || loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resending...
                  </>
                ) : (
                  'Resend Email'
                )}
              </button>

              <button
                onClick={() => setSubmitted(false)}
                className="btn btn-outline-primary w-100 mb-3"
                disabled={countdown > 0}
              >
                Try another email
              </button>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="text-secondary text-decoration-none fw-semibold">
              <i className="bi bi-arrow-left me-2"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
