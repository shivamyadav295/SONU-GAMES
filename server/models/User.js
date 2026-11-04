const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    recoveryCodeHash: {
      type: String,
      select: false,
      unique: true,
      sparse: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: 'robot', // robot, ninja, wizard, cyberpunk, skull
    },
    privacy: {
      maskContact: {
        type: Boolean,
        default: true,
      },
    },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
