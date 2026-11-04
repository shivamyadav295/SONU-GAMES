const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const storage = require('../services/storage');
const { signToken } = require('../middleware/auth');

// Helper to format sanitized user object
function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user._id?.toString() || user.id?.toString(),
    username: user.username,
    email: user.email || null,
    phone: user.phone || null,
    avatar: user.avatar || 'robot',
    isGuest: !!user.isGuest,
    privacy: user.privacy || { maskContact: true },
    stats: user.stats || {
      wins: 0,
      losses: 0,
      draws: 0,
      totalMatches: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    createdAt: user.createdAt,
  };
}

// Validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CLEAN_REGEX = /[\s\-\(\)\.]/g;
const createRecoveryCode = () => crypto.randomBytes(16).toString('hex').toUpperCase();
const hashRecoveryCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const formatRecoveryCode = (code) => code.match(/.{4}/g).join('-');

// Register with a username and password; contact details are optional.
exports.register = async (req, res) => {
  try {
    const { username, email, phone, password, avatar, privacy } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      return res.status(400).json({ message: 'Username must be between 3 and 20 characters.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    let sanitizedEmail = null;
    if (email && email.trim()) {
      sanitizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(sanitizedEmail)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
      }
      const existingEmail = await storage.findUserByEmail(sanitizedEmail);
      if (existingEmail) {
        return res.status(409).json({ message: 'This email is already registered.' });
      }
    }

    let sanitizedPhone = null;
    if (phone && phone.trim()) {
      sanitizedPhone = phone.trim().replace(PHONE_CLEAN_REGEX, '');
      if (sanitizedPhone.length < 7 || sanitizedPhone.length > 15) {
        return res.status(400).json({ message: 'Please enter a valid mobile number (7-15 digits).' });
      }
      const existingPhone = await storage.findUserByPhone(sanitizedPhone);
      if (existingPhone) {
        return res.status(409).json({ message: 'This mobile number is already registered.' });
      }
    }

    // Check existing username
    const existingUser = await storage.findUserByUsername(username.trim());
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken. Please choose another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const recoveryCode = createRecoveryCode();

    const user = await storage.createUser({
      username: username.trim(),
      email: sanitizedEmail || undefined,
      phone: sanitizedPhone || undefined,
      password: hashedPassword,
      recoveryCodeHash: hashRecoveryCode(recoveryCode),
      avatar: avatar || 'robot',
      isGuest: false,
      privacy: {
        maskContact: privacy?.maskContact ?? true,
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      message: 'Account created successfully! Welcome to the Arena.',
      token,
      user: sanitizeUser(user),
      recoveryCode: formatRecoveryCode(recoveryCode),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message || 'Server error during registration.' });
  }
};

exports.createRecoveryCode = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId || req.user?.isGuest) {
      return res.status(403).json({ message: 'Create a saved account before setting up password recovery.' });
    }

    const recoveryCode = createRecoveryCode();
    const user = await storage.createRecoveryCode(userId, hashRecoveryCode(recoveryCode));
    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    return res.json({
      message: 'Recovery code created. Save it somewhere safe; it will not be shown again.',
      recoveryCode: formatRecoveryCode(recoveryCode),
    });
  } catch (error) {
    console.error('Recovery code creation error:', error);
    return res.status(500).json({ message: 'Could not create a recovery code.' });
  }
};

exports.recoverAccount = async (req, res) => {
  try {
    const { recoveryCode, newPassword } = req.body;
    const normalizedCode = typeof recoveryCode === 'string'
      ? recoveryCode.toUpperCase().replace(/[-\s]/g, '')
      : '';

    if (!/^[A-F0-9]{32}$/.test(normalizedCode)) {
      return res.status(400).json({ message: 'Enter the 32-character recovery code.' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const nextRecoveryCode = createRecoveryCode();
    const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    const user = await storage.resetPasswordWithRecoveryCode(
      hashRecoveryCode(normalizedCode),
      passwordHash,
      hashRecoveryCode(nextRecoveryCode)
    );

    if (!user) {
      return res.status(401).json({ message: 'Recovery code is invalid or has already been used.' });
    }

    const token = signToken(user);
    return res.json({
      message: 'Password reset successfully. Save your new recovery code.',
      token,
      user: sanitizeUser(user),
      recoveryCode: formatRecoveryCode(nextRecoveryCode),
    });
  } catch (error) {
    console.error('Account recovery error:', error);
    return res.status(500).json({ message: 'Could not recover this account.' });
  }
};

// Login existing user via Email, Phone, or Username
exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/Mobile/Username and password are required.' });
    }

    const user = await storage.findUserByLoginIdentifier(loginId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'This is a guest account. Please create a password first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const token = signToken(user);

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: sanitizeUser(user),
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
      privacy: { maskContact: true },
    });

    const token = signToken(user);

    return res.json({
      message: 'Guest session created',
      token,
      user: sanitizeUser(user),
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
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Error retrieving profile.' });
  }
};

// Update profile details (username, email, phone, avatar, password, privacy)
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id || req.user.id;
    const { username, email, phone, avatar, currentPassword, newPassword, privacy } = req.body;

    const user = await storage.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatePayload = {};

    if (username && username.trim()) {
      const cleanUser = username.trim();
      if (cleanUser.length < 3 || cleanUser.length > 20) {
        return res.status(400).json({ message: 'Username must be between 3 and 20 characters.' });
      }
      updatePayload.username = cleanUser;
    }

    if (email !== undefined) {
      if (email && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
          return res.status(400).json({ message: 'Please provide a valid email address.' });
        }
        updatePayload.email = cleanEmail;
      } else {
        updatePayload.email = null;
      }
    }

    if (phone !== undefined) {
      if (phone && phone.trim()) {
        const cleanPhone = phone.trim().replace(PHONE_CLEAN_REGEX, '');
        if (cleanPhone.length < 7 || cleanPhone.length > 15) {
          return res.status(400).json({ message: 'Please enter a valid mobile number (7-15 digits).' });
        }
        updatePayload.phone = cleanPhone;
      } else {
        updatePayload.phone = null;
      }
    }

    if (avatar) {
      updatePayload.avatar = avatar;
    }

    if (privacy) {
      updatePayload.privacy = privacy;
    }

    // Password change verification
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }

      // If user already had a password, verify currentPassword
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Current password does not match.' });
        }
      }

      const salt = await bcrypt.genSalt(10);
      updatePayload.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await storage.updateUserProfile(userId, updatePayload);
    const token = signToken(updatedUser);

    return res.json({
      message: 'Profile updated successfully!',
      token,
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(400).json({ message: error.message || 'Error updating profile.' });
  }
};
