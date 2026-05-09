/**
 * AI Controller — Supabase + OpenAI
 */

const supabase = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

let _openai = null;
const getOpenAI = () => {
  if (!_openai && process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
};

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];

// ── GET /api/ai/insights ──────────────────────────────────────────────────────
exports.getInsights = asyncHandler(async (req, res) => {
  const { data: habits } = await supabase
    .from('habits').select('*').eq('user_id', req.user.id)
    .gte('date', daysAgo(7)).order('date', { ascending: false });

  if (!habits?.length) {
    return res.json({ success: true, data: { insights: getDefaultInsights(), generated: false } });
  }

  const summary = buildSummary(habits, req.user);
  const openai = getOpenAI();

  if (!openai) {
    return res.json({ success: true, data: { insights: generateRuleBasedInsights(habits), generated: false, fallback: true } });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are FocusPulse AI, a digital wellness coach. Analyze user habit data and return a JSON object with key "insights" containing 5-7 insight objects. Each insight: { type: "positive"|"warning"|"neutral"|"achievement", title, description, icon (emoji) }.' },
        { role: 'user', content: `Analyze these digital habits:\n${JSON.stringify(summary, null, 2)}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.7,
    });
    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, data: { insights: parsed.insights || [], generated: true, tokensUsed: completion.usage.total_tokens } });
  } catch (err) {
    res.json({ success: true, data: { insights: generateRuleBasedInsights(habits), generated: false, fallback: true } });
  }
});

// ── POST /api/ai/weekly-report ────────────────────────────────────────────────
exports.generateWeeklyReport = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const weekEnd   = new Date().toISOString().split('T')[0];
  const weekStart = daysAgo(6);
  const prevStart = daysAgo(13);

  const [{ data: thisWeek }, { data: prevWeek }] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', uid).gte('date', weekStart).lte('date', weekEnd),
    supabase.from('habits').select('*').eq('user_id', uid).gte('date', prevStart).lt('date', weekStart),
  ]);

  const current = buildSummary(thisWeek || [], req.user);
  const previous = buildSummary(prevWeek || [], req.user);

  let reportData = generateFallbackReport(current, previous);
  let tokensUsed = 0;
  const openai = getOpenAI();

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are FocusPulse AI. Generate a weekly wellness report as JSON with: summary (string), insights (array of {type,title,description,icon}), recommendations (array of {priority,category,title,description,actionItems[]}), predictions (array of {metric,prediction,confidence}).' },
          { role: 'user', content: `This week: ${JSON.stringify(current)}\nPrevious week: ${JSON.stringify(previous)}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.7,
      });
      reportData = JSON.parse(completion.choices[0].message.content);
      tokensUsed = completion.usage.total_tokens;
    } catch (_) {}
  }

  const comparison = {
    screenTimeChange:   calcChange(previous.avgScreenTime, current.avgScreenTime),
    focusScoreChange:   calcChange(previous.avgFocusScore, current.avgFocusScore),
    productivityChange: calcChange(previous.avgProductivity, current.avgProductivity),
    socialMediaChange:  calcChange(previous.avgSocialMedia, current.avgSocialMedia),
  };

  const { data: report } = await supabase.from('ai_reports').upsert({
    user_id: uid,
    week_start: weekStart,
    week_end: weekEnd,
    summary: reportData.summary || '',
    insights: reportData.insights || [],
    recommendations: reportData.recommendations || [],
    predictions: reportData.predictions || [],
    scores: { overallProductivity: current.avgProductivity, focusConsistency: current.avgFocusScore, digitalWellbeing: Math.max(0, 100 - (current.avgAddictionRisk || 0)), habitImprovement: Math.max(0, (comparison.focusScoreChange || 0) + 50), addictionRisk: current.avgAddictionRisk || 0 },
    comparison,
    data_snapshot: current,
    tokens_used: tokensUsed,
    generated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,week_start' }).select().single();

  await supabase.from('notifications').insert({ user_id: uid, type: 'weekly_report', title: 'Your Weekly AI Report is Ready 📊', message: (reportData.summary || '').substring(0, 150) || 'Your weekly digital wellness report has been generated.', icon: '🤖', priority: 'high', action_url: '/ai-insights' });

  res.json({ success: true, data: report });
});

// ── GET /api/ai/reports ───────────────────────────────────────────────────────
exports.getReports = asyncHandler(async (req, res) => {
  const { data } = await supabase.from('ai_reports').select('*').eq('user_id', req.user.id).order('week_start', { ascending: false }).limit(12);
  res.json({ success: true, data: data || [] });
});

