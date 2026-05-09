/**
 * Score Calculator Utility
 * Computes productivity, focus, and wellness scores from habit data
 */

/**
 * Compute all productivity scores from a habit record
 * @param {Object} habit - Habit data object from Supabase
 * @returns {Object} scores object
 */
const computeProductivityScore = (habit) => {
  // ── Focus Score (0-100) ───────────────────────────────────────────────────
  let focusScore = habit.focusScore || 0;
  if (focusScore === 0) {
    focusScore = 50; // base
    if (habit.deepWorkMinutes > 120) focusScore += 20;
    else if (habit.deepWorkMinutes > 60) focusScore += 10;
    if (habit.distractionCount < 5) focusScore += 15;
    else if (habit.distractionCount > 20) focusScore -= 15;
    if (habit.screenTime.productive > habit.screenTime.unproductive) focusScore += 15;
    focusScore = Math.max(0, Math.min(100, focusScore));
  }

  // ── Productivity Score (0-100) ────────────────────────────────────────────
  let productivityScore = habit.productivityScore || 0;
  if (productivityScore === 0) {
    productivityScore = 50;
    const productiveRatio = habit.screenTime.total > 0
      ? habit.screenTime.productive / habit.screenTime.total
      : 0;
    productivityScore += Math.round(productiveRatio * 30);
    if (habit.goalCompletionRate > 80) productivityScore += 15;
    else if (habit.goalCompletionRate > 50) productivityScore += 8;
    if (habit.mood === 'excellent' || habit.mood === 'good') productivityScore += 5;
    productivityScore = Math.max(0, Math.min(100, productivityScore));
  }

  // ── Wellbeing Score (0-100) ───────────────────────────────────────────────
  let wellbeingScore = 70;
  if (habit.nightUsage > 120) wellbeingScore -= 20;
  else if (habit.nightUsage > 60) wellbeingScore -= 10;
  if (habit.doomScrollingTime > 60) wellbeingScore -= 15;
  else if (habit.doomScrollingTime > 30) wellbeingScore -= 8;
  if (habit.energyLevel >= 7) wellbeingScore += 10;
  else if (habit.energyLevel <= 3) wellbeingScore -= 10;
  wellbeingScore = Math.max(0, Math.min(100, wellbeingScore));

  // ── Digital Balance Score (0-100) ─────────────────────────────────────────
  let digitalBalanceScore = 70;
  if (habit.screenTime.total > 600) digitalBalanceScore -= 25;
  else if (habit.screenTime.total > 480) digitalBalanceScore -= 15;
  else if (habit.screenTime.total < 240) digitalBalanceScore += 10;
  if (habit.socialMediaTime > 180) digitalBalanceScore -= 15;
  digitalBalanceScore = Math.max(0, Math.min(100, digitalBalanceScore));

  // ── Addiction Risk Score (0-100) ──────────────────────────────────────────
  let addictionRiskScore = 0;
  if (habit.screenTime.total > 480) addictionRiskScore += 25;
  else if (habit.screenTime.total > 360) addictionRiskScore += 12;
  if (habit.nightUsage > 60) addictionRiskScore += 20;
  if (habit.doomScrollingTime > 30) addictionRiskScore += 20;
  if (habit.socialMediaTime > 120) addictionRiskScore += 15;
  if (habit.distractionCount > 20) addictionRiskScore += 20;
  addictionRiskScore = Math.min(100, addictionRiskScore);

  // ── Mental Fatigue Score (0-100) ──────────────────────────────────────────
  let mentalFatigueScore = 20;
  if (habit.screenTime.total > 480) mentalFatigueScore += 20;
  if (habit.nightUsage > 60) mentalFatigueScore += 25;
  if (habit.distractionCount > 15) mentalFatigueScore += 15;
  if (habit.energyLevel <= 3) mentalFatigueScore += 20;
  mentalFatigueScore = Math.min(100, mentalFatigueScore);

  // ── Attention Consistency Score (0-100) ───────────────────────────────────
  const attentionConsistencyScore = Math.max(0, 100 - habit.distractionCount * 3);

  // ── Deep Work Efficiency Score (0-100) ────────────────────────────────────
  const deepWorkEfficiencyScore = habit.screenTime.total > 0
    ? Math.min(100, Math.round((habit.deepWorkMinutes / habit.screenTime.total) * 200))
    : 0;

  // ── Overall Score (weighted composite) ───────────────────────────────────
  const overallScore = Math.round(
    focusScore * 0.25 +
    productivityScore * 0.25 +
    wellbeingScore * 0.20 +
    digitalBalanceScore * 0.15 +
    (100 - addictionRiskScore) * 0.15
  );

  return {
    focusScore,
    productivityScore,
    wellbeingScore,
    digitalBalanceScore,
    addictionRiskScore,
    mentalFatigueScore,
    attentionConsistencyScore,
    deepWorkEfficiencyScore,
    overallScore,
    breakdown: {
      screenTimeImpact: habit.screenTime.total > 480 ? -15 : 0,
      focusSessionsImpact: habit.deepWorkMinutes > 60 ? 10 : 0,
      socialMediaImpact: habit.socialMediaTime > 120 ? -10 : 0,
      nightUsageImpact: habit.nightUsage > 60 ? -15 : 0,
      goalCompletionImpact: habit.goalCompletionRate > 80 ? 10 : 0,
      streakImpact: 0,
    },
  };
};

module.exports = { computeProductivityScore };
