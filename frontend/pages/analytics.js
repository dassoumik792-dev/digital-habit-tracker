/**
 * Analytics Page
 * Deep analytics with heatmaps, trends, and app usage
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import DashboardLayout from '../components/layout/DashboardLayout';
import { analyticsAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  social: '#ec4899', productivity: '#6366f1', entertainment: '#f59e0b',
  education: '#10b981', communication: '#06b6d4', news: '#8b5cf6',
  gaming: '#ef4444', other: '#6b7280',
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [appUsage, setAppUsage] = useState([]);
  const [hourlyPattern, setHourlyPattern] = useState([]);
  const [productivityTrend, setProductivityTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [weekly, monthly, apps, hourly, trend] = await Promise.all([
        analyticsAPI.getWeekly(),
        analyticsAPI.getMonthly(),
        analyticsAPI.getAppUsage(7),
        analyticsAPI.getHourlyPattern(7),
        analyticsAPI.getProductivityTrend(30),
      ]);
      setWeeklyData(weekly.data.data.chartData || []);
      setMonthlyData(monthly.data.data.chartData || []);
      setAppUsage(apps.data.data || []);
      setHourlyPattern(hourly.data.data || []);
      setProductivityTrend(trend.data.data || []);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['weekly', 'monthly', 'apps', 'hourly', 'trends'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Deep insights into your digital behavior</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            style={activeTab === tab ? {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.1))',
              border: '1px solid rgba(99,102,241,0.3)',
            } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* ── Weekly Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'weekly' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Weekly Screen Time Breakdown</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="productive" fill="#6366f1" radius={[4, 4, 0, 0]} name="Productive (min)" stackId="a" />
                    <Bar dataKey="unproductive" fill="#ef4444" radius={[4, 4, 0, 0]} name="Unproductive (min)" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                  <h3 className="text-white font-semibold mb-4">Focus Score This Week</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="focusScore" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 4 }} name="Focus Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-white font-semibold mb-4">Deep Work vs Social Media</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={weeklyData}>
                      <defs>
                        <linearGradient id="deepWork" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="socialMedia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="deepWork" stroke="#10b981" fill="url(#deepWork)" strokeWidth={2} name="Deep Work (min)" />
                      <Area type="monotone" dataKey="socialMedia" stroke="#ec4899" fill="url(#socialMedia)" strokeWidth={2} name="Social Media (min)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Monthly Tab ────────────────────────────────────────────────── */}
          {activeTab === 'monthly' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Monthly Productivity Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="monthProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="productivityScore" stroke="#6366f1" fill="url(#monthProd)" strokeWidth={2} name="Productivity Score" />
                    <Area type="monotone" dataKey="focusScore" stroke="#06b6d4" fill="none" strokeWidth={2} strokeDasharray="5 5" name="Focus Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* ── Apps Tab ───────────────────────────────────────────────────── */}
          {activeTab === 'apps' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">Top Apps & Websites (Last 7 Days)</h3>
                <div className="space-y-3">
                  {appUsage.slice(0, 10).map((app, i) => {
                    const maxDuration = appUsage[0]?.duration || 1;
                    const pct = Math.round((app.duration / maxDuration) * 100);
                    return (
                      <div key={app.name} className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-medium">{app.name}</span>
                              <span className="badge text-xs px-2 py-0.5 rounded-full"
                                style={{ background: `${CATEGORY_COLORS[app.category]}20`, color: CATEGORY_COLORS[app.category], border: `1px solid ${CATEGORY_COLORS[app.category]}30` }}>
                                {app.category}
                              </span>
                              {app.isDistracting && <span className="badge-warning text-xs">⚠ Distracting</span>}
                            </div>
                            <span className="text-gray-400 text-sm">{app.duration}m</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: CATEGORY_COLORS[app.category] }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {appUsage.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No app usage data yet. Seed demo data to see this.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Hourly Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'hourly' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-2">Hourly Activity Pattern</h3>
                <p className="text-gray-400 text-sm mb-4">Average screen activity per hour (last 7 days)</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={hourlyPattern}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }} />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} name="Activity (min)">
                      {hourlyPattern.map((entry, i) => (
                        <Cell key={i} fill={entry.hour >= 22 || entry.hour < 6 ? '#ef4444' : entry.hour >= 9 && entry.hour <= 17 ? '#6366f1' : '#a855f7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#6366f1' }} /> Work hours</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#a855f7' }} /> Evening</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} /> Late night</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Trends Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'trends' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-semibold mb-4">30-Day Productivity Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} interval={4} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'rgba(26,26,46,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px' }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                    <Line type="monotone" dataKey="overallScore" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Overall Score" />
                    <Line type="monotone" dataKey="focusScore" stroke="#06b6d4" strokeWidth={2} dot={false} name="Focus Score" />
                    <Line type="monotone" dataKey="productivityScore" stroke="#10b981" strokeWidth={2} dot={false} name="Productivity" />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

AnalyticsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
