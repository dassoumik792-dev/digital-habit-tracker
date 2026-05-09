/**
 * Habit Goals Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { RiFocusLine, RiAddLine, RiDeleteBinLine, RiEditLine, RiCheckLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { goalAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const GOAL_TYPES = [
  { value: 'screen_time', label: 'Screen Time', icon: '📱', unit: 'minutes' },
  { value: 'focus', label: 'Focus Score', icon: '🎯', unit: 'score' },
  { value: 'productivity', label: 'Productivity', icon: '⚡', unit: 'percentage' },
  { value: 'social_media', label: 'Social Media', icon: '📲', unit: 'minutes' },
  { value: 'sleep', label: 'Sleep Quality', icon: '😴', unit: 'hours' },
  { value: 'custom', label: 'Custom', icon: '✨', unit: 'count' },
];

const defaultForm = {
  title: '', description: '', type: 'screen_time', targetValue: 120,
  targetUnit: 'minutes', direction: 'limit', frequency: 'daily', color: '#6366f1', icon: '🎯',
};

export default function GoalsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchGoals();
  }, [isAuthenticated]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const { data } = await goalAPI.getSummary();
      setGoals(data.data.goals || []);
      setSummary(data.data.summary);
    } catch (_) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Goal title is required'); return; }
    setSubmitting(true);
    try {
      if (editingId) {
        await goalAPI.update(editingId, form);
        toast.success('Goal updated!');
      } else {
        await goalAPI.create(form);
        toast.success('Goal created! 🎯');
      }
      setShowForm(false);
      setForm(defaultForm);
      setEditingId(null);
      await fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await goalAPI.delete(id);
      toast.success('Goal deleted');
      await fetchGoals();
    } catch (_) {}
  };

  const handleEdit = (goal) => {
    setForm({
      title: goal.title, description: goal.description, type: goal.type,
      targetValue: goal.targetValue, targetUnit: goal.targetUnit,
      direction: goal.direction, frequency: goal.frequency,
      color: goal.color, icon: goal.icon,
    });
    setEditingId(goal._id);
    setShowForm(true);
  };

  const handleCheckProgress = async (id) => {
    try {
      const { data } = await goalAPI.checkProgress(id);
      toast.success(data.met ? 'Goal met today! 🎉' : `Progress: ${data.data.completionRate}%`);
      await fetchGoals();
    } catch (_) {}
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <RiFocusLine className="text-primary-400" /> Habit Goals
          </h1>
          <p className="text-gray-400 text-sm mt-1">Set and track your digital wellness goals</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm); }}
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
          <RiAddLine size={16} /> New Goal
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Goals', value: summary.active, icon: '🎯', color: '#6366f1' },
            { label: 'Avg Completion', value: `${summary.avgCompletion}%`, icon: '📊', color: '#10b981' },
            { label: 'Top Streak', value: `${summary.topStreak}d`, icon: '🔥', color: '#f59e0b' },
            { label: 'Total Goals', value: summary.total, icon: '✅', color: '#a855f7' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-gray-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card p-6 w-full max-w-md"
            >
              <h3 className="text-white font-semibold text-lg mb-4">{editingId ? 'Edit Goal' : 'Create New Goal'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Goal Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Limit social media to 1 hour" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input-field">
                    {GOAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Target Value</label>
                    <input type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: parseInt(e.target.value) })}
                      className="input-field" min="1" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Direction</label>
                    <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}
                      className="input-field">
                      <option value="limit">Stay Below</option>
                      <option value="achieve">Reach Target</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Frequency</label>
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="input-field">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                    {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    {editingId ? 'Update' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => (
            <motion.div
              key={goal._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-hover p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{goal.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{goal.title}</h4>
                      <span className={`badge ${goal.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{goal.status}</span>
                      {goal.streak > 0 && <span className="text-xs text-orange-400">🔥 {goal.streak}d streak</span>}
                    </div>
                    <p className="text-gray-400 text-sm">
                      {goal.direction === 'limit' ? 'Stay below' : 'Reach'} {goal.targetValue} {goal.targetUnit} · {goal.frequency}
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-medium" style={{ color: goal.color }}>{goal.completionRate}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${goal.completionRate}%`, background: goal.color }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCheckProgress(goal._id)}
                    className="p-2 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors" title="Check progress">
                    <RiCheckLine size={16} />
                  </button>
                  <button onClick={() => handleEdit(goal)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    <RiEditLine size={16} />
                  </button>
                  <button onClick={() => handleDelete(goal._id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <RiFocusLine size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-white font-semibold mb-2">No goals yet</h3>
          <p className="text-gray-400 text-sm mb-4">Create your first digital wellness goal to start tracking progress</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-6 py-2">
            Create First Goal
          </button>
        </div>
      )}
    </div>
  );
}

GoalsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
