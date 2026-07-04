const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance
} = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Employee attendance actions
router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.get('/my-records', protect, getMyAttendance);

// Admin view all records
router.get('/all', protect, adminOnly, getAllAttendance);

module.exports = router;
