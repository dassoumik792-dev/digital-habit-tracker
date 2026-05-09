/**
 * Focus Session Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

exports.getSessions = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1, status } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase.from('focus_sessions').select('*', { count: 'exact' })
    .eq('user_id', req.user.id).order('start_time', { ascending: false }).range(from, to);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 400);
  res.json({ success: true, count: data.length, total: count, data });
});

exports.getActiveSession = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('focus_sessions').select('*').eq('user_id', req.user.id).eq('status', 'active').single();
  res.json({ success: true, data: data || null });
});

exports.getFocusStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = new Date(Date.now() - days * 86400000).toISOString();

  const { data: sessions } = await supabase
    .from('focus_sessions').select('*').eq('user_id', req.user.id)
    .gte('start_time', startDate).in('status', ['completed', 'abandoned']);

  const s = sessions || [];
  const completed = s.filter((x) => x.status === 'completed');
  const totalMinutes = completed.reduce((a, x) => a + (x.actual_duration || 0), 0);
  const rated = completed.filter((x) => x.focus_quality);

  res.json({
    success: true,
    data: {
      totalSessions: s.length,
      completedSessions: completed.length,
      totalMinutes,
      avgDuration: completed.length ? Math.round(totalMinutes / completed.length) : 0,
      avgQuality: rated.length ? Math.round(rated.reduce((a, x) => a + x.focus_quality, 0) / rated.length * 10) / 10 : 0,
      completionRate: s.length ? Math.round((completed.length / s.length) * 100) : 0,
      longestSession: completed.length ? Math.max(...completed.map((x) => x.actual_duration || 0)) : 0,
    },
  });
});

exports.startSession = asyncHandler(async (req, res) => {
  const { type = 'pomodoro', plannedDuration = 25, task, category } = req.body;

  const { data: active } = await supabase.from('focus_sessions').select('id').eq('user_id', req.user.id).eq('status', 'active').single();
  if (active) throw new AppError('You already have an active session. Complete or abandon it first.', 400);

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({ user_id: req.user.id, type, planned_duration: plannedDuration, task: task || '', category: category || 'work', start_time: new Date().toISOString(), status: 'active' })
    .select().single();

  if (error) throw new AppError(error.message, 400);
  res.status(201).json({ success: true, data });
});

exports.completeSession = asyncHandler(async (req, res) => {
  const { data: session } = await supabase.from('focus_sessions').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!session) throw new AppError('Session not found', 404);
  if (session.status !== 'active') throw new AppError('Session is not active', 400);

  const endTime = new Date();
  const actualDuration = Math.round((endTime - new Date(session.start_time)) / 60000);
  const completionPct = Math.min(100, Math.round((actualDuration / session.planned_duration) * 100));

  const { data: updated } = await supabase
    .from('focus_sessions')
    .update({ status: 'completed', end_time: endTime.toISOString(), actual_duration: actualDuration, completion_percentage: completionPct, focus_quality: req.body.focusQuality || null, notes: req.body.notes || '', distraction_count: req.body.distractionCount || 0 })
    .eq('id', req.params.id).select().single();

  // Award points
  const points = Math.round(actualDuration * 0.5);
  await supabase.from('users').update({ total_points: supabase.rpc ? undefined : undefined }).eq('id', req.user.id);
  // Use raw SQL increment via RPC or just fetch+update
  const { data: user } = await supabase.from('users').select('total_points').eq('id', req.user.id).single();
  await supabase.from('users').update({ total_points: (user?.total_points || 0) + points }).eq('id', req.user.id);

  // Milestone notifications
  const { count } = await supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('status', 'completed');
  if ([10, 25, 50, 100].includes(count)) {
    await supabase.from('notifications').insert({ user_id: req.user.id, type: 'achievement_unlocked', title: `${count} Focus Sessions! 🎉`, message: `You've completed ${count} focus sessions. Incredible focus habits!`, icon: '🏆', priority: 'high' });
  }

  res.json({ success: true, data: updated, pointsEarned: points });
});

exports.abandonSession = asyncHandler(async (req, res) => {
  const { data: session } = await supabase.from('focus_sessions').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!session) throw new AppError('Session not found', 404);

  const endTime = new Date();
  const actualDuration = Math.round((endTime - new Date(session.start_time)) / 60000);

  const { data: updated } = await supabase
    .from('focus_sessions')
    .update({ status: 'abandoned', end_time: endTime.toISOString(), actual_duration: actualDuration, completion_percentage: Math.min(100, Math.round((actualDuration / session.planned_duration) * 100)) })
    .eq('id', req.params.id).select().single();

  res.json({ success: true, data: updated });
});
