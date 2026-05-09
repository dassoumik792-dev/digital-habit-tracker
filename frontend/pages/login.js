/**
 * Login Page
 * Uses supabase.auth.signInWithPassword() via the auth store.
 * Completely separate from the register flow.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RiFlashlightLine, RiEyeLine, RiEyeOffLine,
  RiMailLine, RiLockLine, RiGoogleLine,
} from 'react-icons/ri';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuthStore();

  const [form, setForm]               = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [serverError, setServerError]   = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.email.trim())                        errs.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))    errs.email    = 'Enter a valid email address';
    if (!form.password)                            errs.password = 'Password is required';
    else if (form.password.length < 6)             errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    const result = await login(form.email.trim().toLowerCase(), form.password);
    if (result.success) {
      router.replace('/dashboard');
    } else {
      setServerError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    // Clear errors as user types
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: '' });
    if (serverError) setServerError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0d1a' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <RiFlashlightLine className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-white">Welcome back</h1>
          <p className="text-gray-400 mt-1 text-sm">Sign in to your FocusPulse AI account</p>
        </div>

        <div className="glass-card p-8">
          {/* Server-level error banner */}
          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${fieldErrors.email ? 'border-red-500/50' : ''}`}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  ⚠ {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link href="/forgot-password">
                  <span className="text-xs text-primary-400 hover:text-primary-300 cursor-pointer transition-colors">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Your password"
                  className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'border-red-500/50' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  ⚠ {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RiGoogleLine size={16} />
            Continue with Google
          </button>

          {/* Switch to register */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/register">
              <span className="text-primary-400 hover:text-primary-300 font-semibold cursor-pointer transition-colors">
                Create one free →
              </span>
            </Link>
          </p>
        </div>

        {/* Hint */}
        <p className="text-center text-gray-600 text-xs mt-4">
          New here? <Link href="/register"><span className="text-gray-500 underline cursor-pointer">Sign up first</span></Link> — login only works after registration.
        </p>
      </motion.div>
    </div>
  );
}
