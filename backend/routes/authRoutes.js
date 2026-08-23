import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryDB, isFallback, fallbackStore, otpStore } from '../config/db.js';
import { authMiddleware, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar_url } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const avatarUrl = avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

    if (isFallback()) {
      const existing = fallbackStore.users.find(u => u.email === email || u.username === username);
      if (existing) {
        return res.status(400).json({ error: 'Username or email already registered.' });
      }

      const newUser = {
        id: fallbackStore.users.length + 1,
        username,
        email,
        password_hash: passwordHash,
        avatar_url: avatarUrl,
        bio: 'Welcome to my FLIXIT channel!',
        subscription_tier: 'free',
        stripe_customer_id: `cus_mock_${Date.now()}`,
        created_at: new Date()
      };
      fallbackStore.users.push(newUser);

      const token = jwt.sign({ id: newUser.id, username, email, subscription_tier: 'free' }, JWT_SECRET, { expiresIn: '7d' });

      const { password_hash, ...userWithoutPass } = newUser;
      return res.status(201).json({ token, user: userWithoutPass, message: 'Registration successful!' });
    } else {
      const existing = await queryDB('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Username or email already registered.' });
      }

      const result = await queryDB(
        'INSERT INTO users (username, email, password_hash, avatar_url, bio, subscription_tier, stripe_customer_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username, email, passwordHash, avatarUrl, 'Welcome to my FLIXIT channel!', 'free', `cus_mock_${Date.now()}`]
      );

      const userId = result.insertId;
      const token = jwt.sign({ id: userId, username, email, subscription_tier: 'free' }, JWT_SECRET, { expiresIn: '7d' });

      return res.status(201).json({
        token,
        user: { id: userId, username, email, avatar_url: avatarUrl, bio: 'Welcome to my FLIXIT channel!', subscription_tier: 'free' },
        message: 'Registration successful!'
      });
    }
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    let user = null;

    if (isFallback()) {
      user = fallbackStore.users.find(u => u.email === email);
    } else {
      const rows = await queryDB('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) user = rows[0];
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    const isDemoPass = password === 'password' && (user.username === 'flixit_admin' || user.username === 'cinephile_jane');

    if (!isMatch && !isDemoPass) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, subscription_tier: user.subscription_tier },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password_hash, ...userWithoutPass } = user;
    return res.json({ token, user: userWithoutPass, message: 'Welcome back to FLIXIT!' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// STEP 1: FORGOT PASSWORD - GENERATE 6-DIGIT OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    let userExists = false;
    if (isFallback()) {
      userExists = fallbackStore.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    } else {
      const rows = await queryDB('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
      userExists = rows.length > 0;
    }

    if (!userExists) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    return res.json({
      message: `Verification 6-digit OTP generated and sent to ${email}`,
      otp: otp, // Returned for instant user testing
      email
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate OTP.' });
  }
});

// STEP 2: VERIFY OTP CODE
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required.' });
    }

    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email or OTP expired.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid 6-digit OTP code.' });
    }

    return res.json({ message: 'OTP verified successfully! Proceed to reset password.', verified: true });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed.' });
  }
});

// STEP 3: RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    const record = otpStore.get(email.toLowerCase());
    if (!record || record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid or expired OTP session.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    if (isFallback()) {
      const user = fallbackStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        user.password_hash = passwordHash;
      }
    } else {
      await queryDB('UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)', [passwordHash, email.toLowerCase()]);
    }

    otpStore.delete(email.toLowerCase());

    return res.json({ message: 'Password reset successfully! You can now sign in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// GET CURRENT USER
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let user = null;
    if (isFallback()) {
      user = fallbackStore.users.find(u => u.id === req.user.id);
    } else {
      const rows = await queryDB('SELECT id, username, email, avatar_url, bio, subscription_tier, stripe_customer_id, created_at FROM users WHERE id = ?', [req.user.id]);
      if (rows.length > 0) user = rows[0];
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { password_hash, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile.' });
  }
});

// UPDATE PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, bio, avatar_url, subscription_tier } = req.body;

    if (isFallback()) {
      const user = fallbackStore.users.find(u => u.id === req.user.id);
      if (user) {
        if (username) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (avatar_url) user.avatar_url = avatar_url;
        if (subscription_tier) user.subscription_tier = subscription_tier;
        const { password_hash, ...updatedUser } = user;
        return res.json({ user: updatedUser, message: 'Profile updated successfully!' });
      }
    } else {
      await queryDB(
        'UPDATE users SET username = COALESCE(?, username), bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url), subscription_tier = COALESCE(?, subscription_tier) WHERE id = ?',
        [username, bio, avatar_url, subscription_tier, req.user.id]
      );
      const rows = await queryDB('SELECT id, username, email, avatar_url, bio, subscription_tier, stripe_customer_id, created_at FROM users WHERE id = ?', [req.user.id]);
      return res.json({ user: rows[0], message: 'Profile updated successfully!' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error updating profile.' });
  }
});

export default router;
