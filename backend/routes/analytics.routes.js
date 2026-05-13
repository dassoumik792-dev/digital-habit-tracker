const express = require('express');
const router = express.Router();
const {
  getOverview, getWeeklyAnalytics,
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/overview', getOverview);
router.get('/weekly', getWeeklyAnalytics);

module.exports = router;
