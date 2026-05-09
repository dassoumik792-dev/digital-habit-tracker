const express = require('express');
const router = express.Router();
const { getFullReport } = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/full', getFullReport);

module.exports = router;
