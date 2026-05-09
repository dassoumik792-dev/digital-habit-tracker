/**
 * Report Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getFullReport = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const end   = req.query.endDate   || new Date().toISOString().split('T')[0];
  const start = req.query.startDate || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [habitsRes, sessionsRes, scoresRes, goalsRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', uid).gte('date', start).lte('date', end).order('date'),
    supabase.from('focus_sessions').select('*').eq('user_id', uid).gte('start_time', start).lte('start_time', end + 'T23:59:59').order('start_time'),
    supabase.from('productivity_scores').select('*').eq('user_id', uid).gte('date', start).lte('date', end).order('date'),
    supabase.from('goals').select('*').eq('user_id', uid).eq('is_archived', false),
  ]);

  res.json({
    success: true,
    data: {
      period: { startDate: start, endDate: end },
      user: { name: req.user.name, email: req.user.email },
      habits: habitsRes.data || [],
      focusSessions: sessionsRes.data || [],
      productivityScores: scoresRes.data || [],
      goals: goalsRes.data || [],
      generatedAt: new Date(),
    },
  });
});
