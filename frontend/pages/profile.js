/**
 * Profile Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { RiUserLine, RiEditLine, RiSaveLine, RiTrophyLine, RiFireLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { userAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', profile: { bio: '', occupation: '', timezone: 'UTC' } });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchStats();
    if (user) setForm({ name: user.name, profile: user.profile || { bio: '', occupation: '', timezone: 'UTC' } });
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      const { data } = await userAPI.getStats();
      setStats(data.data);
    } catch (_) {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile(form);
      updateUser(data.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const levelProgress = user ? ((user.totalPoints % 1000) / 1000) * 100 : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-white">Profile</h1>

      {/* Profile card */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge-info">Level {user?.level || 1}</span>
                <span className="text-gray-400 text-xs">{user?.totalPoints || 0} points</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
              editing ? <RiSaveLine size={14} /> : <RiEditLine size={14} />}
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Level progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Level {user?.level || 1} Progress</span>
            <span className="text-xs text-gray-400">{user?.totalPoints % 1000}/1000 XP</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>

        {/* Editable fields */}
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Bio</label>
              <textarea value={form.profile?.bio || ''} onChange={(e) => setForm({ ...form, profile: { ...form.profile, bio: e.target.value } })}
                className="input-field resize-none" rows={3} placeholder="Tell us about yourself..." />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Occupation</label>
              <input type="text" value={form.profile?.occupation || ''} onChange={(e) => setForm({ ...form, profile: { ...form.profile, occupation: e.target.value } })}
                className="input-field" placeholder="e.g., Software Engineer" />
            </div>
            <button onClick={() => setEditing(false)} className="text-sm text-gray-400 hover:text-white">Cancel</button>
          </div>
        ) : (
          <div className="space-y-3">
            {user?.profile?.bio && <p className="text-gray-300 text-sm">{user.profile.bio}</p>}
            {user?.profile?.occupation && (
              <p className="text-gray-400 text-sm">💼 {user.profile.occupation}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Days Tracked', value: stats.totalHabitsTracked, icon: '📅' },
            { label: 'Focus Sessions', value: stats.completedFocusSessions, icon: '⏱️' },
            { label: 'Focus Hours', value: `${Math.round(stats.totalFocusMinutes / 60)}h`, icon: '🎯' },
            { label: 'Best Streak', value: `${user?.streak?.longest || 0}d`, icon: '🔥' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-black gradient-text">{s.value}</div>
              <div className="text-gray-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      {user?.badges?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <RiTrophyLine className="text-yellow-400" /> Badges & Achievements
          </h3>
          <div className="flex flex-wrap gap-3">
            {user.badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <span className="text-xl">{badge.icon || '🏅'}</span>
                <div>
                  <p className="text-white text-xs font-medium">{badge.name}</p>
                  <p className="text-gray-400 text-xs">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

ProfilePage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
