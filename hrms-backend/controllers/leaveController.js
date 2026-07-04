const pool = require('../config/db');

// @desc    Apply for a leave
// @route   POST /api/leaves/apply
// @access  Private
const applyLeave = async (req, res, next) => {
  const userId = req.user.id;
  const { leave_type, from_date, to_date, reason } = req.body;

  try {
    // 1. Validation
    if (!leave_type || !from_date || !to_date) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, from date, and to date are required.'
      });
    }

    const validTypes = ['casual', 'sick', 'lop', 'other'];
    if (!validTypes.includes(leave_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leave type. Must be: casual, sick, lop, or other.'
      });
    }

    // Ensure from_date is before or equal to to_date
    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be after To date.'
      });
    }

    // 2. Insert leave request
    const [result] = await pool.query(
      `INSERT INTO leaves (user_id, leave_type, from_date, to_date, reason, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, leave_type, from_date, to_date, reason || null]
    );

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: {
        id: result.insertId,
        user_id: userId,
        leave_type,
        from_date,
        to_date,
        reason,
        status: 'pending'
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's leave requests
// @route   GET /api/leaves/my-leaves
// @access  Private
const getMyLeaves = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const [leaves] = await pool.query(
      'SELECT id, leave_type, from_date, to_date, reason, status, created_at FROM leaves WHERE user_id = ? ORDER BY from_date DESC',
      [userId]
    );

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending leave requests (Admin Only)
// @route   GET /api/leaves/pending
// @access  Private (Admin Only)
const getPendingLeaves = async (req, res, next) => {
  try {
    const [leaves] = await pool.query(
      `SELECT l.id, l.user_id, l.leave_type, l.from_date, l.to_date, l.reason, l.status, l.created_at,
              u.name as employee_name, u.email as employee_email
       FROM leaves l
       JOIN users u ON l.user_id = u.emp_id
       WHERE l.status = 'pending'
       ORDER BY l.created_at ASC`
    );

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject a leave request (Admin Only)
// @route   PUT /api/leaves/:id/status
// @access  Private (Admin Only)
const updateLeaveStatus = async (req, res, next) => {
  const leaveId = req.params.id;
  const { status } = req.body; // approved or rejected

  try {
    // 1. Validation
    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return res.status(400).json({
        success: false,
        message: 'Status is required and must be either "approved" or "rejected".'
      });
    }

    // 2. Check if leave request exists
    const [leaves] = await pool.query('SELECT id, status FROM leaves WHERE id = ?', [leaveId]);
    if (leaves.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    const leave = leaves[0];
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave request has already been processed as ${leave.status}.`
      });
    }

    // 3. Update status
    await pool.query('UPDATE leaves SET status = ? WHERE id = ?', [status, leaveId]);

    res.status(200).json({
      success: true,
      message: `Leave request status updated to ${status} successfully.`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get all approved leaves for calendar view (Private)
// @route   GET /api/leaves/calendar
// @access  Private
const getLeavesCalendar = async (req, res, next) => {
  try {
    const [leaves] = await pool.query(
      `SELECT l.id, l.user_id, l.leave_type, l.from_date, l.to_date, l.status,
              u.name as employee_name
       FROM leaves l
       JOIN users u ON l.user_id = u.emp_id
       WHERE l.status = 'approved'
       ORDER BY l.from_date ASC`
    );

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get holidays list
// @route   GET /api/leaves/holidays
// @access  Private
const getHolidays = async (req, res, next) => {
  try {
    const [holidays] = await pool.query('SELECT id, name, date FROM holidays ORDER BY date ASC');
    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a holiday (Admin Only)
// @route   POST /api/leaves/holidays
// @access  Private (Admin Only)
const addHoliday = async (req, res, next) => {
  const { name, date } = req.body;

  try {
    if (!name || !date) {
      return res.status(400).json({ success: false, message: 'Holiday name and date are required.' });
    }

    // Check if holiday already exists on this date
    const [existing] = await pool.query('SELECT id FROM holidays WHERE date = ?', [date]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'A holiday already exists on this date.' });
    }

    const [result] = await pool.query('INSERT INTO holidays (name, date) VALUES (?, ?)', [name, date]);

    res.status(201).json({
      success: true,
      message: 'Holiday added successfully',
      data: {
        id: result.insertId,
        name,
        date
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  updateLeaveStatus,
  getLeavesCalendar,
  getHolidays,
  addHoliday
};
