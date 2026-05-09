const express = require('express');
const router = express.Router();
const { getInsights, generateWeeklyReport, getReports, getAddictionScore, chatWithAI } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/insights', getInsights);
router.post('/weekly-report', generateWeeklyReport);
router.get('/reports', getReports);
router.get('/addiction-score', getAddictionScore);
router.post('/chat', chatWithAI);

module.exports = router;
