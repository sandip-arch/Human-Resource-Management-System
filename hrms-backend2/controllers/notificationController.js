const pool = require('../config/db');

// @desc    Get counts of pending requests for admin notification alerts
// @route   GET /api/notifications/pending-count
// @access  Private
const getPendingCount = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      // 1. Count pending registrations
      const [regRes] = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE status = 'pending'"
      );
      
      // 2. Count pending leaves
      const [leaveRes] = await pool.query(
        "SELECT COUNT(*) as count FROM leaves WHERE status = 'pending'"
      );

      const registrations = regRes[0].count;
      const leaves = leaveRes[0].count;
      const total = registrations + leaves;

      res.status(200).json({
        success: true,
        data: {
          registrations,
          leaves,
          total
        }
      });
    } else {
      // For employees, we can return 0 or fetch approved/rejected leaves count
      res.status(200).json({
        success: true,
        data: {
          registrations: 0,
          leaves: 0,
          total: 0
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getPendingCount };
