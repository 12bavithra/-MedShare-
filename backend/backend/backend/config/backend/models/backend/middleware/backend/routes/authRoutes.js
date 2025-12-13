import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

/**
 * Register
 * POST /api/auth/register
 * body: { name, email, password, role }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const requestedRole = (role || '').toString().trim().toUpperCase();
    const allowedUserRoles = ['DONOR', 'RECIPIENT'];
    const finalRole = allowedUserRoles.includes(requestedRole) ? requestedRole : 'RECIPIENT';

    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      role: finalRole
    });

    return res.status(201).json({
      message: 'User created',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Login
 * POST /api/auth/login
 * body: { email, password }
 * returns { token, user }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Me
 * GET /api/auth/me
 * header: Authorization: Bearer <token>
 */
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email role createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
