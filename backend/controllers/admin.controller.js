/**
 * Admin Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getPlatformStats = asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [totalUsers, activeUsers, totalHabits, totalSessions, totalReports, newUsers] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'user').eq('is_active', true),
    supabase.from('habits').select('id', { count: 'exact', head: true }),
    supabase.from('focus_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('ai_reports').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers: totalUsers.count || 0,
      activeUsers: activeUsers.count || 0,
      totalHabits: totalHabits.count || 0,
      totalFocusSessions: totalSessions.count || 0,
      totalAIReports: totalReports.count || 0,
      newUsersThisWeek: newUsers.count || 0,
    },
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase.from('users').select('id, name, email, role, is_active, created_at, last_login, streak_current, total_points', { count: 'exact' })
    .eq('role', 'user').order('created_at', { ascending: false }).range(from, to);

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error, count } = await query;
  res.json({ success: true, count: data?.length || 0, total: count, data: data || [] });
});

exports.getUserGrowth = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date(Date.now() - days * 86400000).toISOString();

  const { data } = await supabase.from('users').select('created_at').eq('role', 'user').gte('created_at', startDate).order('created_at');

  // Group by date
  const grouped = {};
  (data || []).forEach((u) => {
    const d = u.created_at.split('T')[0];
    grouped[d] = (grouped[d] || 0) + 1;
  });

  const growth = Object.entries(grouped).map(([_id, count]) => ({ _id, count }));
  res.json({ success: true, data: growth });
});

exports.getActivityReport = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const [{ data: habits }, { data: sessions }] = await Promise.all([
    supabase.from('habits').select('date, focus_score').gte('date', startDate).order('date'),
    supabase.from('focus_sessions').select('start_time, actual_duration').eq('status', 'completed').gte('start_time', startDate).order('start_time'),
  ]);

  // Group habits by date
  const habitMap = {};
  (habits || []).forEach((h) => {
    const d = h.date;
    if (!habitMap[d]) habitMap[d] = { _id: d, count: 0, avgFocus: 0, total: 0 };
    habitMap[d].count++;
    habitMap[d].total += h.focus_score || 0;
  });
  const habitActivity = Object.values(habitMap).map((x) => ({ ...x, avgFocus: Math.round(x.total / x.count) }));

  // Group sessions by date
  const sessionMap = {};
  (sessions || []).forEach((s) => {
    const d = s.start_time.split('T')[0];
    if (!sessionMap[d]) sessionMap[d] = { _id: d, count: 0, totalMinutes: 0 };
    sessionMap[d].count++;
    sessionMap[d].totalMinutes += s.actual_duration || 0;
  });

  res.json({ success: true, data: { habitActivity, focusActivity: Object.values(sessionMap) } });
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const { data: user } = await supabase.from('users').select('is_active').eq('id', req.params.id).single();
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { data: updated } = await supabase.from('users').update({ is_active: !user.is_active }).eq('id', req.params.id).select().single();
  res.json({ success: true, message: `User ${updated.is_active ? 'activated' : 'deactivated'}`, data: updated });
});
