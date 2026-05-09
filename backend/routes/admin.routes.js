const express = require('express');
const router = express.Router();
const { getPlatformStats, getAllUsers, getUserGrowth, toggleUserStatus, getActivityReport } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/user-growth', getUserGrowth);
router.get('/activity-report', getActivityReport);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
