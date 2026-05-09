const express = require('express');
const router = express.Router();
const {
  getHabits,
  getTodayHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  seedDemoData,
  getWeeklySummary,
} = require('../controllers/habit.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// Specific named routes first (before /:id to avoid conflicts)
router.get('/today',          getTodayHabit);
router.get('/weekly-summary', getWeeklySummary);
router.post('/seed-demo',     seedDemoData);

// Collection routes
router.route('/')
  .get(getHabits)
  .post(createHabit);

// Single record routes — no getHabit needed; use getHabits with date filter from frontend
router.route('/:id')
  .put(updateHabit)
  .delete(deleteHabit);

module.exports = router;
