const { isMongoAvailable } = require('../config/db');
const User = require('../models/User');
const Match = require('../models/Match');
const bcrypt = require('bcryptjs');

// In-Memory Fallback Store
class InMemoryStore {
  constructor() {
    this.users = new Map();
    this.matches = [];
    this.nextId = 1000;
    this.seedInitialData();
  }

  seedInitialData() {
    const seedUsers = [
      {
        id: 'user_seed_1',
        username: 'CyberBlade',
        email: 'cyberblade@arcade.io',
        password: '$2a$10$hashedseedpasswordplaceholder12345',
        isGuest: false,
        avatar: 'cyberpunk',
        stats: { wins: 48, losses: 12, draws: 5, totalMatches: 65, winRate: 73.8, currentStreak: 7, bestStreak: 12 },
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        id: 'user_seed_2',
        username: 'QuantumAce',
        email: 'quantum@arcade.io',
        password: '$2a$10$hashedseedpasswordplaceholder12345',
        isGuest: false,
        avatar: 'wizard',
        stats: { wins: 39, losses: 14, draws: 3, totalMatches: 56, winRate: 69.6, currentStreak: 4, bestStreak: 9 },
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        id: 'user_seed_3',
        username: 'NeonViper',
        email: 'neon@arcade.io',
        password: '$2a$10$hashedseedpasswordplaceholder12345',
        isGuest: false,
        avatar: 'ninja',
        stats: { wins: 32, losses: 18, draws: 6, totalMatches: 56, winRate: 57.1, currentStreak: 0, bestStreak: 8 },
        createdAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        id: 'user_seed_4',
        username: 'PixelStrike',
        email: 'pixel@arcade.io',
        password: '$2a$10$hashedseedpasswordplaceholder12345',
        isGuest: false,
        avatar: 'robot',
        stats: { wins: 27, losses: 16, draws: 4, totalMatches: 47, winRate: 57.4, currentStreak: 2, bestStreak: 6 },
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        id: 'user_seed_5',
        username: 'ShadowHand',
        email: 'shadow@arcade.io',
        password: '$2a$10$hashedseedpasswordplaceholder12345',
        isGuest: false,
        avatar: 'skull',
        stats: { wins: 21, losses: 19, draws: 8, totalMatches: 48, winRate: 43.8, currentStreak: 1, bestStreak: 5 },
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
    ];

    for (const u of seedUsers) {
      this.users.set(u.id, u);
    }
  }

  generateId() {
    return 'mem_' + (++this.nextId) + '_' + Date.now().toString(36);
  }

  async createUser({ username, email, password, isGuest = false, avatar = 'robot' }) {
    // Check uniqueness
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === username.toLowerCase()) {
        throw new Error('Username is already taken');
      }
      if (email && u.email && u.email.toLowerCase() === email.toLowerCase()) {
        throw new Error('Email is already registered');
      }
    }

