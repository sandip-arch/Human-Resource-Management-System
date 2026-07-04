import React, { useState, useEffect } from 'react';
import { leaveAPI, employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Gift, Calendar as CalendarIcon, Upload, Send, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import './LeavesManagement.css';

const LeavesManagement = () => {
  const { user } = useAuth();

  // Data States
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [leaveType, setLeaveType] = useState('casual'); // 'casual', 'sick', 'lop'
  const [fromDate, setFromDate] = useState('2026-07-04');
  const [toDate, setToDate] = useState('2026-07-06');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Holiday Addition States
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      // Fetch holidays
      const { data: holData } = await leaveAPI.getHolidays();
      setHolidays(holData.data);

      if (user?.role === 'admin') {
        const { data: pendData } = await leaveAPI.getPendingLeaves();
        setLeaves(pendData.data);
      } else {
        const { data: myData } = await leaveAPI.getMyLeaves();
        setLeaves(myData.data);
      }
    } catch (error) {
      console.error('Failed to load leave logs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaveData();
    }
  }, [user]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        reason
      };

      await leaveAPI.applyLeave(payload);
      setSuccessMsg('Leave request submitted successfully! Pending approval.');
      setReason('');
      fetchLeaveData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit leave.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessLeave = async (id, status) => {
    try {
      await leaveAPI.updateLeaveStatus(id, status);
      fetchLeaveData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.addHoliday({ name: holidayName, date: holidayDate });
      setHolidayName('');
      setHolidayDate('');
      fetchLeaveData();
      alert('Holiday scheduled successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add holiday.');
    }
  };

  // Helper to calculate days between two dates
  const calculateDays = (start, end) => {
    const diffTime = Math.abs(new Date(end) - new Date(start));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
    return isNaN(diffDays) ? 0 : diffDays;
  };

  // Custom static October 2026 Calendar generation logic (for UI matching screenshot)
  const getOctoberCalendarDays = () => {
    // October 2026 starts on Thursday
    // Days list from 1 to 31
    const padding = 3; // September padding days
    const totalDays = 31;
    const days = [];

    // Add September empty block pads
    for (let i = 28; i <= 30; i++) {
      days.push({ dayNum: i, isCurrentMonth: false });
    }

    // Add October days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ dayNum: i, isCurrentMonth: true, dateStr: `2026-10-${String(i).padStart(2, '0')}` });
    }

    // Add November pads
    for (let i = 1; i <= 8; i++) {
      days.push({ dayNum: i, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = getOctoberCalendarDays();

  // Helper to determine if a date is highlighted as a selected range in October 2026 calendar
  const isDateSelectedInRange = (dateStr) => {
    if (!dateStr) return false;
    const startStr = fromDate;
    const endStr = toDate;
    const current = new Date(dateStr);
    return current >= new Date(startStr) && current <= new Date(endStr);
  };

  const isBoundaryDate = (dateStr) => {
    return dateStr === fromDate || dateStr === toDate;
  };

  // Helper to determine if date is holiday
  const isHolidayDate = (dateStr) => {
    return holidays.some(h => h.date.split('T')[0] === dateStr);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <main className="page-container">
          <div className="leaves-header">
            <h1 className="dashboard-title">Time Off Management</h1>
            <p className="dashboard-subtitle">Apply, approve, and track employee leave requests and corporate holidays</p>
          </div>

          {/* Top Panel: Form (left) + Calendar (right) */}
          {user?.role === 'employee' && (
            <div className="leaves-request-portal">
              
              {/* Left Panel: Request Configuration */}
              <div className="request-config-card premium-card">
                <h2 className="config-title">Time off Type Request</h2>
                <p className="config-sub">Configure your request details below.</p>

                <div className="config-employee-badge">
                  <span>EMPLOYEE</span>
                  <strong>{user?.name}</strong>
                </div>

                {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}
                {successMsg && <div className="auth-success-banner">{successMsg}</div>}

                <form onSubmit={handleApplyLeave} className="request-form">
                  <div className="form-group">
                    <label className="premium-label">TIME OFF TYPE</label>
                    <div className="timeoff-selectors-column">
                      <div 
                        className={`timeoff-option-card ${leaveType === 'casual' ? 'active' : ''}`}
                        onClick={() => setLeaveType('casual')}
                      >
                        <div className="checkbox-glow">
                          {leaveType === 'casual' && <span className="checked-dot"></span>}
                        </div>
                        <span>Paid Time Off (Casual)</span>
                      </div>

                      <div 
                        className={`timeoff-option-card ${leaveType === 'sick' ? 'active' : ''}`}
                        onClick={() => setLeaveType('sick')}
                      >
                        <div className="checkbox-glow">
                          {leaveType === 'sick' && <span className="checked-dot"></span>}
                        </div>
                        <span>Sick Leave</span>
                      </div>

                      <div 
                        className={`timeoff-option-card ${leaveType === 'lop' ? 'active' : ''}`}
                        onClick={() => setLeaveType('lop')}
                      >
                        <div className="checkbox-glow">
                          {leaveType === 'lop' && <span className="checked-dot"></span>}
                        </div>
                        <span>Unpaid Leaves (LOP)</span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-form-row">
                    <div className="form-group flex-1">
                      <label className="premium-label">From Date</label>
                      <input 
                        type="date" 
                        required
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="premium-input"
                      />
                    </div>
                    <div className="form-group flex-1">
                      <label className="premium-label">To Date</label>
                      <input 
                        type="date" 
                        required
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="premium-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="premium-label">REASON / REMARKS</label>
                    <input 
                      type="text"
                      placeholder="Enter brief description"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div className="config-summary-row">
                    <div className="config-metric">
                      <span className="metric-lbl">VALIDITY PERIOD</span>
                      <span className="metric-val-txt">
                        {new Date(fromDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} To{' '}
                        {new Date(toDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="config-metric">
                      <span className="metric-lbl">ALLOCATION</span>
                      <span className="metric-days">{calculateDays(fromDate, toDate).toFixed(2)} Days</span>
                    </div>
                  </div>

                  <div className="attachment-box">
                    <Upload size={18} />
                    <span>Upload Attachment (e.g. sick leave certificate)</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary request-submit-btn"
                    disabled={submitting}
                  >
                    <Send size={14} style={{ marginRight: '8px' }} />
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              </div>

              {/* Right Panel: Sleek Custom Calendar View */}
              <div className="custom-calendar-card premium-card">
                <div className="calendar-card-header">
                  <h3 className="calendar-month-title">October 2026</h3>
                  <div className="calendar-nav-arrows">
                    <span>&lt;</span>
                    <span>&gt;</span>
                  </div>
                </div>

                <div className="calendar-weeks-header">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                  <span>SUN</span>
                </div>

                <div className="calendar-days-grid">
                  {calendarDays.map((day, index) => {
                    const isSelected = day.isCurrentMonth && isDateSelectedInRange(day.dateStr);
                    const isBoundary = day.isCurrentMonth && isBoundaryDate(day.dateStr);
                    const isHoliday = day.isCurrentMonth && isHolidayDate(day.dateStr);
                    const isToday = day.dayNum === 4 && day.isCurrentMonth; // mock today

                    let classes = 'calendar-day';
                    if (!day.isCurrentMonth) classes += ' pad-day';
                    if (isSelected) classes += ' range-selected';
                    if (isBoundary) classes += ' boundary-highlight';
                    if (isHoliday) classes += ' holiday-highlight';
                    if (isToday) classes += ' today-highlight';

                    return (
                      <div 
                        key={index} 
                        className={classes}
                        onClick={() => {
                          if (day.isCurrentMonth && day.dateStr) {
                            setFromDate(day.dateStr);
                          }
                        }}
                      >
                        <span>{day.dayNum}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="calendar-legend">
                  <div className="legend-item">
                    <span className="legend-dot selected"></span>
                    <span>Selected Dates</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot holiday"></span>
                    <span>Company Holiday</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot today"></span>
                    <span>Today</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Leaves Status and Schedules Overview Section */}
          <div className="leaves-schedules-split">
            
            {/* Left/Main Column: Time Off requests */}
            <div className="leaves-log-main flex-1">
              <h2 className="section-title">
                {user?.role === 'admin' ? 'Time Off Management Tasks' : 'Your Leave Applications'}
              </h2>
              
              {loading ? (
                <div className="dashboard-loader">Loading leave requests...</div>
              ) : leaves.length === 0 ? (
                <div className="dashboard-empty-banner">No leave requests found.</div>
              ) : (
                <div className="premium-table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        {user?.role === 'admin' && <th>Employee</th>}
                        <th>Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Status</th>
                        {user?.role === 'admin' && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => (
                        <tr key={leave.id}>
                          {user?.role === 'admin' && (
                            <td>
                              <div className="table-emp-cell">
                                <strong>{leave.employee_name}</strong>
                                <span className="text-muted" style={{ fontSize: '11px' }}>{leave.employee_email}</span>
                              </div>
                            </td>
                          )}
                          <td style={{ textTransform: 'capitalize' }}>{leave.leave_type}</td>
                          <td>{new Date(leave.from_date).toLocaleDateString()}</td>
                          <td>{new Date(leave.to_date).toLocaleDateString()}</td>
                          <td>{leave.reason || 'N/A'}</td>
                          <td>
                            <span className={`badge ${
                              leave.status === 'approved' ? 'badge-success' : 
                              leave.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                            }`}>
                              {leave.status}
                            </span>
                          </td>
                          {user?.role === 'admin' && (
                            <td>
                              {leave.status === 'pending' ? (
                                <div className="leave-action-btns">
                                  <button 
                                    className="badge badge-success action-badge-btn"
                                    onClick={() => handleProcessLeave(leave.id, 'approved')}
                                  >
                                    <Check size={12} />
                                    Approve
                                  </button>
                                  <button 
                                    className="badge badge-danger action-badge-btn"
                                    onClick={() => handleProcessLeave(leave.id, 'rejected')}
                                  >
                                    <X size={12} />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">Processed</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Sidebar Column: Holiday scheduler & Note */}
            <div className="leaves-log-sidebar">
              <div className="sidebar-about-card premium-card">
                <h3 className="sidebar-card-title">Leave Policies</h3>
                <div className="leave-policy-note">
                  <ShieldAlert size={20} className="policy-icon" />
                  <p className="policy-text">
                    "Employees can view only their own time off records, while Admins and HR Officers can view time off records & approve/reject them for all employees."
                  </p>
                </div>
              </div>

              {/* Admin Holiday Scheduler */}
              {user?.role === 'admin' && (
                <div className="sidebar-about-card premium-card">
                  <h3 className="sidebar-card-title">Schedule Holiday</h3>
                  <form onSubmit={handleAddHoliday} className="holiday-form">
                    <div className="form-group">
                      <label className="premium-label">Holiday Name</label>
                      <input 
                        type="text"
                        required
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        className="premium-input"
                        placeholder="e.g. Diwali"
                      />
                    </div>
                    <div className="form-group">
                      <label className="premium-label">Date</label>
                      <input 
                        type="date"
                        required
                        value={holidayDate}
                        onChange={(e) => setHolidayDate(e.target.value)}
                        className="premium-input"
                      />
                    </div>
                    <button type="submit" className="btn-primary btn-sm-table" style={{ width: '100%' }}>
                      Schedule Holiday
                    </button>
                  </form>
                </div>
              )}

              {/* Holiday list card */}
              <div className="sidebar-about-card premium-card">
                <h3 className="sidebar-card-title">Corporate Holidays</h3>
                {holidays.length === 0 ? (
                  <span className="text-muted" style={{ fontSize: '12px' }}>No scheduled holidays.</span>
                ) : (
                  <div className="holiday-logs">
                    {holidays.map(h => (
                      <div key={h.id} className="holiday-log-item">
                        <Sparkles size={14} className="holiday-icon-spark" />
                        <div>
                          <strong className="holiday-log-name">{h.name}</strong>
                          <span className="holiday-log-date">{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default LeavesManagement;
