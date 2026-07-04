const express = require('express');
const router = express.Router();
const { getPendingCount } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/pending-count', protect, getPendingCount);

module.exports = router;
