const storage = require('../services/storage');

// Record completed match result & update player stats
exports.recordMatch = async (req, res) => {
  try {
    const { mode, targetWins, player1, player2, winner, rounds, status } = req.body;

    if (!player1 || !player2) {
      return res.status(400).json({ message: 'Player 1 and Player 2 details are required.' });
    }

    const match = await storage.recordMatch({
      mode: mode || 'pvc',
      targetWins: targetWins || 3,
      player1,
      player2,
      winner: winner || null,
      rounds: rounds || [],
      status: status || 'completed',
    });

    // Update stats for authenticated or identified players
    if (winner) {
      if (winner.id === player1.id) {
        if (!player1.isGuest) await storage.updateUserStats(player1.id, 'win');
        if (!player2.isGuest && !player2.isBot) await storage.updateUserStats(player2.id, 'loss');
      } else if (winner.id === player2.id) {
        if (!player2.isGuest && !player2.isBot) await storage.updateUserStats(player2.id, 'win');
        if (!player1.isGuest) await storage.updateUserStats(player1.id, 'loss');
      } else if (winner.id === 'draw') {
        if (!player1.isGuest) await storage.updateUserStats(player1.id, 'draw');
        if (!player2.isGuest && !player2.isBot) await storage.updateUserStats(player2.id, 'draw');
      }
    }

    return res.status(201).json({
      message: 'Match recorded successfully',
      match,
    });
  } catch (error) {
    console.error('Error recording match:', error);
    return res.status(500).json({ message: 'Failed to record match', error: error.message });
  }
};

// Get match history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.query.userId || (req.user ? (req.user._id || req.user.id) : null);
    const limit = parseInt(req.query.limit, 10) || 20;

    const matches = await storage.getMatchHistory(userId, limit);
    return res.json({ matches });
  } catch (error) {
    console.error('Error fetching match history:', error);
    return res.status(500).json({ message: 'Failed to fetch match history' });
  }
};

// Get leaderboard top players
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const leaderboard = await storage.getLeaderboard(limit);
    return res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};
