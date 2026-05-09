/**
 * Habit Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error.middleware');
const { computeProductivityScore } = require('../utils/scoreCalculator');
const { generateMockHabitData } = require('../utils/mockDataGenerator');

// ── GET /api/habits/today ─────────────────────────────────────────────────────
exports.getTodayHabit = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  let { data, error } = await supabase
    .from('habits').select('*').eq('user_id', req.user.id).eq('date', today).single();

  // Auto-create today's record with mock data if it doesn't exist
  if (!data) {
    const mock = generateMockHabitData(0);
    const { data: created, error: createError } = await supabase
      .from('habits')
      .insert({ user_id: req.user.id, date: today, ...flattenHabit(mock) })
      .select().single();
    if (createError) throw new AppError(createError.message, 400);
    data = created;
  }

  res.json({ success: true, data });
});

// ── GET /api/habits ───────────────────────────────────────────────────────────
exports.getHabits = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 30, page = 1 } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase.from('habits').select('*', { count: 'exact' })
    .eq('user_id', req.user.id).order('date', { ascending: false }).range(from, to);

  if (startDate) query = query.gte('date', startDate);
  if (endDate)   query = query.lte('date', endDate);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 400);

  res.json({ success: true, count: data.length, total: count, data });
});

// ── POST /api/habits ──────────────────────────────────────────────────────────
exports.createHabit = asyncHandler(async (req, res) => {
  const date = req.body.date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('habits')
    .insert({ user_id: req.user.id, date, ...flattenHabit(req.body) })
    .select().single();

  if (error) {
    if (error.code === '23505') throw new AppError('A habit record for this date already exists.', 400);
    throw new AppError(error.message, 400);
  }

  await upsertProductivityScore(req.user.id, date, data);
  res.status(201).json({ success: true, data });
});

// ── PUT /api/habits/:id ───────────────────────────────────────────────────────
exports.updateHabit = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('habits')
    .update(flattenHabit(req.body))
    .eq('id', req.params.id).eq('user_id', req.user.id)
    .select().single();

  if (error) throw new AppError(error.message, 400);
  if (!data) throw new AppError('Habit not found', 404);

  await upsertProductivityScore(req.user.id, data.date, data);
  res.json({ success: true, data });
});

// ── DELETE /api/habits/:id ────────────────────────────────────────────────────
exports.deleteHabit = asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('habits').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) throw new AppError(error.message, 400);
  res.json({ success: true, message: 'Habit deleted' });
});

// ── POST /api/habits/seed-demo ────────────────────────────────────────────────
exports.seedDemoData = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const seeded = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];

    // Skip if already exists
    const { data: existing } = await supabase
      .from('habits').select('id').eq('user_id', uid).eq('date', date).single();
    if (existing) continue;

    const mock = generateMockHabitData(i);
    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: uid, date, ...flattenHabit(mock) })
      .select().single();

    if (!error && data) {
      await upsertProductivityScore(uid, date, data);
      seeded.push(date);
    }
  }

  res.json({ success: true, message: `Seeded ${seeded.length} days of demo data`, seededDates: seeded });
});

// ── GET /api/habits/weekly-summary ───────────────────────────────────────────
exports.getWeeklySummary = asyncHandler(async (req, res) => {
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];

  const { data: habits, error } = await supabase
    .from('habits').select('*').eq('user_id', req.user.id)
    .gte('date', start).lte('date', end).order('date');

  if (error) throw new AppError(error.message, 400);

  const n = habits.length || 1;
  const sum = (key) => habits.reduce((a, h) => a + (h[key] || 0), 0);

  res.json({
    success: true,
    data: {
      summary: {
        totalScreenTime: sum('screen_time_total'),
        avgFocusScore: Math.round(sum('focus_score') / n),
        avgProductivityScore: Math.round(sum('productivity_score') / n),
        totalDeepWork: sum('deep_work_minutes'),
        totalSocialMedia: sum('social_media_time'),
        totalNightUsage: sum('night_usage'),
        days: habits.length,
      },
      habits,
    },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map camelCase habit fields to snake_case Supabase columns */
function flattenHabit(body) {
  const out = {};
  const map = {
    screenTime: { total: 'screen_time_total', productive: 'screen_time_productive', unproductive: 'screen_time_unproductive', neutral: 'screen_time_neutral' },
    categoryBreakdown: { social: 'cat_social', productivity: 'cat_productivity', entertainment: 'cat_entertainment', education: 'cat_education', communication: 'cat_communication', news: 'cat_news', gaming: 'cat_gaming', other: 'cat_other' },
  };

  if (body.screenTime) {
    Object.entries(map.screenTime).forEach(([k, col]) => { if (body.screenTime[k] !== undefined) out[col] = body.screenTime[k]; });
  }
  if (body.categoryBreakdown) {
    Object.entries(map.categoryBreakdown).forEach(([k, col]) => { if (body.categoryBreakdown[k] !== undefined) out[col] = body.categoryBreakdown[k]; });
  }

  const direct = [
    'app_usage', 'focus_score', 'productivity_score', 'distraction_count',
    'deep_work_minutes', 'night_usage', 'morning_usage', 'doom_scrolling_time',
    'social_media_time', 'mood', 'energy_level', 'hourly_activity',
    'goals_met_today', 'goals_total_today', 'notes',
  ];
  direct.forEach((k) => { if (body[k] !== undefined) out[k] = body[k]; });

  // Also accept camelCase versions
  const camelToSnake = {
    focusScore: 'focus_score', productivityScore: 'productivity_score',
    distractionCount: 'distraction_count', deepWorkMinutes: 'deep_work_minutes',
    nightUsage: 'night_usage', morningUsage: 'morning_usage',
    doomScrollingTime: 'doom_scrolling_time', socialMediaTime: 'social_media_time',
    energyLevel: 'energy_level', hourlyActivity: 'hourly_activity',
    goalsMetToday: 'goals_met_today', goalsTotalToday: 'goals_total_today',
    appUsage: 'app_usage',
  };
  Object.entries(camelToSnake).forEach(([camel, snake]) => {
    if (body[camel] !== undefined) out[snake] = body[camel];
  });

  return out;
}

async function upsertProductivityScore(userId, date, habit) {
  const scores = computeProductivityScore({
    screenTime: { total: habit.screen_time_total, productive: habit.screen_time_productive, unproductive: habit.screen_time_unproductive },
    focusScore: habit.focus_score,
    productivityScore: habit.productivity_score,
    deepWorkMinutes: habit.deep_work_minutes,
    distractionCount: habit.distraction_count,
    nightUsage: habit.night_usage,
    doomScrollingTime: habit.doom_scrolling_time,
    socialMediaTime: habit.social_media_time,
    energyLevel: habit.energy_level,
    mood: habit.mood,
    goalCompletionRate: habit.goals_total_today > 0 ? Math.round((habit.goals_met_today / habit.goals_total_today) * 100) : 0,
    addictionRiskScore: 0,
  });

  await supabase.from('productivity_scores').upsert({
    user_id: userId,
    date,
    focus_score: scores.focusScore,
    productivity_score: scores.productivityScore,
    wellbeing_score: scores.wellbeingScore,
    digital_balance_score: scores.digitalBalanceScore,
    addiction_risk_score: scores.addictionRiskScore,
    mental_fatigue_score: scores.mentalFatigueScore,
    attention_consistency_score: scores.attentionConsistencyScore,
    deep_work_efficiency_score: scores.deepWorkEfficiencyScore,
    overall_score: scores.overallScore,
    breakdown: scores.breakdown,
  }, { onConflict: 'user_id,date' });
}
