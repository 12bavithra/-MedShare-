import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'name, email, and password are required',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12); // Increased salt rounds for better security

    // Admin restriction based on email; only this email can be ADMIN
    const ADMIN_EMAIL = '12bavithra102004@gmail.com';
    const normalizedEmail = email.toLowerCase().trim();
    const requestedRole = (role || '').toString().trim().toUpperCase();
    const allowedUserRoles = ['DONOR', 'RECIPIENT'];

    // If someone explicitly tries ADMIN with a non-whitelisted email, block it
    if (requestedRole === 'ADMIN' && normalizedEmail !== ADMIN_EMAIL) {
      return res.status(400).json({
        message: 'You are not allowed to register as admin. Please register as Recipient or Donor.'
      });
    }

    const userRole = normalizedEmail === ADMIN_EMAIL && requestedRole === 'ADMIN'
      ? 'ADMIN'
      : (allowedUserRoles.includes(requestedRole) ? requestedRole : 'RECIPIENT');

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hash,
      role: userRole
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle MongoDB validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        errors: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token with expiry
    const token = jwt.sign(
      { 
        id: user._id.toString(), 
        role: user.role,
        email: user.email
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: '7d',
        issuer: 'medshare-api',
        audience: 'medshare-client'
      }
    );

    return res.json({
      message: 'Login successful',
      token,
      expiresIn: '7d',
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('_id name email role createdAt isActive')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Return user data without password
    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isActive: user.isActive
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;


