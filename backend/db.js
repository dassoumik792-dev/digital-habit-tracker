require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to generate random dates within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random integer between min and max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random choice from array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Sample data
const sampleUsers = [
  {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
    bio: 'Software developer passionate about productivity',
    occupation: 'Software Developer',
    age_group: '25-34',
    timezone: 'America/New_York',
    daily_screen_time_limit: 480,
    focus_goal_minutes: 120,
    work_start_hour: 9,
    work_end_hour: 17
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    bio: 'UX designer trying to improve work-life balance',
    occupation: 'UX Designer',
    age_group: '25-34',
    timezone: 'America/Los_Angeles',
    daily_screen_time_limit: 360,
    focus_goal_minutes: 90,
    work_start_hour: 8,
    work_end_hour: 16
  },
  {
    name: 'Mike Williams',
    email: 'mike.williams@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    bio: 'Student working on better study habits',
    occupation: 'Student',
    age_group: '18-24',
    timezone: 'Europe/London',
    daily_screen_time_limit: 300,
    focus_goal_minutes: 60,
    work_start_hour: 10,
    work_end_hour: 18
  }
];

const goalTemplates = [
  {
    title: 'Reduce Social Media Time',
    description: 'Limit daily social media usage to 30 minutes',
    type: 'social_media',
    target_value: 30,
    target_unit: 'minutes',
    direction: 'limit',
    frequency: 'daily',
    color: '#ef4444',
    icon: '📱'
  },
  {
    title: 'Daily Focus Goal',
    description: 'Achieve at least 2 hours of deep work',
    type: 'focus',
    target_value: 120,
    target_unit: 'minutes',
    direction: 'achieve',
    frequency: 'daily',
    color: '#3b82f6',
    icon: '🎯'
  },
  {
    title: 'Screen Time Limit',
    description: 'Keep total screen time under 6 hours',
    type: 'screen_time',
    target_value: 360,
    target_unit: 'minutes',
    direction: 'limit',
    frequency: 'daily',
    color: '#f59e0b',
    icon: '⏰'
  },
  {
    title: 'Productivity Score',
    description: 'Maintain productivity score above 75%',
    type: 'productivity',
    target_value: 75,
    target_unit: 'percentage',
    direction: 'achieve',
    frequency: 'daily',
    color: '#10b981',
    icon: '📈'
  },
  {
    title: 'Sleep Schedule',
    description: 'Get 8 hours of sleep every night',
    type: 'sleep',
    target_value: 8,
    target_unit: 'hours',
    direction: 'achieve',
    frequency: 'daily',
    color: '#8b5cf6',
    icon: '😴'
  }
];

