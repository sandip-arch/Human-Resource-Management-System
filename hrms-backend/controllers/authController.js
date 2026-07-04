const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateEmpId } = require('../utils/empIdGenerator');

// @desc    Register a new user (employee)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { name, email, password, role = 'employee' } = req.body;

  try {
    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // 2. Check if email is already registered
    const [existingUser] = await pool.query('SELECT emp_id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // 3. Setup approval status
    // If first user, auto-approve as admin. Otherwise default status
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    let finalStatus = 'pending';
    if (userCount[0].count === 0 && role === 'admin') {
      finalStatus = 'approved';
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Auto-generate Employee ID
    const today = new Date();
    const empId = await generateEmpId(name, today);

    // 6. Insert user
    await pool.query(
      'INSERT INTO users (emp_id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [empId, name, email, hashedPassword, role, finalStatus]
    );

    // 7. Initialize empty employee profile & bank details
    await pool.query(
      'INSERT INTO employee_profiles (user_id, basic_pay, joining_date) VALUES (?, ?, ?)',
      [empId, 0.00, today]
    );

    await pool.query(
      'INSERT INTO bank_details (user_id) VALUES (?)',
      [empId]
    );

    res.status(201).json({
      success: true,
      message: role === 'admin' 
        ? 'Admin registered and approved successfully.' 
        : `Employee registered successfully. Pending admin approval. Generated Employee ID: ${empId}`,
      data: {
        id: empId,
        name,
        email,
        role,
        status: finalStatus
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { emailOrEmpId, password } = req.body;

  try {
    // 1. Validation
    if (!emailOrEmpId || !password) {
      return res.status(400).json({ success: false, message: 'Email/Employee ID and password are required' });
    }

    // 2. Fetch user by email OR employee ID
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR emp_id = ?', 
      [emailOrEmpId, emailOrEmpId]
    );
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 4. Check approval status
    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please contact the administrator.'
      });
    }

    // 5. Generate JWT token (using emp_id as id)
    const token = jwt.sign(
      { id: user.emp_id, role: user.role },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const [profile] = await pool.query(
      `SELECT u.emp_id as id, u.name, u.email, u.role, u.status, u.created_at,
              ep.phone, ep.department, ep.designation, ep.joining_date, ep.basic_pay,
              ep.about, ep.skills, ep.certifications, ep.performance_rating,
              bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number, bd.uan_number, bd.status AS bank_status
       FROM users u
       LEFT JOIN employee_profiles ep ON u.emp_id = ep.user_id
       LEFT JOIN bank_details bd ON u.emp_id = bd.user_id
       WHERE u.emp_id = ?`,
      [req.user.id]
    );

    if (profile.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.status(200).json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
