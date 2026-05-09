/**
 * Dashboard Page
 * Main analytics overview with real-time stats
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  RiTimeLine, RiFlashlightLine, RiBrainLine, RiFireLine,
  RiArrowUpLine, RiArrowDownLine, RiRefreshLine, RiDatabase2Line,
} from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { analyticsAPI, habitAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ title, value, unit, change, icon: Icon, color, loading }) {
  const isPositive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-5"
    >
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-8 w-16 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
              <Icon size={16} style={{ color }} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-white">{value}</span>
            {unit && <span className="text-gray-400 text-sm mb-1">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <RiArrowUpLine size={12} /> : <RiArrowDownLine size={12} />}
              {Math.abs(change)}% vs last week
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, weeklyRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getWeekly(),
      ]);
      setOverview(overviewRes.data.data);
      setWeeklyData(weeklyRes.data.data.chartData || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await habitAPI.seedDemo();
      toast.success('Demo data seeded! Refreshing...');
      await fetchData();
    } catch (err) {
      toast.error('Failed to seed demo data');
    } finally {
      setSeeding(false);
    }
  };

  const today = overview?.today;
  const improvements = overview?.improvements || {};

  // Category pie data
  const categoryData = today ? [
    { name: 'Productive', value: today.screenTime?.productive || 0 },
    { name: 'Unproductive', value: today.screenTime?.unproductive || 0 },
    { name: 'Neutral', value: today.screenTime?.neutral || 0 },
  ].filter((d) => d.value > 0) : [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
          >
            {seeding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RiDatabase2Line size={14} />}
            Seed Demo Data
          </button>
          <button onClick={fetchData} className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <RiRefreshLine size={16} />
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Screen Time Today"
          value={today ? Math.round(today.screenTime?.total / 60 * 10) / 10 : 0}
          unit="hrs"
          change={improvements.screenTime}
          icon={RiTimeLine}
          color="#6366f1"
          loading={loading}
        />
        <StatCard
          title="Focus Score"
          value={today?.focusScore || 0}
          unit="/100"
          change={improvements.focusScore}
          icon={RiFlashlightLine}
          color="#06b6d4"
          loading={loading}
        />
        <StatCard
          title="Productivity"
          value={today?.productivityScore || 0}
          unit="%"
          change={improvements.productivity}
          icon={RiBrainLine}
          color="#a855f7"
          loading={loading}
        />
        <StatCard
          title="Current Streak"
          value={user?.streak?.current || 0}
          unit="days"
          icon={RiFireLine}
          color="#f59e0b"
          loading={loading}
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly screen time chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Weekly Screen Time</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorProductive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUnproductive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="productive" stroke="#6366f1" fill="url(#colorProductive)" strokeWidth={2} name="Productive (min)" />
                <Area type="monotone" dataKey="unproductive" stroke="#ef4444" fill="url(#colorUnproductive)" strokeWidth={2} name="Unproductive (min)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Today's breakdown pie */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Today's Breakdown</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }}
                    formatter={(v) => [`${v} min`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}m</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              No data for today yet
            </div>
          )}
        </div>
      </div>

      {/* ── Focus Score + Weekly Bar Chart ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Focus score trend */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Focus Score Trend</h3>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="focusScore" fill="#6366f1" radius={[4, 4, 0, 0]} name="Focus Score" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick stats */}
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Today's Highlights</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Deep Work', value: `${today?.deepWorkMinutes || 0} min`, color: '#6366f1', icon: '🎯' },
                { label: 'Social Media', value: `${today?.socialMediaTime || 0} min`, color: '#ef4444', icon: '📱' },
                { label: 'Night Usage', value: `${today?.nightUsage || 0} min`, color: '#f59e0b', icon: '🌙' },
                { label: 'Distractions', value: `${today?.distractionCount || 0} times`, color: '#a855f7', icon: '⚡' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-gray-300 text-sm">{item.label}</span>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Mood & Energy ────────────────────────────────────────────────────── */}
      {today && (
        <div className="glass-card p-6">
          <h3 className="text-white font-semibold mb-4">Today's Mood & Energy</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {today.mood === 'excellent' ? '😄' : today.mood === 'good' ? '🙂' : today.mood === 'neutral' ? '😐' : today.mood === 'bad' ? '😕' : '😞'}
              </span>
              <div>
                <p className="text-gray-400 text-xs">Mood</p>
                <p className="text-white font-medium capitalize">{today.mood || 'Not set'}</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-gray-400 text-xs">Energy Level</p>
                <p className="text-white text-xs font-medium">{today.energyLevel || 5}/10</p>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(today.energyLevel || 5) * 10}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DashboardPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
