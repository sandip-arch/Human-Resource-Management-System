import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Mail, Phone, MapPin, Building, Award, Briefcase, Star, Edit, Eye, EyeOff } from 'lucide-react';
import './ProfileDetail.css';

const ProfileDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('private');

  // Security Form States (Change Password)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  // Bank Form States (Admin Only)
  const [bankName, setBankName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pan, setPan] = useState('');
  const [uan, setUan] = useState('');
  const [bankEditMsg, setBankEditMsg] = useState({ type: '', text: '' });
  const [savingBank, setSavingBank] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Rating States (Admin Only)
  const [rating, setRating] = useState('5.0');
  const [ratingMsg, setRatingMsg] = useState('');
  const [savingRating, setSavingRating] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await employeeAPI.getEmployeeById(id);
      const prof = data.data;
      setProfile(prof);
      setPhoneInput(prof.phone || '');
      setRating(String(prof.performance_rating || '5.0'));
      
      // Initialize bank details form
      setBankName(prof.bank_name || '');
      setAccNum(prof.account_number || '');
      setIfsc(prof.ifsc_code || '');
      setPan(prof.pan_number || '');
      setUan(prof.uan_number || '');
    } catch (error) {
      console.error('Failed to fetch employee details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setUpdating(true);

    if (password && password !== confirmPassword) {
      setUpdateError('Passwords do not match.');
      setUpdating(false);
      return;
    }

    try {
      const payload = {};
      if (phoneInput) payload.phone = phoneInput;
      if (password) payload.password = password;

      if (parseInt(id) === currentUser?.id) {
        await employeeAPI.updateProfile(payload);
      } else if (currentUser?.role === 'admin') {
        await employeeAPI.adminUpdateEmployee(id, payload);
      }

      setUpdateSuccess('Profile updated successfully.');
      setPassword('');
      setConfirmPassword('');
      fetchProfile();
    } catch (err) {
      setUpdateError(err.response?.data?.message || err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setSavingBank(true);
    setBankEditMsg({ type: '', text: '' });

    try {
      await employeeAPI.updateBankDetails(id, {
        bank_name: bankName,
        account_number: accNum,
        ifsc_code: ifsc,
        pan_number: pan,
        uan_number: uan
      });
      setBankEditMsg({ type: 'success', text: 'Bank details verified and updated successfully.' });
      setIsEditingBank(false);
      fetchProfile();
    } catch (err) {
      setBankEditMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to update bank details.' });
    } finally {
      setSavingBank(false);
    }
  };

  const handleSaveRating = async () => {
    setSavingRating(true);
    setRatingMsg('');

    try {
      await employeeAPI.rateEmployee(id, parseFloat(rating));
      setRatingMsg('Rating updated successfully!');
      fetchProfile();
      setTimeout(() => setRatingMsg(''), 3000);
    } catch (err) {
      setRatingMsg(err.response?.data?.message || 'Failed to save rating.');
    } finally {
      setSavingRating(false);
    }
  };

  // Parse list helpers safely
  const getSkillsList = () => {
    if (!profile || !profile.skills) return [];
    return profile.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const getCertsList = () => {
    if (!profile || !profile.certifications) return [];
    try {
      const parsed = JSON.parse(profile.certifications);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return profile.certifications.split(',').map(c => c.trim()).filter(c => c.length > 0);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="dashboard-loader" style={{ margin: '50px' }}>Loading employee profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Header />
          <div className="dashboard-empty-banner" style={{ margin: '50px' }}>Profile not found.</div>
        </div>
      </div>
    );
  }

  const skills = getSkillsList();
  const certifications = getCertsList();
  const isProfileOwner = currentUser?.id === profile.id;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <main className="page-container">
          {/* Hero Profile Panel */}
          <div className="profile-hero premium-card">
            <div className="profile-hero-content">
              <div className="profile-hero-avatar">
                {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="profile-hero-info">
                <div className="profile-hero-name-row">
                  <h1 className="profile-hero-name">{profile.name}</h1>
                  <span className="badge badge-info">{profile.role.toUpperCase()}</span>
                </div>
                
                <div className="profile-meta-grid">
                  <div className="profile-meta-item">
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>ID: {profile.id}</span>
                  </div>
                  <div className="profile-meta-item">
                    <Briefcase size={16} />
                    <span>{profile.designation || 'Software Engineer'}</span>
                  </div>
                  <div className="profile-meta-item">
                    <Building size={16} />
                    <span>{profile.department || 'Engineering'}</span>
                  </div>
                  <div className="profile-meta-item">
                    <Mail size={16} />
                    <span>{profile.email}</span>
                  </div>
                  <div className="profile-meta-item">
                    <Phone size={16} />
                    <span>{profile.phone || 'No Phone Specified'}</span>
                  </div>
                  <div className="profile-meta-item text-muted">
                    <Star size={16} style={{ color: 'var(--color-warning)' }} />
                    <span>Performance Rating: <strong>{profile.performance_rating || '5.0'} / 5.0</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Split Grid */}
          <div className="profile-split-grid">
            
            {/* Left Content Area (Tabs & Sub-content) */}
            <div className="profile-tab-section">
              <div className="profile-tabs-header">
                <button 
                  className={`profile-tab-btn ${activeTab === 'private' ? 'active' : ''}`}
                  onClick={() => setActiveTab('private')}
                >
                  Private Info & Bank
                </button>
                <button 
                  className={`profile-tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
                  onClick={() => setActiveTab('salary')}
                >
                  Salary Info
                </button>
                <button 
                  className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security Settings
                </button>
              </div>

              <div className="profile-tab-content">
                {activeTab === 'private' && (
                  <div className="private-info-grid">
                    
                    {/* Personal details card */}
                    <div className="info-card premium-card">
                      <h3 className="info-card-title">Personal Details</h3>
                      <div className="info-list">
                        <div className="info-item">
                          <span className="info-label">Date of Birth</span>
                          <span className="info-val">14 May 1994</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Gender</span>
                          <span className="info-val">Female</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Nationality</span>
                          <span className="info-val">Indian</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Personal Email</span>
                          <span className="info-val">{profile.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Joining Date</span>
                          <span className="info-val">
                            {profile.joining_date ? new Date(profile.joining_date).toLocaleDateString() : '01 Jan 2026'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Approval Status</span>
                          <span className="info-val" style={{ textTransform: 'capitalize' }}>{profile.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bank details card (Admin editable) */}
                    <div className="info-card premium-card">
                      <div className="card-header-with-action">
                        <h3 className="info-card-title">Bank Details</h3>
                        {isAdmin && !isEditingBank && (
                          <button 
                            className="btn-secondary btn-icon-only-sm" 
                            onClick={() => setIsEditingBank(true)}
                          >
                            <Edit size={14} />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>

                      {bankEditMsg.text && (
                        <div className={`auth-error-banner ${bankEditMsg.type === 'success' ? 'auth-success-banner' : ''}`} style={{ marginBottom: '15px' }}>
                          <span>{bankEditMsg.text}</span>
                        </div>
                      )}

                      {isAdmin && isEditingBank ? (
                        /* Admin Bank Edit Form */
                        <form onSubmit={handleSaveBankDetails} className="bank-edit-form">
                          <div className="form-group sm-group">
                            <label className="premium-label">Bank Name</label>
                            <input 
                              type="text" 
                              required
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="premium-input"
                            />
                          </div>
                          <div className="form-group sm-group">
                            <label className="premium-label">Account Number</label>
                            <input 
                              type="text" 
                              required
                              value={accNum}
                              onChange={(e) => setAccNum(e.target.value)}
                              className="premium-input"
                            />
                          </div>
                          <div className="form-group sm-group">
                            <label className="premium-label">IFSC Code</label>
                            <input 
                              type="text" 
                              required
                              value={ifsc}
                              onChange={(e) => setIfsc(e.target.value)}
                              className="premium-input"
                            />
                          </div>
                          <div className="form-group sm-group">
                            <label className="premium-label">PAN Number</label>
                            <input 
                              type="text" 
                              required
                              value={pan}
                              onChange={(e) => setPan(e.target.value)}
                              className="premium-input"
                            />
                          </div>
                          <div className="form-group sm-group">
                            <label className="premium-label">UAN Number</label>
                            <input 
                              type="text" 
                              value={uan}
                              onChange={(e) => setUan(e.target.value)}
                              className="premium-input"
                            />
                          </div>
                          <div className="bank-edit-actions">
                            <button 
                              type="button" 
                              className="btn-secondary btn-sm-table"
                              onClick={() => setIsEditingBank(false)}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              disabled={savingBank}
                              className="btn-primary btn-sm-table"
                            >
                              {savingBank ? 'Saving...' : 'Verify & Save'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        /* Read-Only Details */
                        <div className="info-list">
                          <div className="info-item">
                            <span className="info-label">Bank Name</span>
                            <span className="info-val">{profile.bank_name || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Account Number</span>
                            <span className="info-val">{profile.account_number ? `**** **** ${profile.account_number.slice(-4)}` : 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">IFSC Code</span>
                            <span className="info-val">{profile.ifsc_code || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">PAN Number</span>
                            <span className="info-val">{profile.pan_number || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">UAN Number</span>
                            <span className="info-val">{profile.uan_number || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Status</span>
                            <span className="info-val" style={{ 
                              color: profile.bank_status === 'verified' ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {(profile.bank_status || 'unverified').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'salary' && (
                  <div className="info-card premium-card">
                    <h3 className="info-card-title">Base Payroll Breakdown</h3>
                    <div className="info-list">
                      <div className="info-item">
                        <span className="info-label">Basic Monthly Pay</span>
                        <span className="info-val">Rs. {parseFloat(profile.basic_pay || 0).toLocaleString()} /-</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Estimated Gross Earnings</span>
                        <span className="info-val">Rs. {parseFloat(profile.basic_pay * 1.5 || 0).toLocaleString()} /-</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">PF Enrollment</span>
                        <span className="info-val">Yes (Active)</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Tax Category</span>
                        <span className="info-val">TDS Deduction Tier 1</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="info-card premium-card">
                    <h3 className="info-card-title">Update Contact & Security</h3>
                    
                    {updateError && <div className="auth-error-banner" style={{ marginTop: '15px' }}>{updateError}</div>}
                    {updateSuccess && <div className="auth-success-banner" style={{ marginTop: '15px' }}>{updateSuccess}</div>}

                    <form onSubmit={handleUpdateProfile} className="profile-update-form">
                      <div className="form-group">
                        <label className="premium-label">Phone Number</label>
                        <input 
                          type="text" 
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="premium-input"
                          placeholder="e.g. 555-0199"
                        />
                      </div>

                      {(isProfileOwner || isAdmin) && (
                        <>
                          <div className="form-group">
                            <label className="premium-label">Change Password</label>
                            <div className="password-input-container">
                              <input 
                                type={showPwd ? 'text' : 'password'} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="premium-input password-input-field"
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPwd(!showPwd)}
                              >
                                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="premium-label">Confirm New Password</label>
                            <div className="password-input-container">
                              <input 
                                type={showConfirmPwd ? 'text' : 'password'} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="premium-input password-input-field"
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                              >
                                {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      <button 
                        type="submit" 
                        disabled={updating}
                        className="btn-primary profile-submit-btn"
                      >
                        {updating ? 'Updating...' : 'Save Settings'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar Area (Core skills, about, certs, rating) */}
            <div className="profile-about-sidebar">
              
              {/* Performance Rating Controller (Admin Only) */}
              {isAdmin && (
                <div className="sidebar-about-card premium-card performance-rate-card">
                  <h3 className="sidebar-card-title">Rate Performance</h3>
                  {ratingMsg && <div className="auth-success-banner" style={{ marginBottom: '12px', fontSize: '11px', padding: '8px' }}>{ratingMsg}</div>}
                  
                  <div className="form-group">
                    <label className="premium-label">Rating score: <strong>{rating} / 5.0</strong></label>
                    <input 
                      type="range"
                      min="0.0"
                      max="5.0"
                      step="0.1"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="rating-range-slider"
                    />
                  </div>

                  <button 
                    onClick={handleSaveRating}
                    disabled={savingRating}
                    className="btn-primary btn-sm-table"
                    style={{ width: '100%', marginTop: '10px' }}
                  >
                    {savingRating ? 'Updating rating...' : 'Save Rating'}
                  </button>
                </div>
              )}

              <div className="sidebar-about-card premium-card">
                <h3 className="sidebar-card-title">About</h3>
                <p className="sidebar-about-text">
                  {profile.about || "No biography description provided in the system profiles database."}
                </p>
              </div>

              <div className="sidebar-about-card premium-card">
                <h3 className="sidebar-card-title">Core Skills</h3>
                <div className="skills-tag-container">
                  {skills.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: '11px' }}>No skills cataloged.</span>
                  ) : (
                    skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="sidebar-about-card premium-card">
                <h3 className="sidebar-card-title">Certifications</h3>
                <div className="cert-list">
                  {certifications.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: '11px' }}>No credentials registered.</span>
                  ) : (
                    certifications.map((cert, index) => (
                      <div key={index} className="cert-item">
                        <Award size={18} className="cert-icon" />
                        <div>
                          <span className="cert-name">{cert}</span>
                          <span className="cert-meta">Verified Credential</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfileDetail;
