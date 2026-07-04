import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, employeeAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Clock, Play, Square, Award, Percent } from 'lucide-react';
import './AttendanceLog.css';

const AttendanceLog = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clockStatus, setClockStatus] = useState({
    clockedIn: false,
    clockedOut: false,
    clockInTime: '',
    clockOutTime: ''
  });

  // Admin filter states
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterDesig, setFilterDesig] = useState('');
  const [employeesList, setEmployeesList] = useState([]);

  // Dynamic filter options
  const [deptOptions, setDeptOptions] = useState([]);
  const [desigOptions, setDesigOptions] = useState([]);

  // Employee filter states
  const [filterStatus, setFilterStatus] = useState('');

  const [bannerMsg, setBannerMsg] = useState({ type: '', text: '' });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      if (user?.role === 'admin') {
        // Fetch all attendance for admin
        const { data } = await attendanceAPI.getAllAttendance(
          filterDate || undefined, 
          filterUser || undefined,
          filterDept || undefined,
          filterDesig || undefined
        );
        setRecords(data.data);

        // Fetch employee list for selector filter
        const { data: empData } = await employeeAPI.getEmployees();
        setEmployeesList(empData.data);
      } else {
        // Fetch own attendance for employee
        const { data } = await attendanceAPI.getMyAttendance(filterStatus || undefined);
        setRecords(data.data);

        // Check if employee has clocked in today (using local timezone date string)
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const todayRecord = data.data.find(r => r.date.split('T')[0] === todayStr);
        if (todayRecord) {
          setClockStatus({
            clockedIn: true,
            clockedOut: !!todayRecord.clock_out,
            clockInTime: todayRecord.clock_in,
            clockOutTime: todayRecord.clock_out || ''
          });
        } else {
          setClockStatus({
            clockedIn: false,
            clockedOut: false,
            clockInTime: '',
            clockOutTime: ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to load attendance logs:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const { data } = await employeeAPI.getFilterMetadata();
      setDeptOptions(data.data.departments || []);
      setDesigOptions(data.data.designations || []);
    } catch (error) {
      console.error('Failed to fetch list metadata:', error.message);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchMetadata();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user, filterDate, filterUser, filterDept, filterDesig, filterStatus]);

  const handleClockIn = async () => {
    setBannerMsg({ type: '', text: '' });
    try {
      const { data } = await attendanceAPI.clockIn();
      setClockStatus(prev => ({
        ...prev,
        clockedIn: true,
        clockInTime: data.data.clock_in
      }));
      setBannerMsg({ 
        type: 'success', 
        text: `Clocked in successfully at ${data.data.clock_in}. Shift Status: ${data.data.status.toUpperCase()}` 
      });
      fetchAttendance();
    } catch (error) {
      setBannerMsg({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Clock in failed.' 
      });
    }
  };

  const handleClockOut = async () => {
    setBannerMsg({ type: '', text: '' });
    try {
      const { data } = await attendanceAPI.clockOut();
      setClockStatus(prev => ({
        ...prev,
        clockedOut: true,
        clockOutTime: data.data.clock_out
      }));
      setBannerMsg({ 
        type: 'success', 
        text: `Clocked out successfully at ${data.data.clock_out}. Total hours: ${data.data.working_hours} (${data.data.status.toUpperCase()})` 
      });
      fetchAttendance();
    } catch (error) {
      setBannerMsg({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Clock out failed.' 
      });
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <main className="page-container">
          <div className="attendance-header">
            <h1 className="dashboard-title">Attendance Tracking</h1>
            <p className="dashboard-subtitle">Log work hours, track shifts, and monitor logs</p>
          </div>

          {/* Clock Console Banner */}
          {bannerMsg.text && (
            <div className={`attendance-banner ${bannerMsg.type}`}>
              <span>{bannerMsg.text}</span>
            </div>
          )}

          {/* Clock Console (Employee View) */}
          {user?.role === 'employee' && (
            <div className="clock-console premium-card">
              <div className="clock-console-left">
                <div className="clock-icon-glow">
                  <Clock size={32} className="clock-bounce" />
                </div>
                <div>
                  <h3 className="clock-console-title">Daily Shift Console</h3>
                  <p className="clock-console-subtitle">
                    Today is {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="clock-console-actions">
                <button 
                  className="btn-primary clock-btn-in" 
                  disabled={clockStatus.clockedIn}
                  onClick={handleClockIn}
                >
                  <Play size={16} />
                  <span>Clock In</span>
                </button>
                
                <button 
                  className="btn-secondary clock-btn-out"
                  disabled={!clockStatus.clockedIn || clockStatus.clockedOut}
                  onClick={handleClockOut}
                >
                  <Square size={16} />
                  <span>Clock Out</span>
                </button>
              </div>

              <div className="clock-console-status">
                <div className="status-marker">
                  <span className="status-label">Clock In</span>
                  <span className="status-val">{clockStatus.clockInTime || '--:--'}</span>
                </div>
                <div className="status-divider"></div>
                <div className="status-marker">
                  <span className="status-label">Clock Out</span>
                  <span className="status-val">{clockStatus.clockOutTime || '--:--'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Employee stats cards matching screenshot */}
          {user?.role === 'employee' && (
            <div className="attendance-stats-row">
              <div className="stats-metric-card premium-card">
                <div className="metric-icon green">
                  <Percent size={20} />
                </div>
                <div>
                  <span className="metric-label">Attendance Rate</span>
                  <h3 className="metric-value">98.2%</h3>
                  <span className="metric-sub">+1.4% from last month</span>
                </div>
              </div>
              <div className="stats-metric-card premium-card">
                <div className="metric-icon purple">
                  <Award size={20} />
                </div>
                <div>
                  <span className="metric-label">Performance Core</span>
                  <h3 className="metric-value">{user?.performance_rating || '5.0'} / 5</h3>
                  <span className="metric-sub">Top Tier rating</span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Log list */}
          <div className="attendance-log-section">
            <div className="log-section-header">
              <h2 className="section-title">Attendance Activity Overview</h2>
              
              {/* Admin filters */}
              {user?.role === 'admin' && (
                <div className="admin-filters-row">
                  <div className="filter-group">
                    <input 
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="premium-input filter-input"
                    />
                  </div>
                  <div className="filter-group">
                    <select
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="premium-input filter-input select-dark"
                    >
                      <option value="">All Employees</option>
                      {employeesList.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <select
                      value={filterDept}
                      onChange={(e) => setFilterDept(e.target.value)}
                      className="premium-input filter-input select-dark"
                    >
                      <option value="">All Departments</option>
                      {deptOptions.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <select
                      value={filterDesig}
                      onChange={(e) => setFilterDesig(e.target.value)}
                      className="premium-input filter-input select-dark"
                    >
                      <option value="">All Roles</option>
                      {desigOptions.map((desig, index) => (
                        <option key={index} value={desig}>{desig}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Employee filters */}
              {user?.role === 'employee' && (
                <div className="admin-filters-row">
                  <div className="filter-group">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="premium-input filter-input select-dark"
                    >
                      <option value="">All Statuses</option>
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="half-day">Half-Day</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {loading ? (
              <div className="dashboard-loader">Loading attendance records...</div>
            ) : records.length === 0 ? (
              <div className="dashboard-empty-banner">
                No attendance logs found matching filters.
              </div>
            ) : (
              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      {user?.role === 'admin' && <th>Employee</th>}
                      {user?.role === 'admin' && <th>Department</th>}
                      {user?.role === 'admin' && <th>Designation</th>}
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                      <th>Working Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec) => (
                      <tr key={rec.id}>
                        {user?.role === 'admin' && (
                          <td>
                            <div className="table-emp-cell">
                              <strong>{rec.employee_name}</strong>
                              <span className="text-muted" style={{ fontSize: '11px' }}>{rec.employee_email}</span>
                            </div>
                          </td>
                        )}
                        {user?.role === 'admin' && <td>{rec.department || 'N/A'}</td>}
                        {user?.role === 'admin' && <td>{rec.designation || 'N/A'}</td>}
                        <td>{new Date(rec.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>{rec.clock_in}</td>
                        <td>{rec.clock_out || 'Active / Not Checked Out'}</td>
                        <td>
                          <span className={`badge ${
                            rec.status === 'present' ? 'badge-success' : 
                            rec.status === 'late' ? 'badge-warning' : 
                            rec.status === 'half-day' ? 'badge-danger' : 'badge-info'
                          }`}>
                            {rec.status}
                          </span>
                        </td>
                        <td>{rec.working_hours !== null ? `${rec.working_hours} hrs` : '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AttendanceLog;
