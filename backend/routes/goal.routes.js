const express = require('express');
const router = express.Router();
const { getGoals, getGoal, createGoal, updateGoal, deleteGoal, checkGoalProgress, getGoalsSummary } = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/summary', getGoalsSummary);
router.route('/').get(getGoals).post(createGoal);
router.route('/:id').get(getGoal).put(updateGoal).delete(deleteGoal);
router.post('/:id/check-progress', checkGoalProgress);

module.exports = router;
