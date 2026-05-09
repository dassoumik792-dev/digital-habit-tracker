/**
 * Forgot Password Page
 * Sends a reset link via Supabase. User clicks the link → /reset-password page.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiFlashlightLine, RiMailLine, RiArrowLeftLine } from 'react-icons/ri';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }

    setLoading(true);
    try {
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      // Don't reveal whether the email exists — always show success
      setSent(true);
    } catch (_) {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0d1a' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full opacity-15"
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
          <h1 className="text-2xl font-black text-white">Reset Password</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="glass-card p-8">
          {sent ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-white font-semibold text-lg mb-2">Check your inbox</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If an account exists for <strong className="text-gray-300">{email}</strong>,
                you'll receive a password reset link within a few minutes.
              </p>
              <p className="text-gray-500 text-xs mt-3">
                Don't see it? Check your spam folder.
              </p>
              <Link href="/login">
                <button className="btn-primary mt-6 text-sm px-8 py-2.5">
                  Back to Login
                </button>
              </Link>
            </motion.div>
          ) : (
            /* ── Form state ────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Email address
                </label>
                <div className="relative">
                  <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className={`input-field pl-10 ${error ? 'border-red-500/50' : ''}`}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                {error && <p className="text-red-400 text-xs mt-1.5">⚠ {error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          {/* Back link */}
          <Link href="/login">
            <div className="flex items-center justify-center gap-2 mt-5 text-gray-400 hover:text-white text-sm cursor-pointer transition-colors">
              <RiArrowLeftLine size={14} />
              Back to login
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