// ── GET /api/ai/addiction-score ───────────────────────────────────────────────
exports.getAddictionScore = asyncHandler(async (req, res) => {
  const { data: habits } = await supabase.from('habits').select('*').eq('user_id', req.user.id).gte('date', daysAgo(7));
  if (!habits?.length) return res.json({ success: true, data: { score: 0, level: 'low', breakdown: {} } });

  const avg = (key) => habits.reduce((a, h) => a + (h[key] || 0), 0) / habits.length;
  const breakdown = {
    screenTimeScore:  Math.min(30, Math.max(0, (avg('screen_time_total') - 240) / 8)),
    nightUsageScore:  Math.min(20, avg('night_usage') / 3),
    doomScrollScore:  Math.min(20, avg('doom_scrolling_time') / 1.5),
    socialMediaScore: Math.min(15, Math.max(0, (avg('social_media_time') - 60) / 4)),
    distractionScore: Math.min(15, avg('distraction_count') / 1.3),
  };
  const score = Math.round(Object.values(breakdown).reduce((a, b) => a + b, 0));
  const level = score < 25 ? 'low' : score < 50 ? 'moderate' : score < 75 ? 'high' : 'critical';
  res.json({ success: true, data: { score, level, breakdown, maxScore: 100 } });
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
exports.chatWithAI = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new AppError('Message is required', 400);

  const openai = getOpenAI();
  if (!openai) throw new AppError('AI service not configured. Add OPENAI_API_KEY to .env', 503);

  const { data: habits } = await supabase.from('habits').select('*').eq('user_id', req.user.id).order('date', { ascending: false }).limit(7);
  const context = buildSummary(habits || [], req.user);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are FocusPulse AI, a friendly digital wellness coach. User context: ${JSON.stringify(context)}. Keep responses concise (2-3 paragraphs max).` },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });
    res.json({ success: true, data: { reply: completion.choices[0].message.content, tokensUsed: completion.usage.total_tokens } });
  } catch (err) {
    throw new AppError('AI service temporarily unavailable', 503);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildSummary(habits, user) {
  if (!habits.length) return {};
  const avg = (key) => Math.round(habits.reduce((a, h) => a + (h[key] || 0), 0) / habits.length);
  return {
    userName: user.name,
    daysTracked: habits.length,
    avgScreenTime: avg('screen_time_total'),
    avgFocusScore: avg('focus_score'),
    avgProductivity: avg('productivity_score'),
    avgSocialMedia: avg('social_media_time'),
    avgNightUsage: avg('night_usage'),
    avgDoomScrolling: avg('doom_scrolling_time'),
    avgDeepWork: avg('deep_work_minutes'),
    avgDistractions: avg('distraction_count'),
    avgAddictionRisk: 0,
    streak: user.streak_current || 0,
  };
}

function calcChange(prev, curr) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function getDefaultInsights() {
  return [
    { type: 'neutral', title: 'Start Tracking', description: 'Log your first day of habits to get personalized AI insights.', icon: '🚀' },
    { type: 'positive', title: 'Set Your Goals', description: 'Define screen time and focus goals to begin your wellness journey.', icon: '🎯' },
  ];
}

function generateRuleBasedInsights(habits) {
  const avg = (key) => habits.reduce((a, h) => a + (h[key] || 0), 0) / habits.length;
  const insights = [];
  if (avg('screen_time_total') > 480) insights.push({ type: 'warning', title: 'High Screen Time', description: `Averaging ${Math.round(avg('screen_time_total') / 60)}h daily. Consider setting a limit.`, icon: '⚠️' });
  if (avg('focus_score') > 70) insights.push({ type: 'positive', title: 'Strong Focus Score', description: `Your average focus score of ${Math.round(avg('focus_score'))} is excellent!`, icon: '🎯' });
  if (avg('night_usage') > 60) insights.push({ type: 'warning', title: 'Late Night Usage', description: `${Math.round(avg('night_usage'))} min after 10 PM may affect sleep quality.`, icon: '🌙' });
  if (avg('social_media_time') > 120) insights.push({ type: 'warning', title: 'Social Media Usage', description: `${Math.round(avg('social_media_time'))} min/day on social media. Try setting app limits.`, icon: '📱' });
  if (!insights.length) insights.push({ type: 'positive', title: 'Good Digital Balance', description: 'Your digital habits look healthy this week!', icon: '✅' });
  return insights;
}

function generateFallbackReport(current, previous) {
  return {
    summary: `This week you tracked ${current.daysTracked || 0} days with an average focus score of ${current.avgFocusScore || 0}/100.`,
    insights: generateRuleBasedInsights([]),
    recommendations: [{ priority: 'high', category: 'Focus', title: 'Improve Deep Work Sessions', description: 'Schedule dedicated focus blocks in the morning.', actionItems: ['Block 2-hour focus sessions', 'Turn off notifications', 'Use the Pomodoro technique'] }],
    predictions: [{ metric: 'Focus Score', prediction: 'Expected to improve with consistent tracking', confidence: 70 }],
  };
}
