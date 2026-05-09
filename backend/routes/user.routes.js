const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateSettings, getUserStats, getLeaderboard, deleteAccount } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/settings', updateSettings);
router.get('/stats', getUserStats);
router.get('/leaderboard', getLeaderboard);
router.delete('/account', deleteAccount);

module.exports = router;
