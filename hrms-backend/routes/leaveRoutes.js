const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  updateLeaveStatus,
  getLeavesCalendar,
  getHolidays,
  addHoliday
} = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Employee actions
router.post('/apply', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);

// Calendar & Holidays (Accessible by both employee & admin)
router.get('/calendar', protect, getLeavesCalendar);
router.get('/holidays', protect, getHolidays);

// Admin-only actions
router.get('/pending', protect, adminOnly, getPendingLeaves);
router.put('/:id/status', protect, adminOnly, updateLeaveStatus);
router.post('/holidays', protect, adminOnly, addHoliday);

module.exports = router;
