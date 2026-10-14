const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['pvc', 'pvp'],
      default: 'pvc',
    },
    targetWins: {
      type: Number,
      default: 3, // Best of 1, 3, or 5 -> target wins 1, 2, or 3
    },
    player1: {
      id: { type: String, required: true },
      username: { type: String, required: true },
      score: { type: Number, default: 0 },
      isGuest: { type: Boolean, default: false },
    },
    player2: {
      id: { type: String, required: true },
      username: { type: String, required: true },
      score: { type: Number, default: 0 },
      isBot: { type: Boolean, default: false },
      isGuest: { type: Boolean, default: false },
    },
    winner: {
      id: { type: String, default: null },
      username: { type: String, default: null },
    },
    rounds: [
      {
        roundNumber: Number,
        p1Move: { type: String, enum: ['rock', 'paper', 'scissors', 'timeout'] },
        p2Move: { type: String, enum: ['rock', 'paper', 'scissors', 'timeout'] },
        result: { type: String, enum: ['p1', 'p2', 'draw'] },
      },
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'forfeited'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Match', matchSchema);
