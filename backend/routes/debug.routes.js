/**
 * Debug Routes - Temporary debugging endpoints
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { protect } = require('../middleware/auth.middleware');

// Apply auth middleware to all debug routes
router.use(protect);

// ── GET /api/debug/check-data ──────────────────────────────────────────────
router.get('/check-data', async (req, res) => {
  try {
    const uid = req.user.id;
    console.log('[Debug] Checking data for user:', uid);

    // Check all tables for this user
    const [usersRes, habitsRes, scoresRes, notifRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', uid).single(),
      supabase.from('habits').select('id, date, user_id').eq('user_id', uid).limit(10),
      supabase.from('productivity_scores').select('id, date, user_id').eq('user_id', uid).limit(5),
      supabase.from('notifications').select('id, type').eq('user_id', uid).limit(5)
    ]);

    const debugInfo = {
      user: {
        exists: !!usersRes.data,
        data: usersRes.data,
        error: usersRes.error
      },
      habits: {
        count: habitsRes.data?.length || 0,
        data: habitsRes.data,
        error: habitsRes.error
      },
      scores: {
        count: scoresRes.data?.length || 0,
        data: scoresRes.data,
        error: scoresRes.error
      },
      notifications: {
        count: notifRes.data?.length || 0,
        data: notifRes.data,
        error: notifRes.error
      }
    };

    console.log('[Debug] Data check results:', debugInfo);
    res.json({ success: true, debugInfo });

  } catch (error) {
    console.error('[Debug] Check data error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── GET /api/debug/test-insert ──────────────────────────────────────────────
router.post('/test-insert', async (req, res) => {
  try {
    const uid = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    console.log('[Debug] Testing insert for user:', uid, 'date:', today);

    const testData = {
      user_id: uid,
      date: today,
      screen_time_total: 120,
      screen_time_productive: 80,
      screen_time_unproductive: 40,
      focus_score: 75,
      productivity_score: 85,
      deep_work_minutes: 60,
      social_media_time: 30,
      night_usage: 15,
      distraction_count: 5,
      mood: 'good',
      energy_level: 7
    };

    const { data, error } = await supabase
      .from('habits')
      .insert(testData)
      .select()
      .single();

    console.log('[Debug] Test insert result:', {
      success: !error,
      data: data ? { id: data.id, user_id: data.user_id, date: data.date } : null,
      error: error?.message
    });

    // Verify the insert
    if (data) {
      const { data: verifyData } = await supabase
        .from('habits')
        .select('*')
        .eq('id', data.id)
        .single();

      console.log('[Debug] Insert verification:', {
        found: !!verifyData,
        record: verifyData
      });
    }

    res.json({ 
      success: !error, 
      data: data,
      error: error?.message 
    });

  } catch (error) {
    console.error('[Debug] Test insert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
