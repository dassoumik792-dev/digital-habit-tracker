/**
 * Settings Page
 * Password change uses supabase.auth.updateUser() directly (no backend route needed).
 * Settings are saved to the backend via userAPI.updateSettings().
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RiSettingsLine, RiSaveLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { userAPI } from '../lib/api';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  // Map flat DB columns → local settings shape
  const [settings, setSettings] = useState({
    daily_screen_time_limit: 480,
    focus_goal_minutes: 120,
    work_start_hour: 9,
    work_end_hour: 18,
    notif_email: true,
    notif_push: true,
    notif_reminders: true,
    notif_weekly_report: true,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    // Populate from user profile (flat Supabase columns)
    if (user) {
      setSettings({
        daily_screen_time_limit: user.daily_screen_time_limit ?? 480,
        focus_goal_minutes:      user.focus_goal_minutes ?? 120,
        work_start_hour:         user.work_start_hour ?? 9,
        work_end_hour:           user.work_end_hour ?? 18,
        notif_email:             user.notif_email ?? true,
        notif_push:              user.notif_push ?? true,
        notif_reminders:         user.notif_reminders ?? true,
        notif_weekly_report:     user.notif_weekly_report ?? true,
      });
    }
  }, [isAuthenticated, user]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateSettings(settings);
      updateUser(data.data);
      toast.success('Settings saved!');
    } catch (_) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Password change goes directly through Supabase Auth — no backend route needed
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-gray-700'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-white flex items-center gap-2">
        <RiSettingsLine className="text-primary-400" /> Settings
      </h1>

      {/* ── Screen Time & Focus ─────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-white font-semibold">Screen Time & Focus</h3>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Daily Screen Time Limit (minutes)</label>
          <input
            type="number"
            value={settings.daily_screen_time_limit}
            onChange={(e) => setSettings({ ...settings, daily_screen_time_limit: parseInt(e.target.value) || 480 })}
            className="input-field" min="60" max="1440"
          />
          <p className="text-gray-500 text-xs mt-1">
            {Math.round((settings.daily_screen_time_limit || 480) / 60)}h per day
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-300 mb-2 block">Daily Focus Goal (minutes)</label>
          <input
            type="number"
            value={settings.focus_goal_minutes}
            onChange={(e) => setSettings({ ...settings, focus_goal_minutes: parseInt(e.target.value) || 120 })}
            className="input-field" min="15" max="480"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Work Start Hour</label>
            <input
              type="number"
              value={settings.work_start_hour}
              onChange={(e) => setSettings({ ...settings, work_start_hour: parseInt(e.target.value) || 9 })}
              className="input-field" min="0" max="23"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Work End Hour</label>
            <input
              type="number"
              value={settings.work_end_hour}
              onChange={(e) => setSettings({ ...settings, work_end_hour: parseInt(e.target.value) || 18 })}
              className="input-field" min="0" max="23"
            />
          </div>
        </div>
      </div>

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-white font-semibold">Notifications</h3>
        {[
          { key: 'notif_email',          label: 'Email Notifications',  desc: 'Receive updates via email' },
          { key: 'notif_push',           label: 'Push Notifications',   desc: 'Browser push notifications' },
          { key: 'notif_reminders',      label: 'Reminders',            desc: 'Daily habit reminders' },
          { key: 'notif_weekly_report',  label: 'Weekly Report',        desc: 'AI-generated weekly summary' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">{item.label}</p>
              <p className="text-gray-400 text-xs">{item.desc}</p>
            </div>
            <Toggle
              checked={settings[item.key] ?? true}
              onChange={(val) => setSettings({ ...settings, [item.key]: val })}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveSettings}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        {saving
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <RiSaveLine size={16} />}
        Save Settings
      </button>

      {/* ── Change Password ─────────────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Min. 6 characters"
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Repeat new password"
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            className="btn-secondary w-full flex items-center justify-center gap-2 py-3 text-sm"
          >
            {savingPassword
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : null}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

SettingsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
