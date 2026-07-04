const pool = require('../config/db');

// Helper to format date consistently as YYYY-MM-DD local time
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get local time string as HH:MM:SS
const getCurrentTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Helper to parse time string safely and prevent NaN errors
const parseTimeStringToDate = (timeStr) => {
  if (!timeStr) return new Date(2000, 0, 1, 0, 0, 0);
  const parts = String(timeStr).split(':');
  const h = parseInt(parts[0] || 0, 10);
  const m = parseInt(parts[1] || 0, 10);
  const s = parseInt(parts[2] || 0, 10);
  return new Date(2000, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, isNaN(s) ? 0 : s);
};

// @desc    Clock In for today
// @route   POST /api/attendance/clock-in
// @access  Private
const clockIn = async (req, res, next) => {
  const userId = req.user.id;
  const today = getTodayDateString();
  const timeNow = getCurrentTimeString();

  try {
    // 1. Check if user already clocked in today
    const [existing] = await pool.query(
      'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked in today.'
      });
    }

    // 2. Determine shift status
    // Shift starts at 9:30 AM. If clock-in is past 9:30:00, status is "late"
    const [h, m] = timeNow.split(':').map(Number);
    let status = 'present';
    if (h > 9 || (h === 9 && m > 30)) {
      status = 'late';
    }

    // 3. Insert record
    await pool.query(
      'INSERT INTO attendance (user_id, date, clock_in, status) VALUES (?, ?, ?, ?)',
      [userId, today, timeNow, status]
    );

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      data: {
        date: today,
        clock_in: timeNow,
        status
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Clock Out for today
// @route   POST /api/attendance/clock-out
// @access  Private
const clockOut = async (req, res, next) => {
  const userId = req.user.id;
  const today = getTodayDateString();
  const timeNow = getCurrentTimeString();

  try {
    // Check if clocked in today
    const [records] = await pool.query(
      'SELECT id, clock_in, clock_out, status FROM attendance WHERE user_id = ? AND date = ?',
      [userId, today]
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You must clock in first before clocking out.'
      });
    }

    const record = records[0];

    if (record.clock_out) {
      return res.status(400).json({
        success: false,
        message: 'You have already clocked out today.',
        clock_out: record.clock_out
      });
    }

    // Calculate working hours safely using robust date parser
    const inDate = parseTimeStringToDate(record.clock_in);
    const outDate = parseTimeStringToDate(timeNow);
    
    // Total hours as a decimal
    let workingHours = parseFloat(((outDate - inDate) / 1000 / 3600).toFixed(2));
    if (isNaN(workingHours) || workingHours < 0) {
      workingHours = 0.00;
    }

    // If working hours < 4, it is marked as a half-day
    let finalStatus = record.status; // Keep "late" or "present" unless it is a half-day
    if (workingHours < 4.0) {
      finalStatus = 'half-day';
    }

    await pool.query(
      `UPDATE attendance 
       SET clock_out = ?, status = ?, working_hours = ? 
       WHERE id = ?`,
      [timeNow, finalStatus, workingHours, record.id]
    );

    res.status(200).json({
      success: true,
      message: 'Clocked out successfully',
      data: {
        clock_out: timeNow,
        working_hours: workingHours,
        status: finalStatus
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's attendance records
// @route   GET /api/attendance/my-records
// @access  Private
const getMyAttendance = async (req, res, next) => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    let query = "SELECT id, DATE_FORMAT(date, '%Y-%m-%d') as date, clock_in, clock_out, status, working_hours FROM attendance WHERE user_id = ?";
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY date DESC';

    const [records] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance records (Admin only)
// @route   GET /api/attendance/all
// @access  Private (Admin Only)
const getAllAttendance = async (req, res, next) => {
  const { date, user_id, department, designation } = req.query;

  try {
    let query = `
      SELECT a.id, DATE_FORMAT(a.date, '%Y-%m-%d') as date, a.clock_in, a.clock_out, a.status, a.working_hours,
             u.name as employee_name, u.email as employee_email,
             ep.department, ep.designation
      FROM attendance a
      JOIN users u ON a.user_id = u.emp_id
      LEFT JOIN employee_profiles ep ON u.emp_id = ep.user_id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      query += ' AND a.date = ?';
      params.push(date);
    }

    if (user_id) {
      query += ' AND a.user_id = ?';
      params.push(user_id);
    }

    if (department) {
      query += ' AND ep.department = ?';
      params.push(department);
    }

    if (designation) {
      query += ' AND ep.designation = ?';
      params.push(designation);
    }

    query += ' ORDER BY a.date DESC, a.clock_in DESC';

    const [records] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance
};
