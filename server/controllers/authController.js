const bcrypt = require('bcryptjs');
const storage = require('../services/storage');
const { signToken } = require('../middleware/auth');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: 'Username must be between 3 and 20 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check existing email
    const existingEmail = await storage.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // Check existing username
    const existingUser = await storage.findUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await storage.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      avatar: avatar || 'robot',
      isGuest: false,
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isGuest: false,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
};

// Login existing user
exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body; // loginId can be email or username

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/Username and password are required.' });
    }

    let user = await storage.findUserByEmail(loginId);
    if (!user) {
      user = await storage.findUserByUsername(loginId);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This is a guest account or has no password set.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isGuest: user.isGuest,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message || 'Server error during login.' });
  }
};

// Guest Mode Login
exports.guestLogin = async (req, res) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `Guest_${randomSuffix}`;

    const user = await storage.createUser({
      username: guestUsername,
      isGuest: true,
      avatar: 'robot',
    });

    const token = signToken(user);

    return res.json({
      message: 'Guest session created',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        isGuest: true,
        avatar: user.avatar,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({ message: 'Could not create guest session.' });
  }
};

// Get current user profile and stats
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await storage.findUserById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id || user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isGuest: user.isGuest,
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Error retrieving profile.' });
  }
};
