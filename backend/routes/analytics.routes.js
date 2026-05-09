const express = require('express');
const router = express.Router();
const {
  getOverview, getWeeklyAnalytics, getMonthlyAnalytics,
  getHeatmap, getAppUsage, getProductivityTrend, getHourlyPattern,
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/overview', getOverview);
router.get('/weekly', getWeeklyAnalytics);
router.get('/monthly', getMonthlyAnalytics);
router.get('/heatmap', getHeatmap);
router.get('/app-usage', getAppUsage);
router.get('/productivity-trend', getProductivityTrend);
router.get('/hourly-pattern', getHourlyPattern);

module.exports = router;
