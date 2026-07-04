import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { ShieldAlert, Trash2, Eye, EyeOff } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  
  // Fire Employee states
  const [emailToFire, setEmailToFire] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fireSuccess, setFireSuccess] = useState('');
  const [fireError, setFireError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFireEmployee = async (e) => {
    e.preventDefault();
    setFireError('');
    setFireSuccess('');
    
    if (!window.confirm('WARNING: Are you absolutely sure you want to terminate this employee? All profiles, salary history, attendance records, and bank information will be permanently deleted.')) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await employeeAPI.fireEmployee(emailToFire, adminPassword);
      setFireSuccess(data.message || 'Employee terminated successfully.');
      setEmailToFire('');
      setAdminPassword('');
    } catch (err) {
      setFireError(err.response?.data?.message || 'Failed to terminate employee.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <main className="page-container">
          <div className="settings-header">
            <h1 className="dashboard-title">System Settings</h1>
            <p className="dashboard-subtitle">Configure application options, notification preferences, and employee terminations</p>
          </div>

          <div className="settings-grid">
            
            {/* General Settings card */}
            <div className="settings-card premium-card">
              <h2 className="settings-section-title">General Preferences</h2>
              <div className="settings-form">
                <div className="form-group-row">
                  <label className="premium-label">System Theme</label>
                  <select className="premium-input select-dark" defaultValue="violet-dark">
                    <option value="violet-dark">Deep Violet Dark Mode (Active)</option>
                    <option value="light">Light Mode</option>
                  </select>
                </div>
                <div className="form-group-row">
                  <label className="premium-label">Email Notification Alerts</label>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group-row">
                  <label className="premium-label">Auto-generate Payslips on 1st of month</label>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Admin-Only Terminations Card */}
            {isAdmin && (
              <div className="settings-card premium-card danger-card">
                <div className="danger-card-header">
                  <Trash2 className="danger-icon" size={24} />
                  <h2 className="settings-section-title danger-title">Employee Termination Center</h2>
                </div>
                <p className="danger-warning-text">
                  This console allows administrative leads to permanently delete and deactivate employee files. 
                  Performing this operation automatically cascade-deletes all bank records, attendance logs, 
                  generated payslip PDFs, and pending leave applications.
                </p>

                {fireSuccess && (
                  <div className="auth-success-banner" style={{ marginBottom: '16px' }}>
                    <span>{fireSuccess}</span>
                  </div>
                )}

                {fireError && (
                  <div className="auth-error-banner" style={{ marginBottom: '16px' }}>
                    <ShieldAlert size={18} />
                    <span>{fireError}</span>
                  </div>
                )}

                <form onSubmit={handleFireEmployee} className="termination-form">
                  <div className="form-group">
                    <label className="premium-label">Employee Corporate Email</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. employee@company.com"
                      value={emailToFire}
                      onChange={(e) => setEmailToFire(e.target.value)}
                      className="premium-input danger-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="premium-label">Confirm Admin Password</label>
                    <div className="password-input-container">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        required 
                        placeholder="••••••••"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="premium-input danger-input password-input-field"
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

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-danger-action"
                  >
                    {loading ? 'Processing deactivation...' : 'Execute Permanent Deactivation'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
