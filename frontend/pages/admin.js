/**
 * Admin Dashboard Page
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiAdminLine, RiUserLine, RiBarChartLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { adminAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [growth, setGrowth] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.push('/dashboard'); return; }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, growthRes, activityRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ limit: 20 }),
        adminAPI.getUserGrowth(30),
        adminAPI.getActivityReport(7),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data || []);
      setGrowth(growthRes.data.data || []);
      setActivity(activityRes.data.data);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (id) => {
    try {
      const { data } = await adminAPI.toggleUserStatus(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: data.data.isActive } : u));
      toast.success(data.message);
    } catch (_) {}
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <RiAdminLine size={24} className="text-primary-400" />
        <div>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Platform overview and user management</p>
        </div>
        <span className="ml-auto badge-warning">Admin Only</span>
      </div>

      {/* Platform stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#6366f1' },
            { label: 'Active Users', value: stats.activeUsers, icon: '✅', color: '#10b981' },
            { label: 'New This Week', value: stats.newUsersThisWeek, icon: '🆕', color: '#06b6d4' },
            { label: 'Habit Records', value: stats.totalHabits, icon: '📊', color: '#a855f7' },
            { label: 'Focus Sessions', value: stats.totalFocusSessions, icon: '⏱️', color: '#f59e0b' },
            { label: 'AI Reports', value: stats.totalAIReports, icon: '🤖', color: '#ec4899' },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xl font-black" style={{ color: s.color }}>{s.value?.toLocaleString()}</div>
              <div className="text-gray-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">User Growth (30 days)</h3>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={false} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Daily Activity (7 days)</h3>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activity?.habitActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="_id" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Habit Records" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* User management */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2"><RiUserLine /> User Management</h3>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..." className="input-field w-48 text-sm py-2" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/5">
                <th className="text-left py-2 pr-4">User</th>
                <th className="text-left py-2 pr-4">Email</th>
                <th className="text-left py-2 pr-4">Joined</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map((u) => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{u.email}</td>
                  <td className="py-3 pr-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">
                    <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <button onClick={() => handleToggleUser(u._id)}
                      className={`text-xs px-3 py-1 rounded-lg transition-colors ${u.isActive ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'}`}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <p className="text-gray-500 text-center py-8">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}

AdminPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
