const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

      // Get user from the database
      const [rows] = await pool.query(
        'SELECT emp_id as id, name, email, role, status FROM users WHERE emp_id = ?',
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      req.user = rows[0];

      // Check if employee accounts are approved
      if (req.user.role === 'employee' && req.user.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending admin approval. You cannot access this resource yet.'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
  }
};

module.exports = { protect, adminOnly };
