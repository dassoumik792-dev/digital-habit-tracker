/**
 * Goal Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

exports.getGoals = asyncHandler(async (req, res) => {
  let query = supabase.from('goals').select('*').eq('user_id', req.user.id).eq('is_archived', false).order('created_at', { ascending: false });
  if (req.query.status) query = query.eq('status', req.query.status);
  if (req.query.type)   query = query.eq('type', req.query.type);
  const { data, error } = await query;
  if (error) throw new AppError(error.message, 400);
  res.json({ success: true, count: data.length, data });
});

exports.getGoal = asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('goals').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (error || !data) throw new AppError('Goal not found', 404);
  res.json({ success: true, data });
});

exports.createGoal = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('goals')
    .insert({ ...req.body, user_id: req.user.id })
    .select().single();
  if (error) throw new AppError(error.message, 400);
  res.status(201).json({ success: true, data });
});

exports.updateGoal = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('goals').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error || !data) throw new AppError('Goal not found', 404);
  res.json({ success: true, data });
});

exports.deleteGoal = asyncHandler(async (req, res) => {
  const { error } = await supabase.from('goals').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) throw new AppError(error.message, 400);
  res.json({ success: true, message: 'Goal deleted' });
});

exports.checkGoalProgress = asyncHandler(async (req, res) => {
  const { data: goal, error } = await supabase.from('goals').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (error || !goal) throw new AppError('Goal not found', 404);

  const today = new Date().toISOString().split('T')[0];
  const { data: habit } = await supabase.from('habits').select('*').eq('user_id', req.user.id).eq('date', today).single();

  let currentValue = goal.current_value;
  if (habit) {
    const valueMap = { screen_time: habit.screen_time_total, focus: habit.focus_score, productivity: habit.productivity_score, social_media: habit.social_media_time };
    currentValue = valueMap[goal.type] ?? goal.current_value;
  }

  const met = goal.direction === 'limit' ? currentValue <= goal.target_value : currentValue >= goal.target_value;
  const completionRate = goal.direction === 'limit'
    ? Math.max(0, Math.round((1 - currentValue / goal.target_value) * 100))
    : Math.min(100, Math.round((currentValue / goal.target_value) * 100));

  const newStreak = met ? (goal.streak || 0) + 1 : 0;
  const history = [...(goal.progress_history || []), { date: today, value: currentValue, met }].slice(-30);

  const { data: updated } = await supabase
    .from('goals')
    .update({ current_value: currentValue, completion_rate: completionRate, streak: newStreak, best_streak: Math.max(goal.best_streak || 0, newStreak), last_checked: new Date().toISOString(), progress_history: history })
    .eq('id', goal.id).select().single();

  if (met && newStreak % 7 === 0) {
    await supabase.from('notifications').insert({ user_id: req.user.id, type: 'goal_achieved', title: `${newStreak}-Day Streak! 🔥`, message: `You've maintained "${goal.title}" for ${newStreak} days!`, icon: '🏆', priority: 'high' });
  }

  res.json({ success: true, data: updated, met, currentValue });
});

exports.getGoalsSummary = asyncHandler(async (req, res) => {
  const { data: goals } = await supabase.from('goals').select('*').eq('user_id', req.user.id).eq('is_archived', false);
  const g = goals || [];
  res.json({
    success: true,
    data: {
      summary: {
        total: g.length,
        active: g.filter((x) => x.status === 'active').length,
        avgCompletion: g.length ? Math.round(g.reduce((a, x) => a + (x.completion_rate || 0), 0) / g.length) : 0,
        topStreak: g.length ? Math.max(...g.map((x) => x.streak || 0)) : 0,
      },
      goals: g,
    },
  });
});
