/**
 * Reset Password Page
 * Supabase redirects here after the user clicks the reset link in their email.
 * The URL contains a token that Supabase auto-processes via onAuthStateChange.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiFlashlightLine, RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [form, setForm]               = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [ready, setReady]             = useState(false); // true once Supabase processes the token

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the reset link is opened
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const validate = () => {
    if (!form.password)                        return 'New password is required';
    if (form.password.length < 6)              return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const { error: sbError } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (sbError) throw new Error(sbError.message);
      toast.success('Password updated! Please log in with your new password.');
      router.replace('/login');
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0d1a' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <RiFlashlightLine className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-black text-white">Set New Password</h1>
          <p className="text-gray-400 mt-1 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="glass-card p-8">
          {!ready ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Verifying reset link…</p>
              <p className="text-gray-600 text-xs mt-2">
                If nothing happens, the link may have expired.{' '}
                <Link href="/forgot-password">
                  <span className="text-primary-400 cursor-pointer">Request a new one</span>
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm text-red-300"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  ⚠ {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">New Password</label>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
                    placeholder="Min. 6 characters"
                    className="input-field pl-10 pr-10"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" tabIndex={-1}>
                    {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Confirm Password</label>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => { setForm({ ...form, confirmPassword: e.target.value }); setError(''); }}
                    placeholder="Repeat new password"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating…</>
                ) : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
