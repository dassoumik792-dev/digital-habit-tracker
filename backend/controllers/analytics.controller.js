/**
 * Analytics Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/error.middleware');

const dateStr = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => dateStr(new Date(Date.now() - n * 86400000));

// ── GET /api/analytics/overview ──────────────────────────────────────────────
exports.getOverview = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const today = dateStr(new Date());
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);

  const [todayRes, thisWeekRes, lastWeekRes, scoresRes, profileRes] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', uid).eq('date', today).single(),
    supabase.from('habits').select('*').eq('user_id', uid).gte('date', weekAgo).lte('date', today),
    supabase.from('habits').select('*').eq('user_id', uid).gte('date', twoWeeksAgo).lt('date', weekAgo),
    supabase.from('productivity_scores').select('*').eq('user_id', uid).gte('date', weekAgo).order('date'),
    supabase.from('users').select('streak_current, streak_longest').eq('id', uid).single(),
  ]);

  const thisWeekAvg = weekAvg(thisWeekRes.data || []);
  const lastWeekAvg = weekAvg(lastWeekRes.data || []);

  res.json({
    success: true,
    data: {
      today: todayRes.data,
      thisWeek: thisWeekAvg,
      lastWeek: lastWeekAvg,
      improvements: {
        screenTime:  calcImprovement(lastWeekAvg.screenTime, thisWeekAvg.screenTime, true),
        focusScore:  calcImprovement(lastWeekAvg.focusScore, thisWeekAvg.focusScore),
        productivity: calcImprovement(lastWeekAvg.productivity, thisWeekAvg.productivity),
        socialMedia: calcImprovement(lastWeekAvg.socialMedia, thisWeekAvg.socialMedia, true),
      },
      recentScores: scoresRes.data || [],
      streakInfo: profileRes.data,
    },
  });
});

// ── GET /api/analytics/weekly ─────────────────────────────────────────────────
exports.getWeeklyAnalytics = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const weeksBack = parseInt(req.query.weeksBack) || 0;
  const endDate = dateStr(new Date(Date.now() - weeksBack * 7 * 86400000));
  const startDate = dateStr(new Date(Date.now() - (weeksBack * 7 + 6) * 86400000));

  const { data: habits } = await supabase
    .from('habits').select('*').eq('user_id', uid)
    .gte('date', startDate).lte('date', endDate).order('date');

  res.json({
    success: true,
    data: { chartData: buildChartData(habits || [], startDate, 7), period: { startDate, endDate } },
  });
});

// ── GET /api/analytics/monthly ────────────────────────────────────────────────
exports.getMonthlyAnalytics = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const now = new Date();
  const year  = parseInt(req.query.year)  || now.getFullYear();
  const month = parseInt(req.query.month) ?? now.getMonth();

  const startDate = dateStr(new Date(year, month, 1));
  const endDate   = dateStr(new Date(year, month + 1, 0));
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { data: habits } = await supabase
    .from('habits').select('*').eq('user_id', uid)
    .gte('date', startDate).lte('date', endDate).order('date');

  const h = habits || [];
  const categoryTotals = h.reduce((acc, row) => {
    ['social','productivity','entertainment','education','communication','news','gaming','other'].forEach((cat) => {
      acc[cat] = (acc[cat] || 0) + (row[`cat_${cat}`] || 0);
    });
    return acc;
  }, {});

  res.json({
    success: true,
    data: { chartData: buildChartData(h, startDate, daysInMonth), categoryTotals, period: { startDate, endDate } },
  });
});

// ── GET /api/analytics/heatmap ────────────────────────────────────────────────
exports.getHeatmap = asyncHandler(async (req, res) => {
  const startDate = daysAgo(364);

  const { data } = await supabase
    .from('habits')
    .select('date, focus_score, productivity_score, screen_time_total')
    .eq('user_id', req.user.id)
    .gte('date', startDate)
    .order('date');

  const heatmap = (data || []).map((h) => ({
    date: h.date,
    value: h.focus_score,
    screenTime: h.screen_time_total,
    productivity: h.productivity_score,
  }));

  res.json({ success: true, data: heatmap });
});

// ── GET /api/analytics/app-usage ─────────────────────────────────────────────
exports.getAppUsage = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = daysAgo(days);

  const { data } = await supabase
    .from('habits').select('app_usage').eq('user_id', req.user.id).gte('date', startDate);

  const appMap = {};
  (data || []).forEach((row) => {
    (row.app_usage || []).forEach((app) => {
      if (!appMap[app.name]) appMap[app.name] = { ...app, duration: 0, sessions: 0 };
      appMap[app.name].duration += app.duration || 0;
      appMap[app.name].sessions += app.sessions || 0;
    });
  });

  const appList = Object.values(appMap).sort((a, b) => b.duration - a.duration);
  res.json({ success: true, data: appList });
});

// ── GET /api/analytics/productivity-trend ────────────────────────────────────
exports.getProductivityTrend = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const startDate = daysAgo(days);

  const { data } = await supabase
    .from('productivity_scores').select('*').eq('user_id', req.user.id)
    .gte('date', startDate).order('date');

  res.json({ success: true, data: data || [] });
});

// ── GET /api/analytics/hourly-pattern ────────────────────────────────────────
exports.getHourlyPattern = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = daysAgo(days);

  const { data } = await supabase
    .from('habits').select('hourly_activity').eq('user_id', req.user.id).gte('date', startDate);

  const hourlyAvg = Array(24).fill(0);
  const rows = data || [];
  if (rows.length > 0) {
    rows.forEach((row) => {
      (row.hourly_activity || []).forEach((val, i) => { hourlyAvg[i] += val; });
    });
    hourlyAvg.forEach((_, i) => { hourlyAvg[i] = Math.round(hourlyAvg[i] / rows.length); });
  }

  res.json({
    success: true,
    data: hourlyAvg.map((value, hour) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      value,
    })),
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function weekAvg(habits) {
  if (!habits.length) return { screenTime: 0, focusScore: 0, productivity: 0, socialMedia: 0 };
  const n = habits.length;
  return {
    screenTime:   Math.round(habits.reduce((a, h) => a + (h.screen_time_total || 0), 0) / n),
    focusScore:   Math.round(habits.reduce((a, h) => a + (h.focus_score || 0), 0) / n),
    productivity: Math.round(habits.reduce((a, h) => a + (h.productivity_score || 0), 0) / n),
    socialMedia:  Math.round(habits.reduce((a, h) => a + (h.social_media_time || 0), 0) / n),
  };
}

function calcImprovement(prev, curr, lowerIsBetter = false) {
  if (!prev) return 0;
  const change = ((curr - prev) / prev) * 100;
  return lowerIsBetter ? -Math.round(change) : Math.round(change);
}

function buildChartData(habits, startDate, days) {
  const map = {};
  habits.forEach((h) => { map[h.date] = h; });

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = dateStr(d);
    const h = map[key];
    return {
      date: key,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      screenTime:        h?.screen_time_total || 0,
      productive:        h?.screen_time_productive || 0,
      unproductive:      h?.screen_time_unproductive || 0,
      focusScore:        h?.focus_score || 0,
      productivityScore: h?.productivity_score || 0,
      socialMedia:       h?.social_media_time || 0,
      deepWork:          h?.deep_work_minutes || 0,
    };
  });
}
