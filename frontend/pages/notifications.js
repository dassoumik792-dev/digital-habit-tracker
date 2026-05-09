/**
 * Notifications Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { RiBellLine, RiCheckDoubleLine, RiDeleteBinLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { notificationAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const typeIcons = {
  streak_reminder: '🔥', goal_achieved: '🏆', goal_failed: '❌',
  weekly_report: '📊', ai_insight: '🧠', screen_time_warning: '⚠️',
  focus_reminder: '⏱️', achievement_unlocked: '🎖️', productivity_warning: '📉',
  motivation: '💪', system: '🔔',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchNotifications();
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ limit: 50 });
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (_) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (_) {}
  };

  const priorityColors = { urgent: '#ef4444', high: '#f59e0b', medium: '#6366f1', low: '#6b7280' };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <RiBellLine className="text-primary-400" /> Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-normal px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                {unreadCount} unread
              </span>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
              <RiCheckDoubleLine size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="flex items-center gap-2 text-sm py-2 px-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
              style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
              <RiDeleteBinLine size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`p-4 rounded-2xl flex items-start gap-3 transition-all ${!notif.isRead ? 'border-l-2' : ''}`}
              style={{
                background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.06)',
                border: notif.isRead ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.15)',
                borderLeftColor: !notif.isRead ? priorityColors[notif.priority] : undefined,
              }}
            >
              <span className="text-2xl flex-shrink-0">{typeIcons[notif.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-medium text-sm ${notif.isRead ? 'text-gray-300' : 'text-white'}`}>{notif.title}</h4>
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">{notif.message}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notif.isRead && (
                  <button onClick={() => handleMarkRead(notif._id)}
                    className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-400/10 transition-colors" title="Mark as read">
                    <RiCheckDoubleLine size={14} />
                  </button>
                )}
                <button onClick={() => handleDelete(notif._id)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <RiBellLine size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-white font-semibold mb-2">All caught up!</h3>
          <p className="text-gray-400 text-sm">No notifications yet. We'll notify you about your progress and achievements.</p>
        </div>
      )}
    </div>
  );
}

NotificationsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
