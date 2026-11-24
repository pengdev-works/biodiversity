/**
 * src/routes/auth.js
 * Authentication routes: login + current-user.
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticateToken, loginRateLimiter } from '../middleware/auth.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Look up user (case-insensitive username matching)
    const result = await query(
      'SELECT * FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [cleanUsername]
    );

    if (result.quotaExceeded) {
      console.error('[POST /auth/login] Database quota exceeded on cloud database.');
      return res.status(503).json({ error: 'Database service unavailable or quota exceeded on cloud provider.' });
    }

    const user = result.rows[0];
    if (!user) {
      console.warn(`[Login Failed] User not found: "${cleanUsername}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!valid) {
      console.warn(`[Login Failed] Password mismatch for: "${cleanUsername}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue JWT (7 days)
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error('[POST /auth/login]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, created_at FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('[GET /auth/me]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
