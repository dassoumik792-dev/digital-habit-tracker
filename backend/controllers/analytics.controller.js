/**
 * Analytics Controller — Supabase (FIXED VERSION)
 * Fixed MongoDB → Supabase migration issues
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

    console.log('[Analytics] Query dates:', { today, weekAgo, twoWeeksAgo });

    // Execute queries with comprehensive error handling
    const [todayRes, thisWeekRes, lastWeekRes, scoresRes, profileRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', uid).eq('date', today).maybeSingle(),
      supabase.from('habits').select('*').eq('user_id', uid).gte('date', weekAgo).lte('date', today),
      supabase.from('habits').select('*').eq('user_id', uid).gte('date', twoWeeksAgo).lt('date', weekAgo),
      supabase.from('productivity_scores').select('*').eq('user_id', uid).gte('date', weekAgo).order('date'),
      supabase.from('users').select('streak_current, streak_longest').eq('id', uid).maybeSingle(),
    ]);

    console.log('[Analytics] === QUERY RESULTS ===');
    console.log('[Analytics] Today habit query:', { 
      data: todayRes.data, 
      error: todayRes.error,
      status: todayRes.status,
      hasData: !!todayRes.data
    });
    console.log('[Analytics] This week habits query:', { 
      count: thisWeekRes.data?.length || 0,
      error: thisWeekRes.error,
      status: thisWeekRes.status,
      sampleData: thisWeekRes.data?.slice(0, 2)
    });
    console.log('[Analytics] User profile query:', { 
      data: profileRes.data,
      error: profileRes.error,
      status: profileRes.status,
      hasData: !!profileRes.data,
      userId: profileRes.data?.id
    });

    // Check for RLS issues and connection problems
    if (todayRes.error) {
      console.error('[Analytics] Today query failed:', todayRes.error);
      if (todayRes.error.message.includes('row-level security')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Row Level Security policy issue',
          error: 'RLS_ACCESS_DENIED'
        });
      }
      if (todayRes.error.message.includes('relation "public.habits" does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'habits table not found - run schema.sql',
          error: 'TABLE_NOT_FOUND'
        });
      }
    }

    if (thisWeekRes.error) {
      console.error('[Analytics] Week query failed:', thisWeekRes.error);
      if (thisWeekRes.error.message.includes('row-level security')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Row Level Security policy issue',
          error: 'RLS_ACCESS_DENIED'
        });
      }
      if (thisWeekRes.error.message.includes('relation "public.habits" does not exist')) {
        return res.status(500).json({
          success: false,
          message: 'habits table not found - run schema.sql',
          error: 'TABLE_NOT_FOUND'
        });
      }
    }

    // Process data with proper field mapping
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
          totalHabitsCount: (thisWeekRes.data || []).length,
          userId: uid,
          todayDataExists: !!todayRes.data,
          profileDataExists: !!profileRes.data
        }
      },
    };

    console.log('[Analytics] Sending overview response with real data');
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
      count: habits?.length || 0,
      error: error,
      status: status,
      dataType: typeof habits,
      isArray: Array.isArray(habits),
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

    res.json({
      success: true,
      data: { 
        chartData: chartData, 
        period: { startDate, endDate },
        debugInfo: {
          rawHabitsCount: habits?.length || 0,
          chartDataCount: chartData.length,
          userId: uid,
          dateRange: { startDate, endDate }
        }
      },
    });
  } catch (error) {
    console.error('[Analytics] Weekly analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly analytics',
      error: error.message
    });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function weekAvg(habits) {
  if (!habits.length) {
    console.log('[Analytics] weekAvg: empty habits array, returning zeros');
    return { screenTime: 0, focusScore: 0, productivity: 0, socialMedia: 0 };
  }
  
  const n = habits.length;
  console.log('[Analytics] weekAvg processing habits:', {
    count: n,
    sampleHabit: habits[0] ? {
      screen_time_total: habits[0].screen_time_total,
      focus_score: habits[0].focus_score,
      productivity_score: habits[0].productivity_score,
      social_media_time: habits[0].social_media_time
    } : 'No habits'
  });
  
  const result = {
    screenTime:   Math.round(habits.reduce((a, h) => a + (h.screen_time_total || 0), 0) / n),
    focusScore:   Math.round(habits.reduce((a, h) => a + (h.focus_score || 0), 0) / n),
    productivity: Math.round(habits.reduce((a, h) => a + (h.productivity_score || 0), 0) / n),
    socialMedia: Math.round(habits.reduce((a, h) => a + (h.social_media_time || 0), 0) / n),
  };
  
  console.log('[Analytics] weekAvg result:', result);
  return result;
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
