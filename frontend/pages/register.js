/**
 * Register Page
 *
 * Uses LOCAL loading state (not from Zustand store) so a stale persisted
 * isLoading value can never freeze the button on page load.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RiFlashlightLine, RiEyeLine, RiEyeOffLine,
  RiMailLine, RiLockLine, RiUserLine, RiCheckLine,
} from 'react-icons/ri';
import useAuthStore from '../store/authStore';

const getStrength = (pwd) => {
  let s = 0;
  if (pwd.length >= 8)          s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#10b981', '#6366f1'];
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuthStore();

  // ⚠️ LOCAL loading state — never comes from Zustand persist
  const [loading, setLoading]         = useState(false);
  const [form, setForm]               = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});
  const [serverError, setServerError]   = useState('');
  const strength = getStrength(form.password);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())
      errs.name = 'Full name is required';
    if (!form.email.trim())
      errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Enter a valid email address';
    if (!form.password)
      errs.password = 'Password is required';
    else if (form.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword)
      errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password,
      );

      if (result.success) {
        router.replace('/dashboard');
      } else {
        setServerError(result.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: '' });
    if (serverError) setServerError('');
  };

  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: '#0d0d1a' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(ellipse, #a855f7 0%, transparent 70%)', filter: 'blur(60px)' }} />
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
          <h1 className="text-2xl font-black text-white">Create your account</h1>
          <p className="text-gray-400 mt-1 text-sm">Start your digital wellness journey — free forever</p>
        </div>

        <div className="glass-card p-8">
          {/* Server error */}
          {serverError && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              ⚠ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type="text" value={form.name} onChange={handleChange('name')}
                  placeholder="John Doe" autoComplete="name" autoFocus
                  className={`input-field pl-10 ${fieldErrors.name ? 'border-red-500/50' : ''}`} />
              </div>
              {fieldErrors.name && <p className="text-red-400 text-xs mt-1.5">⚠ {fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type="email" value={form.email} onChange={handleChange('email')}
                  placeholder="you@example.com" autoComplete="email"
                  className={`input-field pl-10 ${fieldErrors.email ? 'border-red-500/50' : ''}`} />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1.5">⚠ {fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={handleChange('password')} placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'border-red-500/50' : ''}`} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,0.1)' }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: STRENGTH_COLOR[strength] }}>{STRENGTH_LABEL[strength]}</p>
                </div>
              )}
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1.5">⚠ {fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input type="password" value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                  placeholder="Repeat your password" autoComplete="new-password"
                  className={`input-field pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500/50' : ''}`} />
                {passwordsMatch && (
                  <RiCheckLine className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" size={16} />
                )}
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">⚠ {fieldErrors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login">
              <span className="text-primary-400 hover:text-primary-300 font-semibold cursor-pointer">Sign in →</span>
            </Link>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          No email verification required — you'll be logged in instantly.
        </p>
      </motion.div>
    </div>
  );
}
