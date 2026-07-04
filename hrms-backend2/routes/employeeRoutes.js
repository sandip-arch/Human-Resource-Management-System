const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// User profile update (any logged-in user can update their own profile)
router.put('/profile', protect, updateProfile);

// Get list filters metadata (must be above /:id)
router.get('/meta/filters', protect, getFilterMetadata);

// Get single profile (employee can view own, admin can view any)
router.get('/:id', protect, getEmployeeById);

// Admin-only endpoints
router.get('/', protect, adminOnly, getEmployees);
router.post('/', protect, adminOnly, addEmployee);
router.put('/:id/approve', protect, adminOnly, approveEmployee);
router.put('/:id', protect, adminOnly, adminUpdateEmployee);
router.put('/:id/bank-details', protect, adminOnly, updateBankDetails);
router.put('/:id/rate', protect, adminOnly, rateEmployee);
router.post('/fire', protect, adminOnly, fireEmployee);

module.exports = router;
