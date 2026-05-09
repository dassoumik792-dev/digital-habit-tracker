const express = require('express');
const router = express.Router();
const { getSessions, startSession, completeSession, abandonSession, getFocusStats, getActiveSession } = require('../controllers/focus.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/active', getActiveSession);
router.get('/stats', getFocusStats);
router.get('/sessions', getSessions);
router.post('/start', startSession);
router.put('/:id/complete', completeSession);
router.put('/:id/abandon', abandonSession);

module.exports = router;
