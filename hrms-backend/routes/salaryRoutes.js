const express = require('express');
const router = express.Router();
const {
  generatePayslip,
  getMyPayslips,
  getAllPayslips,
  downloadPayslip
} = require('../controllers/salaryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get own payslips (Employee / Admin)
router.get('/my-payslips', protect, getMyPayslips);

// Download specific payslip
router.get('/payslip/:id/download', protect, downloadPayslip);

// Admin-only endpoints
router.post('/generate', protect, adminOnly, generatePayslip);
router.get('/all', protect, adminOnly, getAllPayslips);

module.exports = router;
