import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ShieldAlert, CheckCircle, Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await authAPI.register({ name, email, password, role });
      setSuccess(data.message || 'Registration successful!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card premium-card">
        {/* Back navigation matching screenshot */}
        <div className="auth-back-row">
          <Link to="/login" className="back-nav-link">
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
        </div>

        <div className="auth-header" style={{ marginTop: '10px' }}>
          <h1 className="auth-title">Let's Create New Account</h1>
        </div>

        {error && (
          <div className="auth-error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-success-banner">
            <CheckCircle size={18} />
            <span>{success} Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="premium-label">Register As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="premium-input select-dark"
              style={{ padding: '12px' }}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin / HR</option>
            </select>
          </div>

          <div className="form-group">
            <label className="premium-label">Full Name</label>
            <div className="input-icon-wrapper">
              <User className="input-left-icon" size={16} />
              <input
                type="text"
                required
                placeholder="Enter Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="premium-input input-with-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="premium-label">Email Address</label>
            <div className="input-icon-wrapper">
              <Mail className="input-left-icon" size={16} />
              <input
                type="email"
                required
                placeholder="Enter Your Email Address"
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

          <div className="form-group">
            <label className="premium-label">Confirm Password</label>
            <div className="input-icon-wrapper">
              <Lock className="input-left-icon" size={16} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Enter A Strong Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="premium-input input-with-icon password-input-field"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Agree Terms row matching screenshot */}
          <div className="auth-remember-row">
            <label className="remember-label">
              <input type="checkbox" required className="auth-checkbox" />
              <span>I agree to Nexus HRMS <span className="terms-link">Terms of Service</span> & <span className="terms-link">Privacy Policy</span></span>
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary auth-submit-btn">
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
