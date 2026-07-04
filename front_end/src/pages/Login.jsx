import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card premium-card">
        {/* Nexus HRMS logo on top of login card */}
        <div className="auth-logo-row">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
            <path d="M4 22H18L10 6H4V22Z" fill="var(--primary)" />
            <path d="M24 6H10L18 22H24V6Z" fill="var(--primary)" opacity="0.8" />
          </svg>
          <span className="auth-logo-text">Nexus HRMS</span>
        </div>

        {error && (
          <div className="auth-error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="premium-label">Email or Employee ID</label>
            <div className="input-icon-wrapper">
              <Mail className="input-left-icon" size={16} />
              <input
                type="text"
                required
                placeholder="Enter Your Email or Employee ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input input-with-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="premium-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock className="input-left-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter A Strong Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input input-with-icon password-input-field"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password row matching screenshot */}
          <div className="auth-remember-row">
            <label className="remember-label">
              <input type="checkbox" className="auth-checkbox" />
              <span>Remember Me</span>
            </label>
            <span className="forgot-password-link">Forgot Password?</span>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary auth-submit-btn">
            {submitting ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="auth-terms-text" style={{ marginTop: '24px' }}>
          By clicking "Log In" above you agree to the <span className="terms-link">Terms & Conditions</span> and <span className="terms-link">Privacy Policy</span>.
        </p>

        <div className="auth-footer">
          <span>Don't Have Account? </span>
          <Link to="/register" className="auth-link">Create Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
