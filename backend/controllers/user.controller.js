/**
 * User Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

exports.getProfile = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (error) throw new AppError('Profile not found', 404);
  res.json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'avatar', 'bio', 'occupation', 'timezone', 'age_group'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const { data, error } = await supabase
    .from('users').update(updates).eq('id', req.user.id).select().single();
  if (error) throw new AppError(error.message, 400);
  res.json({ success: true, data });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const allowed = [
    'daily_screen_time_limit', 'focus_goal_minutes', 'work_start_hour', 'work_end_hour',
    'notif_email', 'notif_push', 'notif_reminders', 'notif_weekly_report',
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const { data, error } = await supabase
    .from('users').update(updates).eq('id', req.user.id).select().single();
  if (error) throw new AppError(error.message, 400);
  res.json({ success: true, data });
});

exports.getUserStats = asyncHandler(async (req, res) => {
  const uid = req.user.id;

  const [habitsRes, sessionsRes, completedRes, minutesRes, profileRes] = await Promise.all([
    supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid),
    supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'completed'),
    supabase.from('focus_sessions').select('actual_duration').eq('user_id', uid).eq('status', 'completed'),
    supabase.from('users').select('streak_current, streak_longest, total_points, level, badges').eq('id', uid).single(),
  ]);

  const totalFocusMinutes = (minutesRes.data || []).reduce((a, s) => a + (s.actual_duration || 0), 0);

  res.json({
    success: true,
    data: {
      totalHabitsTracked: habitsRes.count || 0,
      totalFocusSessions: sessionsRes.count || 0,
      completedFocusSessions: completedRes.count || 0,
      totalFocusMinutes,
      streak: { current: profileRes.data?.streak_current, longest: profileRes.data?.streak_longest },
      totalPoints: profileRes.data?.total_points,
      level: profileRes.data?.level,
      badges: profileRes.data?.badges,
    },
  });
});

exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, avatar, total_points, level, streak_current')
    .eq('is_active', true)
    .eq('role', 'user')
    .order('total_points', { ascending: false })
    .limit(20);

  if (error) throw new AppError(error.message, 400);

  const leaderboard = (data || []).map((u, i) => ({
    rank: i + 1,
    name: u.name,
    avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`,
    points: u.total_points,
    level: u.level,
    streak: u.streak_current,
  }));

  res.json({ success: true, data: leaderboard });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await supabase.from('users').update({ is_active: false }).eq('id', req.user.id);
  res.json({ success: true, message: 'Account deactivated' });
});
