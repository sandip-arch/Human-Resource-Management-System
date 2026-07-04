import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Eye, Check, Search, Calendar, Award, Gift } from 'lucide-react';
import './EmployeeDirectory.css';

const EmployeeDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter states
  const [searchVal, setSearchVal] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterDesig, setFilterDesig] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Dynamic dropdown lists
  const [deptOptions, setDeptOptions] = useState([]);
  const [desigOptions, setDesigOptions] = useState([]);

  // Add Employee Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('employeepassword'); // Default
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-07-04');
  const [basicPay, setBasicPay] = useState('45000');
  const [roleInput, setRoleInput] = useState('employee');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [showAddPwd, setShowAddPwd] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Fetch all employees without strict status filter to show everything in the table
      const { data } = await employeeAPI.getEmployees(
        filterStatus || undefined, 
        filterDept || undefined, 
        filterDesig || undefined
      );
      setEmployees(data.data);
    } catch (error) {
      console.error('Failed to load employees:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const { data } = await employeeAPI.getFilterMetadata();
      const depts = data.data.departments || [];
      const desigs = data.data.designations || [];
      setDeptOptions(depts);
      setDesigOptions(desigs);

      // Default Form states to first dynamic option
      if (depts.length > 0) setDepartment(depts[0]);
      if (desigs.length > 0) setDesignation(desigs[0]);
    } catch (error) {
      console.error('Failed to fetch list metadata:', error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMetadata();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user, filterStatus, filterDept, filterDesig]);

  const handleApprove = async (e, id) => {
    e.stopPropagation();
    try {
      await employeeAPI.approveEmployee(id);
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || 'Approval failed');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAdding(true);
    setModalError('');
    setModalSuccess('');

    try {
      const payload = {
        name,
        email,
        password,
        phone,
        department,
        designation,
        joining_date: joiningDate,
        basic_pay: parseFloat(basicPay),
        role: roleInput
      };

      await employeeAPI.addEmployee(payload);
      setModalSuccess('Employee added successfully!');
      
      fetchEmployees();
      fetchMetadata();
      
      setTimeout(() => {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
      }, 2000);

    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add employee.');
    } finally {
      setAdding(false);
    }
  };

  // Local search filter
  const filteredEmployees = employees.filter(emp => {
    const term = searchVal.toLowerCase();
    const matchName = emp.name.toLowerCase().includes(term);
    const matchId = emp.id.toLowerCase().includes(term);
    return matchName || matchId;
  });

  // Calculate Years for anniversary card
  const getAnniversaries = () => {
    return employees
      .map(emp => {
        const joinDate = new Date(emp.joining_date);
        const years = new Date().getFullYear() - joinDate.getFullYear();
        return { ...emp, years };
      })
      .filter(emp => emp.years > 0)
      .slice(0, 4);
  };

  // Sort by rating for top performers card
  const getTopPerformers = () => {
    return [...employees]
      .sort((a, b) => parseFloat(b.performance_rating || 0) - parseFloat(a.performance_rating || 0))
      .slice(0, 4);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <main className="page-container">
          <div className="directory-header-row">
            <div>
              <h1 className="dashboard-title">Employee Directory</h1>
              <p className="dashboard-subtitle">Manage company staff records, approvals, and details</p>
            </div>
            
            {user?.role === 'admin' && (
              <button 
                className="btn-primary flex-center-btn"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                Add Employee
              </button>
            )}
          </div>

          {/* Premium Search & Filters Row */}
          <div className="directory-search-filters-row premium-card">
            <div className="search-box-wrapper">
              <Search size={18} className="search-icon-inside" />
              <input
                type="text"
                placeholder="search by name, employee ID..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="search-input-field"
              />
            </div>
            
            <div className="filter-select-group">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="premium-input select-dark filter-select"
              >
                <option value="">Department All</option>
                {deptOptions.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={filterDesig}
                onChange={(e) => setFilterDesig(e.target.value)}
                className="premium-input select-dark filter-select"
              >
                <option value="">Designation All</option>
                {desigOptions.map((desig, index) => (
                  <option key={index} value={desig}>{desig}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="premium-input select-dark filter-select"
              >
                <option value="">Status All</option>
                <option value="approved">Active</option>
                <option value="pending">Pending Approval</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loader">Loading directory...</div>
          ) : (
            <>
              {/* Premium Directory Table Card */}
              <div className="premium-table-container directory-table-card">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                          No employees found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr 
                          key={emp.id} 
                          className="table-row-clickable"
                          onClick={() => navigate(`/profile/${emp.id}`)}
                        >
                          <td>
                            <div className="table-emp-cell">
                              <div className="table-emp-avatar">
                                {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div className="table-emp-info">
                                <strong className="emp-name-text">{emp.name}</strong>
                                <span className="emp-email-text">{emp.email}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="emp-id-badge">{emp.id}</span></td>
                          <td>{emp.department || 'N/A'}</td>
                          <td>{emp.designation || 'N/A'}</td>
                          <td>Delhi, India</td>
                          <td>
                            <span className={`badge ${
                              emp.status === 'approved' ? 'badge-success' : 'badge-warning'
                            }`}>
                              {emp.status === 'approved' ? 'Active' : 'Probation'}
                            </span>
                          </td>
                          <td>{new Date(emp.joining_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td>
                            <div className="actions-cell" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="btn-secondary btn-icon-only-sm table-action-btn"
                                onClick={() => navigate(`/profile/${emp.id}`)}
                                title="View Profile"
                              >
                                <Eye size={14} />
                              </button>
                              {user?.role === 'admin' && emp.status === 'pending' && (
                                <button 
                                  className="btn-primary btn-sm-card success-btn approve-btn"
                                  onClick={(e) => handleApprove(e, emp.id)}
                                >
                                  Approve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Anniversary, Birthday and Top Performers cards */}
              <div className="directory-summary-grid">
                
                {/* 1. Working Anniversary */}
                <div className="summary-card premium-card">
                  <div className="summary-card-header">
                    <Calendar size={18} className="summary-icon green" />
                    <h3 className="summary-title">Working Anniversary</h3>
                  </div>
                  <div className="summary-list">
                    {getAnniversaries().length === 0 ? (
                      <div className="summary-empty">No anniversaries this month</div>
                    ) : (
                      getAnniversaries().map(emp => (
                        <div key={emp.id} className="summary-item" onClick={() => navigate(`/profile/${emp.id}`)}>
                          <div className="summary-avatar">
                            {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="summary-info">
                            <strong>{emp.name}</strong>
                            <span>{emp.designation || 'Software Engineer'}</span>
                          </div>
                          <div className="summary-metric">
                            <span className="anniversary-badge">{emp.years} Years</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Upcoming Birthdays */}
                <div className="summary-card premium-card">
                  <div className="summary-card-header">
                    <Gift size={18} className="summary-icon purple" />
                    <h3 className="summary-title">Upcoming Birthdays</h3>
                  </div>
                  <div className="summary-list">
                    {employees.slice(0, 4).map((emp, i) => {
                      const mockDays = [5, 12, 18, 25];
                      const mockMonths = ['May', 'June', 'July', 'August'];
                      const mockInDays = [3, 6, 12, 19];
                      return (
                        <div key={emp.id} className="summary-item" onClick={() => navigate(`/profile/${emp.id}`)}>
                          <div className="summary-avatar">
                            {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className="summary-info">
                            <strong>{emp.name}</strong>
                            <span>{mockDays[i]} {mockMonths[i]}</span>
                          </div>
                          <div className="summary-metric">
                            <span className="birthday-badge">in {mockInDays[i]} days</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Top Performers */}
                <div className="summary-card premium-card">
                  <div className="summary-card-header">
                    <Award size={18} className="summary-icon orange" />
                    <h3 className="summary-title">Top Performers</h3>
                  </div>
                  <div className="summary-list">
                    {getTopPerformers().map(emp => (
                      <div key={emp.id} className="summary-item" onClick={() => navigate(`/profile/${emp.id}`)}>
                        <div className="summary-avatar">
                          {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="summary-info">
                          <strong>{emp.name}</strong>
                          <span>{emp.designation || 'Software Engineer'}</span>
                        </div>
                        <div className="summary-metric">
                          <span className="performance-badge">★ {emp.performance_rating || '5.0'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content premium-card">
            <h3 className="modal-title">Register New Employee</h3>
            <p className="modal-sub">Add staff profiles directly. Accounts are automatically set as active/approved.</p>

            {modalError && <div className="auth-error-banner">{modalError}</div>}
            {modalSuccess && <div className="auth-success-banner">{modalSuccess}</div>}

            <form onSubmit={handleAddEmployee} className="modal-form">
              <div className="modal-form-row">
                <div className="form-group flex-1">
                  <label className="premium-label">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="premium-input"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="premium-label">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="premium-input"
                    placeholder="jane@company.com"
                  />
                </div>
              </div>

              <div className="modal-form-row">
                <div className="form-group flex-1">
                  <label className="premium-label">Password</label>
                  <div className="password-input-container">
                    <input 
                      type={showAddPwd ? 'text' : 'password'} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="premium-input password-input-field"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowAddPwd(!showAddPwd)}
                    >
                      {showAddPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group flex-1">
                  <label className="premium-label">Phone</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="premium-input"
                    placeholder="555-0123"
                  />
                </div>
              </div>

              <div className="modal-form-row">
                <div className="form-group flex-1">
                  <label className="premium-label">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="premium-input select-dark"
                  >
                    {deptOptions.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label className="premium-label">Designation</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="premium-input select-dark"
                  >
                    {desigOptions.map((desig, index) => (
                      <option key={index} value={desig}>{desig}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-form-row">
                <div className="form-group flex-1">
                  <label className="premium-label">Joining Date</label>
                  <input 
                    type="date" 
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="premium-input"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="premium-label">Basic Salary (INR)</label>
                  <input 
                    type="number" 
                    value={basicPay}
                    onChange={(e) => setBasicPay(e.target.value)}
                    className="premium-input"
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="premium-label">Role</label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="premium-input select-dark"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin / HR</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={adding}
                >
                  {adding ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
