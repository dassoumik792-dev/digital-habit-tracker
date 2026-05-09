/**
 * Mock Data Generator
 * Generates realistic digital habit data for demo/testing
 */

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

const APP_POOL = [
  { name: 'YouTube', category: 'entertainment', isDistracting: true },
  { name: 'Instagram', category: 'social', isDistracting: true },
  { name: 'Twitter/X', category: 'social', isDistracting: true },
  { name: 'VS Code', category: 'productivity', isDistracting: false },
  { name: 'Chrome', category: 'productivity', isDistracting: false },
  { name: 'Notion', category: 'productivity', isDistracting: false },
  { name: 'Slack', category: 'communication', isDistracting: false },
  { name: 'Netflix', category: 'entertainment', isDistracting: true },
  { name: 'WhatsApp', category: 'communication', isDistracting: false },
  { name: 'Reddit', category: 'social', isDistracting: true },
  { name: 'Gmail', category: 'communication', isDistracting: false },
  { name: 'Spotify', category: 'entertainment', isDistracting: false },
  { name: 'LinkedIn', category: 'productivity', isDistracting: false },
  { name: 'TikTok', category: 'social', isDistracting: true },
  { name: 'GitHub', category: 'productivity', isDistracting: false },
];

const MOODS = ['excellent', 'good', 'neutral', 'bad', 'terrible'];

/**
 * Generate realistic mock habit data
 * @param {number} daysAgo - How many days ago (affects trend - older = slightly worse)
 */
const generateMockHabitData = (daysAgo = 0) => {
  // Simulate improvement trend: older data is slightly worse
  const improvementFactor = Math.max(0.7, 1 - daysAgo * 0.01);

  const totalScreenTime = rand(240, 600);
  const productiveTime = Math.round(totalScreenTime * randFloat(0.3, 0.6) * improvementFactor);
  const unproductiveTime = Math.round(totalScreenTime * randFloat(0.2, 0.5));
  const neutralTime = totalScreenTime - productiveTime - unproductiveTime;

  const socialMediaTime = rand(30, 180);
  const deepWorkMinutes = Math.round(rand(30, 150) * improvementFactor);
  const nightUsage = rand(0, 90);
  const doomScrollingTime = rand(0, 60);
  const distractionCount = rand(3, 25);

  // Pick 4-7 random apps
  const shuffled = [...APP_POOL].sort(() => Math.random() - 0.5).slice(0, rand(4, 7));
  const appUsage = shuffled.map((app) => ({
    ...app,
    duration: rand(10, 90),
    sessions: rand(1, 8),
  }));

  // Category breakdown
  const categoryBreakdown = {
    social: socialMediaTime,
    productivity: productiveTime,
    entertainment: rand(20, 120),
    education: rand(0, 60),
    communication: rand(10, 60),
    news: rand(0, 30),
    gaming: rand(0, 45),
    other: rand(0, 30),
  };

  // Hourly activity (24 hours) - simulate realistic usage patterns
  const hourlyActivity = Array(24).fill(0).map((_, hour) => {
    if (hour < 6) return rand(0, 5);           // sleeping
    if (hour < 8) return rand(5, 20);          // morning routine
    if (hour >= 9 && hour <= 12) return rand(30, 80); // morning work
    if (hour === 13) return rand(20, 50);      // lunch
    if (hour >= 14 && hour <= 17) return rand(40, 90); // afternoon work
    if (hour >= 18 && hour <= 21) return rand(30, 70); // evening
    if (hour >= 22) return rand(10, 40);       // late night
    return rand(10, 40);
  });

  const focusScore = Math.min(100, Math.round(
    (deepWorkMinutes / 2) + (100 - distractionCount * 2) * 0.5 * improvementFactor
  ));

  const productivityScore = Math.min(100, Math.round(
    (productiveTime / totalScreenTime) * 100 * improvementFactor
  ));

  const moodIndex = Math.min(4, Math.max(0, Math.round(rand(0, 4) * (1 - daysAgo * 0.02))));

  return {
    screenTime: {
      total: totalScreenTime,
      productive: productiveTime,
      unproductive: unproductiveTime,
      neutral: Math.max(0, neutralTime),
    },
    appUsage,
    categoryBreakdown,
    focusScore: Math.max(10, focusScore),
    productivityScore: Math.max(10, productivityScore),
    distractionCount,
    deepWorkMinutes,
    nightUsage,
    morningUsage: rand(0, 30),
    doomScrollingTime,
    socialMediaTime,
    mood: MOODS[moodIndex],
    energyLevel: rand(3, 9),
    hourlyActivity,
    goalsMetToday: rand(1, 4),
    goalsTotalToday: 4,
  };
};

module.exports = { generateMockHabitData };