const taskCategories = ['work', 'study', 'creative', 'reading', 'coding', 'other'];
const sessionTypes = ['pomodoro', 'deep_work', 'short_break', 'long_break', 'custom'];
const moods = ['excellent', 'good', 'neutral', 'bad', 'terrible'];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // First, create users in auth system
    console.log('📝 Creating users...');
    const createdUsers = [];

    for (const user of sampleUsers) {
      // Create user in auth system
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          name: user.name,
          avatar_url: user.avatar
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        continue;
      }

      console.log(`✅ Created user: ${user.name}`);
      createdUsers.push({ ...user, id: authData.user.id });
    }

    // Wait a bit for triggers to create user profiles
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate habits data for the last 30 days
    console.log('📊 Creating habits data...');
    for (const user of createdUsers) {
      for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        const screenTimeTotal = randomInt(180, 600);
        const screenTimeProductive = Math.floor(screenTimeTotal * randomInt(0.3, 0.7));
        const screenTimeUnproductive = Math.floor(screenTimeTotal * randomInt(0.1, 0.3));
        const screenTimeNeutral = screenTimeTotal - screenTimeProductive - screenTimeUnproductive;

        const habit = {
          user_id: user.id,
          date: dateStr,
          screen_time_total: screenTimeTotal,
          screen_time_productive: screenTimeProductive,
          screen_time_unproductive: screenTimeUnproductive,
          screen_time_neutral: screenTimeNeutral,
          app_usage: JSON.stringify([
            { app: 'VS Code', minutes: randomInt(60, 180), category: 'productivity' },
            { app: 'Slack', minutes: randomInt(20, 60), category: 'communication' },
            { app: 'YouTube', minutes: randomInt(10, 90), category: 'entertainment' },
            { app: 'Twitter', minutes: randomInt(5, 45), category: 'social' }
          ]),
          cat_social: randomInt(20, 80),
          cat_productivity: randomInt(60, 200),
          cat_entertainment: randomInt(10, 60),
          cat_education: randomInt(5, 40),
          cat_communication: randomInt(15, 50),
          cat_news: randomInt(5, 25),
          cat_gaming: randomInt(0, 40),
          cat_other: randomInt(5, 30),
          focus_score: randomInt(40, 95),
          productivity_score: randomInt(30, 90),
          distraction_count: randomInt(2, 15),
          deep_work_minutes: randomInt(30, 180),
          night_usage: randomInt(10, 60),
          morning_usage: randomInt(20, 80),
          doom_scrolling_time: randomInt(5, 45),
          social_media_time: randomInt(15, 90),
          mood: randomChoice(moods),
          energy_level: randomInt(3, 9),
          hourly_activity: JSON.stringify(Array.from({ length: 24 }, () => randomInt(0, 30))),
          goals_met_today: randomInt(0, 5),
          goals_total_today: randomInt(3, 6),
          notes: randomChoice(['', 'Productive morning', 'Felt distracted', 'Good focus session'])
        };

        const { error } = await supabase.from('habits').insert(habit);
        if (error) console.error('Error inserting habit:', error);
      }
    }

    // Create goals
    console.log('🎯 Creating goals...');
    for (const user of createdUsers) {
      for (const template of goalTemplates) {
        const goal = {
          ...template,
          user_id: user.id,
          current_value: randomInt(10, 80),
          completion_rate: randomInt(20, 95),
          streak: randomInt(0, 15),
          best_streak: randomInt(5, 30),
          start_date: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).toISOString().split('T')[0],
          progress_history: JSON.stringify(
            Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              value: randomInt(20, 100)
            }))
          )
        };

        const { error } = await supabase.from('goals').insert(goal);
        if (error) console.error('Error inserting goal:', error);
      }
    }

    // Create focus sessions
    console.log('🧘 Creating focus sessions...');
    for (const user of createdUsers) {
      for (let i = 0; i < 20; i++) {
        const startTime = randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
        const plannedDuration = randomInt(15, 120);
        const actualDuration = randomInt(Math.floor(plannedDuration * 0.7), plannedDuration + 10);
        
        const session = {
          user_id: user.id,
          type: randomChoice(sessionTypes),
          status: randomChoice(['completed', 'completed', 'completed', 'abandoned']),
          planned_duration: plannedDuration,
          actual_duration: actualDuration,
          start_time: startTime.toISOString(),
          end_time: new Date(startTime.getTime() + actualDuration * 60 * 1000).toISOString(),
          task: randomChoice([
            'Code review',
            'Feature development',
            'Documentation writing',
            'Meeting preparation',
            'Learning new technology',
            'Bug fixing'
          ]),
          category: randomChoice(taskCategories),
          focus_quality: randomInt(2, 5),
          distraction_count: randomInt(0, 8),
          completion_percentage: Math.floor((actualDuration / plannedDuration) * 100),
          pomodoro_number: randomInt(1, 4),
          breaks_taken: randomInt(0, 3),
          notes: randomChoice(['', 'Good focus', 'Many interruptions', 'Very productive']),
          tags: JSON.stringify(randomChoice([['work'], ['study'], ['urgent'], ['work', 'urgent']]))
        };

        const { error } = await supabase.from('focus_sessions').insert(session);
        if (error) console.error('Error inserting focus session:', error);
      }
    }

    // Create notifications
    console.log('🔔 Creating notifications...');
    const notificationTypes = [
      'streak_reminder', 'goal_achieved', 'goal_failed', 'weekly_report',
      'ai_insight', 'screen_time_warning', 'focus_reminder',
      'achievement_unlocked', 'productivity_warning', 'motivation'
    ];

    for (const user of createdUsers) {
      for (let i = 0; i < 15; i++) {
        const notification = {
          user_id: user.id,
          type: randomChoice(notificationTypes),
          title: randomChoice([
            'Great job on your streak!',
            'Goal achieved! 🎉',
            'Time for a focus break',
            'Weekly report ready',
            'AI insight available',
            'Screen time warning'
          ]),
          message: randomChoice([
            'You\'ve been consistent for 5 days!',
            'You completed your daily focus goal.',
            'Take a 5-minute break to refresh.',
            'Your weekly productivity report is ready.',
            'New AI insights about your habits.',
            'You\'re approaching your screen time limit.'
          ]),
          icon: randomChoice(['🔔', '🎯', '📊', '💡', '⏰']),
          priority: randomChoice(['low', 'medium', 'high']),
          is_read: Math.random() > 0.6,
          read_at: Math.random() > 0.6 ? new Date().toISOString() : null,
          metadata: JSON.stringify({ source: 'system' })
        };

        const { error } = await supabase.from('notifications').insert(notification);
        if (error) console.error('Error inserting notification:', error);
      }
    }

    // Create AI reports
    console.log('🤖 Creating AI reports...');
    for (const user of createdUsers) {
      for (let weeksAgo = 3; weeksAgo >= 0; weeksAgo--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weeksAgo * 7 + weekStart.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const report = {
          user_id: user.id,
          report_type: 'weekly',
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0],
          summary: `Your productivity ${randomChoice(['improved', 'stayed consistent', 'declined slightly'])} this week. ${randomChoice(['Great focus sessions', 'Consider reducing social media time', 'Excellent time management'])}.`,
          insights: JSON.stringify([
            'Peak focus time: 9-11 AM',
            'Most productive day: Tuesday',
            'Screen time increased by 15%',
            'Deep work sessions: 12 this week'
          ]),
          recommendations: JSON.stringify([
            'Try the Pomodoro technique for better focus',
            'Set stricter limits on social media apps',
            'Take more frequent breaks',
            'Schedule deep work sessions in the morning'
          ]),
          predictions: JSON.stringify([
            'Productivity likely to improve next week',
            'Screen time may increase during weekends',
            'Focus scores trending upward'
          ]),
          scores: JSON.stringify({
            focus: randomInt(60, 90),
            productivity: randomInt(55, 85),
            wellbeing: randomInt(65, 95),
            digital_balance: randomInt(50, 80)
          }),
          comparison: JSON.stringify({
            last_week: randomInt(-10, 15),
            last_month: randomInt(-5, 20),
            user_average: randomInt(70, 90)
          }),
          tokens_used: randomInt(1000, 3000)
        };

        const { error } = await supabase.from('ai_reports').insert(report);
        if (error) console.error('Error inserting AI report:', error);
      }
    }

    // Create productivity scores
    console.log('📈 Creating productivity scores...');
    for (const user of createdUsers) {
      for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];

        const focusScore = randomInt(40, 95);
        const productivityScore = randomInt(35, 90);
        const wellbeingScore = randomInt(50, 95);
        const digitalBalanceScore = randomInt(45, 85);
        const addictionRiskScore = randomInt(10, 60);
        const mentalFatigueScore = randomInt(20, 70);
        const attentionConsistencyScore = randomInt(40, 90);
        const deepWorkEfficiencyScore = randomInt(35, 85);
        const overallScore = Math.floor((focusScore + productivityScore + wellbeingScore + digitalBalanceScore) / 4);

        const score = {
          user_id: user.id,
          date: dateStr,
          focus_score: focusScore,
          productivity_score: productivityScore,
          wellbeing_score: wellbeingScore,
          digital_balance_score: digitalBalanceScore,
          addiction_risk_score: addictionRiskScore,
          mental_fatigue_score: mentalFatigueScore,
          attention_consistency_score: attentionConsistencyScore,
          deep_work_efficiency_score: deepWorkEfficiencyScore,
          overall_score: overallScore,
          breakdown: JSON.stringify({
            focus: focusScore,
            productivity: productivityScore,
            wellbeing: wellbeingScore,
            balance: digitalBalanceScore
          }),
          trend: randomChoice(['improving', 'stable', 'declining']),
          change_from_yesterday: randomInt(-15, 20)
        };

        const { error } = await supabase.from('productivity_scores').insert(score);
        if (error) console.error('Error inserting productivity score:', error);
      }
    }

    // Create activity logs
    console.log('📝 Creating activity logs...');
    const activities = [
      'user_login', 'goal_created', 'goal_completed', 'focus_session_started',
      'focus_session_completed', 'profile_updated', 'settings_changed',
      'report_generated', 'notification_read', 'habit_tracked'
    ];

    for (const user of createdUsers) {
      for (let i = 0; i < 25; i++) {
        const activity = {
          user_id: user.id,
          action: randomChoice(activities),
          entity_type: randomChoice(['goal', 'focus_session', 'habit', 'user', 'notification']),
          metadata: JSON.stringify({
            ip_address: '192.168.1.' + randomInt(1, 254),
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            timestamp: new Date().toISOString()
          })
        };

        const { error } = await supabase.from('activity_logs').insert(activity);
        if (error) console.error('Error inserting activity log:', error);
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created ${createdUsers.length} users with comprehensive data`);
    console.log('🔐 Login credentials:');
    for (const user of createdUsers) {
      console.log(`   ${user.email}: password123`);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run the seeding function
seedDatabase();
