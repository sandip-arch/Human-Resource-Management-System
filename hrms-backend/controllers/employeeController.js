const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateEmpId } = require('../utils/empIdGenerator');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private (Admin Only)
const getEmployees = async (req, res, next) => {
  const { status, department, designation } = req.query; // optional filters

  try {
    let query = `
      SELECT u.emp_id as id, u.name, u.email, u.role, u.status, u.created_at,
             ep.phone, ep.department, ep.designation, ep.joining_date, ep.basic_pay,
             ep.about, ep.skills, ep.certifications, ep.performance_rating,
             bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number, bd.uan_number, bd.status AS bank_status
      FROM users u
      LEFT JOIN employee_profiles ep ON u.emp_id = ep.user_id
      LEFT JOIN bank_details bd ON u.emp_id = bd.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (department) {
      query += ` AND ep.department = ?`;
      params.push(department);
    }

    if (designation) {
      query += ` AND ep.designation = ?`;
      params.push(designation);
    }

    query += ` ORDER BY u.emp_id ASC`;

    const [employees] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee details
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  const employeeId = req.params.id;

  try {
    // Check if the user is requesting their own profile or if they are admin
    if (req.user.role !== 'admin' && req.user.id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied to this profile' });
    }

    const [profile] = await pool.query(
      `SELECT u.emp_id as id, u.name, u.email, u.role, u.status, u.created_at,
              ep.phone, ep.department, ep.designation, ep.joining_date, ep.basic_pay,
              ep.about, ep.skills, ep.certifications, ep.performance_rating,
              bd.bank_name, bd.account_number, bd.ifsc_code, bd.pan_number, bd.uan_number, bd.status AS bank_status
       FROM users u
       LEFT JOIN employee_profiles ep ON u.emp_id = ep.user_id
       LEFT JOIN bank_details bd ON u.emp_id = bd.user_id
       WHERE u.emp_id = ?`,
      [employeeId]
    );

    if (profile.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a pending employee
// @route   PUT /api/employees/:id/approve
// @access  Private (Admin Only)
const approveEmployee = async (req, res, next) => {
  const employeeId = req.params.id;

  try {
    const [user] = await pool.query('SELECT emp_id, role, status FROM users WHERE emp_id = ?', [employeeId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (user[0].status === 'approved') {
      return res.status(400).json({ success: false, message: 'Employee account is already approved' });
    }

    await pool.query('UPDATE users SET status = "approved" WHERE emp_id = ?', [employeeId]);

    res.status(200).json({
      success: true,
      message: 'Employee account approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee profile
// @route   PUT /api/employees/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  const { phone, department, designation, joining_date, basic_pay, name, password, about, skills, certifications } = req.body;
  const userId = req.user.id;

  try {
    // 1. Update basic user info
    if (name) {
      await pool.query('UPDATE users SET name = ? WHERE emp_id = ?', [name, userId]);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await pool.query('UPDATE users SET password = ? WHERE emp_id = ?', [hashedPassword, userId]);
    }

    // 2. Update employee profile info (employees can update phone, about, skills, certs; admin can update pay/designation)
    const isOwnerAdmin = req.user.role === 'admin';
    
    let updateFields = 'phone = ?, about = ?, skills = ?, certifications = ?';
    const params = [
      phone !== undefined ? phone : null,
      about !== undefined ? about : null,
      skills !== undefined ? skills : null,
      certifications !== undefined ? (typeof certifications === 'string' ? certifications : JSON.stringify(certifications)) : null
    ];

    if (isOwnerAdmin) {
      updateFields += ', department = ?, designation = ?, joining_date = ?, basic_pay = ?';
      params.push(
        department || null,
        designation || null,
        joining_date || null,
        basic_pay !== undefined ? basic_pay : 0.00
      );
    }

    updateFields += ' WHERE user_id = ?';
    params.push(userId);

    await pool.query(`UPDATE employee_profiles SET ${updateFields}`, params);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin updates any employee profile
// @route   PUT /api/employees/:id
// @access  Private (Admin Only)
const adminUpdateEmployee = async (req, res, next) => {
  const employeeId = req.params.id;
  const { name, phone, department, designation, joining_date, basic_pay, status, about, skills, certifications } = req.body;

  try {
    const [user] = await pool.query('SELECT emp_id FROM users WHERE emp_id = ?', [employeeId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update users table
    if (name || status) {
      let userQuery = 'UPDATE users SET ';
      const userParams = [];
      if (name) {
        userQuery += 'name = ?, ';
        userParams.push(name);
      }
      if (status) {
        userQuery += 'status = ?, ';
        userParams.push(status);
      }
      userQuery = userQuery.slice(0, -2) + ' WHERE emp_id = ?';
      userParams.push(employeeId);
      await pool.query(userQuery, userParams);
    }

    // Update employee_profiles table
    await pool.query(
      `UPDATE employee_profiles 
       SET phone = ?, department = ?, designation = ?, joining_date = ?, basic_pay = ?,
           about = ?, skills = ?, certifications = ?
       WHERE user_id = ?`,
      [
        phone || null,
        department || null,
        designation || null,
        joining_date || null,
        basic_pay !== undefined ? basic_pay : 0.00,
        about || null,
        skills || null,
        certifications !== undefined ? (typeof certifications === 'string' ? certifications : JSON.stringify(certifications)) : null,
        employeeId
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully by admin'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Directly add a new employee by Admin
// @route   POST /api/employees
// @access  Private (Admin Only)
const addEmployee = async (req, res, next) => {
  const { name, email, password, role = 'employee', phone, department, designation, joining_date, basic_pay, about, skills, certifications } = req.body;

  try {
    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // 2. Check if email is registered
    const [existing] = await pool.query('SELECT emp_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate Employee ID
    const empId = await generateEmpId(name, joining_date || new Date());

    // 5. Create user (Admin additions are auto-approved)
    await pool.query(
      'INSERT INTO users (emp_id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, "approved")',
      [empId, name, email, hashedPassword, role]
    );

    // 6. Create employee profile
    await pool.query(
      `INSERT INTO employee_profiles 
       (user_id, phone, department, designation, joining_date, basic_pay, about, skills, certifications)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId,
        phone || null,
        department || null,
        designation || null,
        joining_date || null,
        basic_pay !== undefined ? basic_pay : 0.00,
        about || null,
        skills || null,
        certifications !== undefined ? (typeof certifications === 'string' ? certifications : JSON.stringify(certifications)) : null
      ]
    );

    // 7. Create bank details row
    await pool.query(
      'INSERT INTO bank_details (user_id) VALUES (?)',
      [empId]
    );

    res.status(201).json({
      success: true,
      message: `Employee added successfully. Generated ID: ${empId}`,
      data: {
        id: empId,
        name,
        email,
        role,
        status: 'approved'
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Update employee bank details (Admin Only)
// @route   PUT /api/employees/:id/bank-details
// @access  Private (Admin Only)
const updateBankDetails = async (req, res, next) => {
  const employeeId = req.params.id;
  const { bank_name, account_number, ifsc_code, pan_number, uan_number } = req.body;

  try {
    const [user] = await pool.query('SELECT emp_id FROM users WHERE emp_id = ?', [employeeId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Insert or update bank details
    await pool.query(
      `INSERT INTO bank_details (user_id, bank_name, account_number, ifsc_code, pan_number, uan_number, status)
       VALUES (?, ?, ?, ?, ?, ?, 'verified')
       ON DUPLICATE KEY UPDATE 
       bank_name = VALUES(bank_name), 
       account_number = VALUES(account_number), 
       ifsc_code = VALUES(ifsc_code), 
       pan_number = VALUES(pan_number), 
       uan_number = VALUES(uan_number),
       status = 'verified'`,
      [employeeId, bank_name || null, account_number || null, ifsc_code || null, pan_number || null, uan_number || null]
    );

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully by admin'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate employee performance (Admin Only)
// @route   PUT /api/employees/:id/rate
// @access  Private (Admin Only)
const rateEmployee = async (req, res, next) => {
  const employeeId = req.params.id;
  const { rating } = req.body;

  try {
    const [user] = await pool.query('SELECT emp_id FROM users WHERE emp_id = ?', [employeeId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const numericRating = parseFloat(rating);
    if (isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a decimal between 0.0 and 5.0' });
    }

    await pool.query(
      'UPDATE employee_profiles SET performance_rating = ? WHERE user_id = ?',
      [numericRating, employeeId]
    );

    res.status(200).json({
      success: true,
      message: 'Performance rating updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fire an employee (Admin Only)
// @route   POST /api/employees/fire
// @access  Private (Admin Only)
const fireEmployee = async (req, res, next) => {
  const { email, admin_password } = req.body;
  const adminId = req.user.id;

  try {
    // 1. Validation
    if (!email || !admin_password) {
      return res.status(400).json({ success: false, message: 'Employee email and admin confirmation password are required.' });
    }

    // 2. Verify admin's own password
    const [admins] = await pool.query('SELECT password FROM users WHERE emp_id = ?', [adminId]);
    const admin = admins[0];

    const isMatch = await bcrypt.compare(admin_password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect admin password. Action denied.' });
    }

    // 3. Check if target employee exists
    const [targetUsers] = await pool.query('SELECT emp_id, role FROM users WHERE email = ?', [email]);
    if (targetUsers.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee with this email does not exist.' });
    }

    const targetUser = targetUsers[0];

    if (targetUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete/fire administrator accounts.' });
    }

    // 4. Delete user (foreign keys cascade will clear profiles, attendance, leaves, payslips, bank)
    await pool.query('DELETE FROM users WHERE emp_id = ?', [targetUser.emp_id]);

    res.status(200).json({
      success: true,
      message: `Employee data associated with ${email} was permanently deleted/fired.`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get distinct departments and designations for selection/filtering
// @route   GET /api/employees/meta/filters
// @access  Private
const getFilterMetadata = async (req, res, next) => {
  try {
    const [depts] = await pool.query(
      "SELECT DISTINCT department FROM employee_profiles WHERE department IS NOT NULL AND department != '' ORDER BY department ASC"
    );
    const [desigs] = await pool.query(
      "SELECT DISTINCT designation FROM employee_profiles WHERE designation IS NOT NULL AND designation != '' ORDER BY designation ASC"
    );

    res.status(200).json({
      success: true,
      data: {
        departments: depts.map(d => d.department),
        designations: desigs.map(d => d.designation)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  approveEmployee,
  updateProfile,
  adminUpdateEmployee,
  addEmployee,
  updateBankDetails,
  rateEmployee,
  fireEmployee,
  getFilterMetadata
};