    const id = this.generateId();
    const newUser = {
      _id: id,
      id,
      username,
      email: email || null,
      password: password || null,
      isGuest,
      avatar,
      stats: {
        wins: 0,
        losses: 0,
        draws: 0,
        totalMatches: 0,
        winRate: 0,
        currentStreak: 0,
        bestStreak: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async findUserByEmail(email) {
    if (!email) return null;
    const lower = email.toLowerCase();
    for (const u of this.users.values()) {
      if (u.email && u.email.toLowerCase() === lower) return u;
    }
    return null;
  }

  async findUserByUsername(username) {
    if (!username) return null;
    const lower = username.toLowerCase();
    for (const u of this.users.values()) {
      if (u.username && u.username.toLowerCase() === lower) return u;
    }
    return null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async updateUserStats(userId, result) {
    const user = this.users.get(userId);
    if (!user) return null;

    if (!user.stats) {
      user.stats = { wins: 0, losses: 0, draws: 0, totalMatches: 0, winRate: 0, currentStreak: 0, bestStreak: 0 };
    }

    user.stats.totalMatches += 1;
    if (result === 'win') {
      user.stats.wins += 1;
      user.stats.currentStreak += 1;
      if (user.stats.currentStreak > user.stats.bestStreak) {
        user.stats.bestStreak = user.stats.currentStreak;
      }
    } else if (result === 'loss') {
      user.stats.losses += 1;
      user.stats.currentStreak = 0;
    } else if (result === 'draw') {
      user.stats.draws += 1;
    }

    user.stats.winRate = user.stats.totalMatches > 0
      ? Math.round((user.stats.wins / user.stats.totalMatches) * 1000) / 10
      : 0;

    user.updatedAt = new Date();
    return user;
  }

  async recordMatch(matchData) {
    const id = this.generateId();
    const match = {
      _id: id,
      id,
      ...matchData,
      createdAt: new Date(),
    };
    this.matches.unshift(match);
    return match;
  }

  async getMatchHistory(userId, limit = 20) {
    return this.matches
      .filter((m) => {
        if (!userId) return true;
        return (
          (m.player1 && m.player1.id === userId) ||
          (m.player2 && m.player2.id === userId)
        );
      })
      .slice(0, limit);
  }

  async getLeaderboard(limit = 20) {
    const allUsers = Array.from(this.users.values())
      .filter((u) => !u.isGuest && u.stats)
      .map((u) => ({
        id: u._id || u.id,
        username: u.username,
        avatar: u.avatar || 'robot',
        wins: u.stats.wins || 0,
        losses: u.stats.losses || 0,
        draws: u.stats.draws || 0,
        totalMatches: u.stats.totalMatches || 0,
        winRate: u.stats.winRate || 0,
        bestStreak: u.stats.bestStreak || 0,
        currentStreak: u.stats.currentStreak || 0,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      })
      .slice(0, limit);

    return allUsers;
  }
}

const memoryStore = new InMemoryStore();

// Unified Storage Delegator
const storage = {
  async createUser(data) {
    if (isMongoAvailable()) {
      const user = new User(data);
      await user.save();
      return user.toObject();
    }
    return memoryStore.createUser(data);
  },

  async findUserByEmail(email) {
    if (isMongoAvailable()) {
      return User.findOne({ email: email.toLowerCase() });
    }
    return memoryStore.findUserByEmail(email);
  },

  async findUserByUsername(username) {
    if (isMongoAvailable()) {
      return User.findOne({ username });
    }
    return memoryStore.findUserByUsername(username);
  },

  async findUserById(id) {
    if (isMongoAvailable()) {
      return User.findById(id);
    }
    return memoryStore.findUserById(id);
  },

  async updateUserStats(userId, result) {
    if (isMongoAvailable()) {
      const user = await User.findById(userId);
      if (!user) return null;
      user.stats.totalMatches += 1;
      if (result === 'win') {
        user.stats.wins += 1;
        user.stats.currentStreak += 1;
        if (user.stats.currentStreak > user.stats.bestStreak) {
          user.stats.bestStreak = user.stats.currentStreak;
        }
      } else if (result === 'loss') {
        user.stats.losses += 1;
        user.stats.currentStreak = 0;
      } else if (result === 'draw') {
        user.stats.draws += 1;
      }

      user.stats.winRate = user.stats.totalMatches > 0
        ? Math.round((user.stats.wins / user.stats.totalMatches) * 1000) / 10
        : 0;

      await user.save();
      return user.toObject();
    }
    return memoryStore.updateUserStats(userId, result);
  },

  async recordMatch(matchData) {
    if (isMongoAvailable()) {
      const match = new Match(matchData);
      await match.save();
      return match.toObject();
    }
    return memoryStore.recordMatch(matchData);
  },

  async getMatchHistory(userId, limit = 20) {
    if (isMongoAvailable()) {
      const query = userId
        ? {
            $or: [
              { 'player1.id': userId },
              { 'player2.id': userId },
            ],
          }
        : {};
      return Match.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    }
    return memoryStore.getMatchHistory(userId, limit);
  },

  async getLeaderboard(limit = 20) {
    if (isMongoAvailable()) {
      const users = await User.find({ isGuest: false })
        .sort({ 'stats.wins': -1, 'stats.winRate': -1 })
        .limit(limit)
        .select('username avatar stats createdAt')
        .lean();

      return users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        avatar: u.avatar || 'robot',
        wins: u.stats.wins || 0,
        losses: u.stats.losses || 0,
        draws: u.stats.draws || 0,
        totalMatches: u.stats.totalMatches || 0,
        winRate: u.stats.winRate || 0,
        bestStreak: u.stats.bestStreak || 0,
        currentStreak: u.stats.currentStreak || 0,
      }));
    }
    return memoryStore.getLeaderboard(limit);
  },
};

module.exports = storage;
