/**
 * Analytics Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/error.middleware');

const dateStr = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => dateStr(new Date(Date.now() - n * 86400000));

// ── GET /api/analytics/overview ──────────────────────────────────────────────
exports.getOverview = asyncHandler(async (req, res) => {
  try {
    console.log('[Analytics] Getting overview for user:', req.user.id);
    const uid = req.user.id;
    const today = dateStr(new Date());
    const weekAgo = daysAgo(7);
    const twoWeeksAgo = daysAgo(14);

    // Handle potential errors with .single() queries
    console.log('[Analytics] Executing queries for user:', uid);
    console.log('[Analytics] Today query date:', today);
    console.log('[Analytics] Week range:', { weekAgo, twoWeeksAgo });

    console.log('[Analytics] Starting parallel queries for user:', uid);
    console.log('[Analytics] Query dates:', { today, weekAgo, twoWeeksAgo });

    const [todayRes, thisWeekRes, lastWeekRes, scoresRes, profileRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', uid).eq('date', today).maybeSingle(),
      supabase.from('habits').select('*').eq('user_id', uid).gte('date', weekAgo).lte('date', today),
      supabase.from('habits').select('*').eq('user_id', uid).gte('date', twoWeeksAgo).lt('date', weekAgo),
      supabase.from('productivity_scores').select('*').eq('user_id', uid).gte('date', weekAgo).order('date'),
      supabase.from('users').select('streak_current, streak_longest').eq('id', uid).maybeSingle(),
    ]).catch(error => {
      console.error('[Analytics] Promise.all error:', error);
      throw error;
    });

    console.log('[Analytics] === QUERY RESULTS ===');
    console.log('[Analytics] Today habit query:', { 
      data: todayRes.data, 
      error: todayRes.error,
      status: todayRes.status,
      dataType: typeof todayRes.data,
      hasData: !!todayRes.data
    });
    console.log('[Analytics] This week habits query:', { 
      count: thisWeekRes.data?.length || 0,
      data: thisWeekRes.data,
      error: thisWeekRes.error,
      status: thisWeekRes.status,
      isArray: Array.isArray(thisWeekRes.data),
      isEmpty: !thisWeekRes.data || thisWeekRes.data.length === 0
    });
    console.log('[Analytics] Last week habits query:', { 
      count: lastWeekRes.data?.length || 0,
      data: lastWeekRes.data,
      error: lastWeekRes.error,
      status: lastWeekRes.status,
      isArray: Array.isArray(lastWeekRes.data),
      isEmpty: !lastWeekRes.data || lastWeekRes.data.length === 0
    });
    console.log('[Analytics] Productivity scores query:', { 
      count: scoresRes.data?.length || 0,
      data: scoresRes.data,
      error: scoresRes.error,
      status: scoresRes.status,
      isArray: Array.isArray(scoresRes.data),
      isEmpty: !scoresRes.data || scoresRes.data.length === 0
    });
    console.log('[Analytics] User profile query:', { 
      data: profileRes.data,
      error: profileRes.error,
      status: profileRes.status,
      hasData: !!profileRes.data,
      userId: profileRes.data?.id
    });

    const thisWeekAvg = weekAvg(thisWeekRes.data || []);
    const lastWeekAvg = weekAvg(lastWeekRes.data || []);

    // Create default today data if none exists
    const defaultTodayData = {
      date: today,
      screen_time_total: 0,
      screen_time_productive: 0,
      screen_time_unproductive: 0,
      screen_time_neutral: 0,
      focus_score: 0,
      productivity_score: 0,
      distraction_count: 0,
      deep_work_minutes: 0,
      night_usage: 0,
      morning_usage: 0,
      social_media_time: 0,
      mood: 'neutral',
      energy_level: 5,
      goals_met_today: 0,
      goals_total_today: 0,
    };

    const defaultProfileData = {
      streak_current: 0,
      streak_longest: 0,
    };

    // Add verification queries to debug RLS and table issues
    console.log('[Analytics] === VERIFICATION QUERIES ===');
    
    // First verify all required tables exist and are accessible
    const [tableCheck, userCheck] = await Promise.all([
      supabase.from('habits').select('id').limit(1),
      supabase.from('users').select('id').eq('id', uid).maybeSingle()
    ]);

    console.log('[Analytics] Table existence check:', {
      habitsTable: {
        accessible: !tableCheck.error,
        error: tableCheck.error?.message,
        hasAnyData: tableCheck.data && tableCheck.data.length > 0
      },
      userTable: {
        accessible: !userCheck.error,
        found: !!userCheck.data,
        userId: userCheck.data?.id
      }
    });

    if (tableCheck.error) {
      console.error('[Analytics] Habits table not accessible:', tableCheck.error);
      throw new Error(`Habits table error: ${tableCheck.error.message}`);
    }

    if (userCheck.error || !userCheck.data) {
      console.error('[Analytics] User not found in users table:', userCheck.error);
      throw new Error(`User access error: ${userCheck.error?.message || 'User not found'}`);
    }
    
    // Check if user has any habits at all
    const { data: allHabits, error: allHabitsError } = await supabase
      .from('habits')
      .select('id, date, user_id')
      .eq('user_id', uid)
      .limit(5);
      
    console.log('[Analytics] All habits verification:', {
      count: allHabits?.length || 0,
      error: allHabitsError?.message,
      sample: allHabits?.map(h => ({ id: h.id, date: h.date, user_id: h.user_id }))
    });

    const response = {
      success: true,
      data: {
        today: todayRes.data || defaultTodayData,
        thisWeek: thisWeekAvg,
        lastWeek: lastWeekAvg,
        improvements: {
          screenTime:  calcImprovement(lastWeekAvg.screenTime, thisWeekAvg.screenTime, true),
          focusScore:  calcImprovement(lastWeekAvg.focusScore, thisWeekAvg.focusScore),
          productivity: calcImprovement(lastWeekAvg.productivity, thisWeekAvg.productivity),
          socialMedia: calcImprovement(lastWeekAvg.socialMedia, thisWeekAvg.socialMedia, true),
        },
        recentScores: scoresRes.data || [],
        streakInfo: profileRes.data || defaultProfileData,
        debugInfo: {
          totalHabitsCount: allHabits?.length || 0,
          tableAccessible: !tableError,
          userId: uid
        }
      },
    };

    console.log('[Analytics] Sending overview response with debug info');
    res.json(response);
  } catch (error) {
    console.error('[Analytics] Overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
      error: error.message
    });
  }
});

// ── GET /api/analytics/weekly ─────────────────────────────────────────────────
exports.getWeeklyAnalytics = asyncHandler(async (req, res) => {
  try {
    console.log('[Analytics] Getting weekly analytics for user:', req.user.id);
    const uid = req.user.id;
    const weeksBack = parseInt(req.query.weeksBack) || 0;
    const endDate = dateStr(new Date(Date.now() - weeksBack * 7 * 86400000));
    const startDate = dateStr(new Date(Date.now() - (weeksBack * 7 + 6) * 86400000));

    console.log('[Analytics] Weekly query params:', { uid, startDate, endDate });
    
    const { data: habits, error, status } = await supabase
      .from('habits').select('*').eq('user_id', uid)
      .gte('date', startDate).lte('date', endDate).order('date');

    console.log('[Analytics] Weekly query result:', {
      data: habits,
      error: error,
      status: status,
      count: habits?.length || 0,
      dataType: typeof habits,
      isArray: Array.isArray(habits),
      isEmpty: !habits || habits.length === 0,
      firstItem: habits?.[0],
      userIdInQuery: uid,
      dateRange: { startDate, endDate }
    });

    if (error) {
      console.error('[Analytics] Weekly query error:', error);
      throw error;
    }

    console.log('[Analytics] Weekly data found:', habits?.length || 0, 'records');

    const chartData = buildChartData(habits || [], startDate, 7);
    console.log('[Analytics] Built chart data with', chartData.length, 'days');

    // Ensure chartData is always an array even if empty
    const safeChartData = Array.isArray(chartData) ? chartData : [];
    
    res.json({
      success: true,
      data: { 
        chartData: safeChartData, 
        period: { startDate, endDate },
        debugInfo: {
          rawHabitsCount: habits?.length || 0,
          chartDataCount: safeChartData.length,
          userId: uid,
          dateRange: { startDate, endDate }
        }
      },
    });
  } catch (error) {
    console.error('[Analytics] Weekly analytics error:', {
      message: error.message,
      stack: error.stack,
      userId: uid
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly analytics',
      error: error.message
    });
  }
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
