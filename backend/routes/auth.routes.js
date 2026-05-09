const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// Only import functions that actually exist in the Supabase auth controller
const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  refreshToken,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

// ── Validation rules ──────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/forgot-password', body('email').isEmail(), validate, forgotPassword);
router.post('/refresh-token', refreshToken);

// NOTE: Password reset is handled entirely by Supabase on the frontend.
// The reset email link redirects to /reset-password in the Next.js app,
// where supabase.auth.updateUser({ password }) is called directly.

module.exports = router;
