const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { optionalAuth } = require('../middleware/auth');

router.post('/record', optionalAuth, matchController.recordMatch);
router.get('/history', optionalAuth, matchController.getHistory);
router.get('/leaderboard', matchController.getLeaderboard);

module.exports = router;
