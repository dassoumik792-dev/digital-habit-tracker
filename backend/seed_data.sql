-- ============================================================
-- FocusPulse AI — Dummy Data Seeding Script
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- NOTE: This script creates dummy users directly in the users table.
-- In a real app, users would be created through Supabase Auth.

-- Insert dummy users (bypassing auth for demo purposes)
INSERT INTO public.users (id, name, email, avatar, bio, occupation, age_group, timezone, daily_screen_time_limit, focus_goal_minutes, work_start_hour, work_end_hour, streak_current, streak_longest, total_points, level, badges) VALUES
('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'alex.johnson@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'Software developer passionate about productivity', 'Software Developer', '25-34', 'America/New_York', 480, 120, 9, 17, 5, 12, 1250, 3, '["early_bird", "focus_master", "week_warrior"]'::jsonb),
('00000000-0000-0000-0000-000000000002', 'Sarah Chen', 'sarah.chen@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'UX designer trying to improve work-life balance', 'UX Designer', '25-34', 'America/Los_Angeles', 360, 90, 8, 16, 3, 8, 890, 2, '["consistent", "goal_getter"]'::jsonb),
('00000000-0000-0000-0000-000000000003', 'Mike Williams', 'mike.williams@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'Student working on better study habits', 'Student', '18-24', 'Europe/London', 300, 60, 10, 18, 7, 15, 2100, 4, '["study_champion", "night_owl", "productivity_pro"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert goals for each user
INSERT INTO public.goals (user_id, title, description, type, target_value, target_unit, direction, frequency, status, current_value, completion_rate, streak, best_streak, color, icon, progress_history) VALUES
-- Alex's goals
('00000000-0000-0000-0000-000000000001', 'Reduce Social Media Time', 'Limit daily social media usage to 30 minutes', 'social_media', 30, 'minutes', 'limit', 'daily', 'active', 25, 83, 5, 12, '#ef4444', '📱', '[{"date":"2024-01-15","value":85},{"date":"2024-01-16","value":90},{"date":"2024-01-17","value":75},{"date":"2024-01-18","value":80},{"date":"2024-01-19","value":83}]'::jsonb),
('00000000-0000-0000-0000-000000000001', 'Daily Focus Goal', 'Achieve at least 2 hours of deep work', 'focus', 120, 'minutes', 'achieve', 'daily', 'active', 110, 92, 3, 8, '#3b82f6', '🎯', '[{"date":"2024-01-15","value":95},{"date":"2024-01-16","value":88},{"date":"2024-01-17","value":92},{"date":"2024-01-18","value":90},{"date":"2024-01-19","value":92}]'::jsonb),
('00000000-0000-0000-0000-000000000001', 'Screen Time Limit', 'Keep total screen time under 6 hours', 'screen_time', 360, 'minutes', 'limit', 'daily', 'active', 340, 94, 7, 15, '#f59e0b', '⏰', '[{"date":"2024-01-15","value":90},{"date":"2024-01-16","value":95},{"date":"2024-01-17","value":88},{"date":"2024-01-18","value":92},{"date":"2024-01-19","value":94}]'::jsonb),

-- Sarah's goals
('00000000-0000-0000-0000-000000000002', 'Productivity Score', 'Maintain productivity score above 75%', 'productivity', 75, 'percentage', 'achieve', 'daily', 'active', 78, 104, 2, 6, '#10b981', '📈', '[{"date":"2024-01-15","value":72},{"date":"2024-01-16","value":78},{"date":"2024-01-17","value":80},{"date":"2024-01-18","value":76},{"date":"2024-01-19","value":78}]'::jsonb),
('00000000-0000-0000-0000-000000000002', 'Sleep Schedule', 'Get 8 hours of sleep every night', 'sleep', 8, 'hours', 'achieve', 'daily', 'active', 7.5, 94, 4, 9, '#8b5cf6', '😴', '[{"date":"2024-01-15","value":85},{"date":"2024-01-16","value":90},{"date":"2024-01-17","value":95},{"date":"2024-01-18","value":88},{"date":"2024-01-19","value":94}]'::jsonb),

-- Mike's goals
('00000000-0000-0000-0000-000000000003', 'Study Hours', 'Complete 4 hours of focused study daily', 'custom', 240, 'minutes', 'achieve', 'daily', 'active', 220, 92, 6, 14, '#06b6d4', '📚', '[{"date":"2024-01-15","value":88},{"date":"2024-01-16","value":92},{"date":"2024-01-17","value":95},{"date":"2024-01-18","value":90},{"date":"2024-01-19","value":92}]'::jsonb),
('00000000-0000-0000-0000-000000000003', 'Gaming Limit', 'Limit gaming to 1 hour per day', 'custom', 60, 'minutes', 'limit', 'daily', 'active', 45, 75, 1, 3, '#ec4899', '🎮', '[{"date":"2024-01-15","value":80},{"date":"2024-01-16","value":70},{"date":"2024-01-17","value":75},{"date":"2024-01-18","value":65},{"date":"2024-01-19","value":75}]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert habits data for the last 7 days (sample data)
INSERT INTO public.habits (user_id, date, screen_time_total, screen_time_productive, screen_time_unproductive, screen_time_neutral, app_usage, cat_social, cat_productivity, cat_entertainment, cat_education, cat_communication, cat_news, cat_gaming, cat_other, focus_score, productivity_score, distraction_count, deep_work_minutes, night_usage, morning_usage, doom_scrolling_time, social_media_time, mood, energy_level, hourly_activity, goals_met_today, goals_total_today, notes) VALUES
-- Alex's habits (last 3 days)
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 420, 280, 80, 60, '[{"app":"VS Code","minutes":150,"category":"productivity"},{"app":"Slack","minutes":45,"category":"communication"},{"app":"YouTube","minutes":60,"category":"entertainment"},{"app":"Twitter","minutes":35,"category":"social"}]'::jsonb, 45, 180, 70, 30, 55, 20, 25, 15, 85, 82, 4, 120, 30, 65, 25, 40, 'good', 7, '[5,8,12,15,25,30,35,40,38,35,30,28,25,30,32,35,30,25,20,15,10,8,5,3]'::jsonb, 3, 4, 'Productive morning session'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 380, 250, 70, 60, '[{"app":"VS Code","minutes":140,"category":"productivity"},{"app":"Slack","minutes":40,"category":"communication"},{"app":"YouTube","minutes":45,"category":"entertainment"},{"app":"Twitter","minutes":30,"category":"social"}]'::jsonb, 40, 160, 55, 25, 50, 18, 22, 10, 78, 75, 6, 100, 25, 60, 20, 35, 'neutral', 6, '[3,5,10,12,20,28,32,35,33,30,25,22,20,25,28,30,25,20,18,12,8,5,3,2]'::jsonb, 2, 4, 'Felt distracted in afternoon'),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 450, 300, 90, 60, '[{"app":"VS Code","minutes":160,"category":"productivity"},{"app":"Slack","minutes":50,"category":"communication"},{"app":"YouTube","minutes":75,"category":"entertainment"},{"app":"Twitter","minutes":40,"category":"social"}]'::jsonb, 50, 190, 80, 35, 60, 25, 30, 20, 88, 85, 3, 130, 35, 70, 30, 45, 'good', 8, '[6,9,14,18,28,35,40,42,40,38,32,30,28,32,35,38,32,28,22,18,12,9,6,4]'::jsonb, 4, 4, 'Great focus session'),

-- Sarah's habits (last 3 days)
('00000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '2 days', 320, 200, 60, 60, '[{"app":"Figma","minutes":120,"category":"productivity"},{"app":"Slack","minutes":35,"category":"communication"},{"app":"Netflix","minutes":40,"category":"entertainment"},{"app":"Instagram","minutes":25,"category":"social"}]'::jsonb, 35, 140, 50, 20, 40, 15, 18, 12, 75, 72, 3, 90, 20, 55, 18, 30, 'good', 7, '[4,6,10,14,22,28,32,34,32,30,25,22,20,24,26,28,25,20,16,12,8,6,4,2]'::jsonb, 3, 3, 'Good design flow'),
('00000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '1 day', 350, 220, 70, 60, '[{"app":"Figma","minutes":130,"category":"productivity"},{"app":"Slack","minutes":40,"category":"communication"},{"app":"Netflix","minutes":50,"category":"entertainment"},{"app":"Instagram","minutes":30,"category":"social"}]'::jsonb, 40, 150, 60, 25, 45, 20, 22, 15, 80, 78, 4, 105, 25, 60, 25, 35, 'excellent', 8, '[5,8,12,16,25,30,35,37,35,33,28,25,23,27,30,32,28,23,18,14,10,7,5,3]'::jsonb, 4, 3, 'Very productive day'),
('00000000-0000-0000-0000-000000000002', CURRENT_DATE, 300, 180, 50, 70, '[{"app":"Figma","minutes":110,"category":"productivity"},{"app":"Slack","minutes":30,"category":"communication"},{"app":"Netflix","minutes":35,"category":"entertainment"},{"app":"Instagram","minutes":20,"category":"social"}]'::jsonb, 30, 120, 45, 18, 35, 12, 15, 10, 70, 68, 5, 80, 18, 50, 15, 25, 'neutral', 6, '[3,5,9,12,20,25,28,30,28,26,22,20,18,22,24,26,23,18,15,10,7,5,3,2]'::jsonb, 2, 3, 'Slower pace today'),

-- Mike's habits (last 3 days)
('00000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '2 days', 280, 180, 50, 50, '[{"app":"VS Code","minutes":100,"category":"productivity"},{"app":"Discord","minutes":30,"category":"communication"},{"app":"Steam","minutes":45,"category":"gaming"},{"app":"YouTube","minutes":25,"category":"entertainment"}]'::jsonb, 30, 120, 40, 35, 35, 25, 45, 15, 72, 70, 6, 85, 40, 45, 20, 30, 'good', 7, '[6,8,11,15,20,25,28,30,28,26,22,20,18,22,24,26,23,20,16,12,9,7,5,4]'::jsonb, 3, 3, 'Balanced study and play'),
('00000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', 320, 200, 60, 60, '[{"app":"VS Code","minutes":120,"category":"productivity"},{"app":"Discord","minutes":35,"category":"communication"},{"app":"Steam","minutes":55,"category":"gaming"},{"app":"YouTube","minutes":30,"category":"entertainment"}]'::jsonb, 35, 140, 50, 40, 40, 30, 55, 18, 78, 75, 4, 100, 35, 55, 25, 35, 'good', 8, '[7,9,13,17,23,28,32,34,32,30,26,23,21,25,27,29,26,22,18,14,11,8,6,5]'::jsonb, 4, 3, 'Good study session'),
('00000000-0000-0000-0000-000000000003', CURRENT_DATE, 250, 160, 40, 50, '[{"app":"VS Code","minutes":90,"category":"productivity"},{"app":"Discord","minutes":25,"category":"communication"},{"app":"Steam","minutes":35,"category":"gaming"},{"app":"YouTube","minutes":20,"category":"entertainment"}]'::jsonb, 25, 100, 35, 30, 30, 20, 35, 10, 68, 65, 8, 70, 30, 40, 15, 25, 'neutral', 6, '[5,7,10,13,18,22,25,27,25,23,20,18,16,19,21,23,21,18,14,10,8,6,4,3]'::jsonb, 2, 3, 'Less gaming, more focus')
ON CONFLICT (user_id, date) DO NOTHING;

-- Insert focus sessions
INSERT INTO public.focus_sessions (user_id, type, status, planned_duration, actual_duration, start_time, end_time, task, category, focus_quality, distraction_count, completion_percentage, pomodoro_number, breaks_taken, notes, tags) VALUES
-- Alex's sessions
('00000000-0000-0000-0000-000000000001', 'pomodoro', 'completed', 25, 25, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 35 minutes', 'Code review', 'work', 4, 1, 100, 1, 0, 'Good focus', '["work", "urgent"]'::jsonb),
('00000000-0000-0000-0000-000000000001', 'deep_work', 'completed', 90, 85, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours 25 minutes', 'Feature development', 'work', 5, 2, 94, 1, 1, 'Very productive', '["work", "coding"]'::jsonb),
('00000000-0000-0000-0000-000000000001', 'pomodoro', 'completed', 25, 20, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 40 minutes', 'Documentation writing', 'work', 3, 3, 80, 2, 0, 'Some interruptions', '["work"]'::jsonb),

-- Sarah's sessions
('00000000-0000-0000-0000-000000000002', 'deep_work', 'completed', 60, 60, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours', 'UI Design', 'creative', 5, 0, 100, 1, 0, 'Perfect flow state', '["creative", "design"]'::jsonb),
('00000000-0000-0000-0000-000000000002', 'pomodoro', 'completed', 25, 25, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 35 minutes', 'User research', 'study', 4, 1, 100, 1, 0, 'Good concentration', '["study"]'::jsonb),

-- Mike's sessions
('00000000-0000-0000-0000-000000000003', 'pomodoro', 'completed', 25, 22, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 38 minutes', 'Algorithm practice', 'study', 3, 2, 88, 3, 0, 'Challenging problems', '["study", "coding"]'::jsonb),
('00000000-0000-0000-0000-000000000003', 'deep_work', 'completed', 45, 40, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 20 minutes', 'Database design', 'coding', 4, 1, 89, 1, 0, 'Good progress', '["coding"]'::jsonb);

-- Insert notifications
INSERT INTO public.notifications (user_id, type, title, message, icon, priority, is_read, metadata) VALUES
-- Alex's notifications
('00000000-0000-0000-0000-000000000001', 'goal_achieved', 'Goal Achieved! 🎉', 'You completed your daily focus goal!', '🏆', 'high', false, '{"goal_id": "focus_goal"}'::jsonb),
('00000000-0000-0000-0000-000000000001', 'ai_insight', 'AI Insight Available', 'New patterns detected in your productivity', '💡', 'medium', true, '{"insight_type": "productivity_pattern"}'::jsonb),
('00000000-0000-0000-0000-000000000001', 'streak_reminder', 'Keep it Going!', 'You are on a 5-day streak!', '🔥', 'medium', false, '{"streak_days": 5}'::jsonb),

-- Sarah's notifications
('00000000-0000-0000-0000-000000000002', 'weekly_report', 'Weekly Report Ready', 'Your productivity report is available', '📊', 'medium', false, '{"report_type": "weekly"}'::jsonb),
('00000000-0000-0000-0000-000000000002', 'focus_reminder', 'Time for a Break', 'You have been working for 2 hours', '⏰', 'low', true, '{"reminder_type": "break"}'::jsonb),

-- Mike's notifications
('00000000-0000-0000-0000-000000000003', 'achievement_unlocked', 'New Achievement!', 'Study Champion badge earned', '🏅', 'high', false, '{"achievement": "study_champion"}'::jsonb),
('00000000-0000-0000-0000-000000000003', 'screen_time_warning', 'Screen Time Warning', 'You are approaching your daily limit', '📱', 'medium', true, '{"percentage": 85}'::jsonb);

-- Insert productivity scores for the last 3 days
INSERT INTO public.productivity_scores (user_id, date, focus_score, productivity_score, wellbeing_score, digital_balance_score, addiction_risk_score, mental_fatigue_score, attention_consistency_score, deep_work_efficiency_score, overall_score, breakdown, trend, change_from_yesterday) VALUES
-- Alex's scores
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '2 days', 85, 82, 75, 80, 25, 30, 78, 82, 81, '{"focus": 85, "productivity": 82, "wellbeing": 75, "balance": 80}'::jsonb, 'improving', 3.5),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '1 day', 78, 75, 70, 75, 30, 35, 72, 75, 75, '{"focus": 78, "productivity": 75, "wellbeing": 70, "balance": 75}'::jsonb, 'stable', -6.0),
('00000000-0000-0000-0000-000000000001', CURRENT_DATE, 88, 85, 80, 85, 20, 25, 82, 85, 85, '{"focus": 88, "productivity": 85, "wellbeing": 80, "balance": 85}'::jsonb, 'improving', 10.0),

-- Sarah's scores
('00000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '2 days', 75, 72, 85, 70, 35, 28, 70, 72, 73, '{"focus": 75, "productivity": 72, "wellbeing": 85, "balance": 70}'::jsonb, 'stable', 2.0),
('00000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '1 day', 80, 78, 88, 75, 30, 25, 75, 78, 78, '{"focus": 80, "productivity": 78, "wellbeing": 88, "balance": 75}'::jsonb, 'improving', 5.0),
('00000000-0000-0000-0000-000000000002', CURRENT_DATE, 70, 68, 82, 68, 40, 32, 68, 70, 69, '{"focus": 70, "productivity": 68, "wellbeing": 82, "balance": 68}'::jsonb, 'declining', -9.0),

-- Mike's scores
('00000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '2 days', 72, 70, 78, 72, 45, 38, 68, 70, 71, '{"focus": 72, "productivity": 70, "wellbeing": 78, "balance": 72}'::jsonb, 'stable', -1.5),
('00000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', 78, 75, 80, 78, 40, 30, 75, 75, 76, '{"focus": 78, "productivity": 75, "wellbeing": 80, "balance": 78}'::jsonb, 'improving', 5.0),
('00000000-0000-0000-0000-000000000003', CURRENT_DATE, 68, 65, 75, 68, 50, 42, 65, 68, 67, '{"focus": 68, "productivity": 65, "wellbeing": 75, "balance": 68}'::jsonb, 'declining', -9.0)
ON CONFLICT (user_id, date) DO NOTHING;

-- Insert AI reports for current week
INSERT INTO public.ai_reports (user_id, report_type, week_start, week_end, summary, insights, recommendations, predictions, scores, comparison, tokens_used) VALUES
('00000000-0000-0000-0000-000000000001', 'weekly', 
 DATE_TRUNC('week', CURRENT_DATE)::date, 
 (DATE_TRUNC('week', CURRENT_DATE)::date + INTERVAL '6 days')::date,
 'Your productivity improved this week. Great focus sessions and consistent goal achievement.',
 '["Peak focus time: 9-11 AM", "Most productive day: Tuesday", "Screen time decreased by 10%", "Deep work sessions: 12 this week"]'::jsonb,
 '["Continue morning deep work sessions", "Maintain current social media limits", "Consider adding afternoon break reminders"]'::jsonb,
 '["Productivity likely to improve next week", "Focus scores trending upward"]'::jsonb,
 '{"focus": 84, "productivity": 81, "wellbeing": 75, "digital_balance": 80}'::jsonb,
 '{"last_week": 5.2, "last_month": 12.5, "user_average": 78.5}'::jsonb,
 2450),

('00000000-0000-0000-0000-000000000002', 'weekly',
 DATE_TRUNC('week', CURRENT_DATE)::date,
 (DATE_TRUNC('week', CURRENT_DATE)::date + INTERVAL '6 days')::date,
 'Your productivity stayed consistent this week. Good work-life balance maintained.',
 '["Peak creativity time: 2-4 PM", "Most productive day: Wednesday", "Wellbeing scores excellent", "Design work quality high"]'::jsonb,
 '["Schedule creative work in afternoon", "Keep current sleep schedule", "Add variety to task types"]'::jsonb,
 '["Wellbeing likely to remain high", "Consider new creative challenges"]'::jsonb,
 '{"focus": 75, "productivity": 73, "wellbeing": 85, "digital_balance": 71}'::jsonb,
 '{"last_week": 2.3, "last_month": 8.7, "user_average": 76.0}'::jsonb,
 2100),

('00000000-0000-0000-0000-000000000003', 'weekly',
 DATE_TRUNC('week', CURRENT_DATE)::date,
 (DATE_TRUNC('week', CURRENT_DATE)::date + INTERVAL '6 days')::date,
 'Your productivity declined slightly this week. Consider reducing gaming time.',
 '["Peak study time: 10-12 AM", "Most productive day: Monday", "Gaming time increased by 20%", "Study consistency needs improvement"]'::jsonb,
 '["Set stricter gaming limits", "Use study apps for focus", "Create dedicated study space"]'::jsonb,
 '["Productivity likely to improve with adjustments", "Study habits can be strengthened"]'::jsonb,
 '{"focus": 70, "productivity": 68, "wellbeing": 78, "digital_balance": 70}'::jsonb,
 '{"last_week": -4.5, "last_month": 2.1, "user_average": 72.0}'::jsonb,
 2800);

-- Insert sample activity logs
INSERT INTO public.activity_logs (user_id, action, entity_type, metadata) VALUES
('00000000-0000-0000-0000-000000000001', 'user_login', 'user', '{"ip_address": "192.168.1.100", "user_agent": "Mozilla/5.0"}'::jsonb),
('00000000-0000-0000-0000-000000000001', 'focus_session_completed', 'focus_session', '{"session_duration": 85, "focus_quality": 5}'::jsonb),
('00000000-0000-0000-0000-000000000001', 'goal_completed', 'goal', '{"goal_type": "focus", "completion_rate": 100}'::jsonb),

('00000000-0000-0000-0000-000000000002', 'user_login', 'user', '{"ip_address": "192.168.1.101", "user_agent": "Mozilla/5.0"}'::jsonb),
('00000000-0000-0000-0000-000000000002', 'profile_updated', 'user', '{"updated_fields": ["bio", "goals"]}'::jsonb),
('00000000-0000-0000-0000-000000000002', 'report_generated', 'ai_report', '{"report_type": "weekly"}'::jsonb),

('00000000-0000-0000-0000-000000000003', 'user_login', 'user', '{"ip_address": "192.168.1.102", "user_agent": "Mozilla/5.0"}'::jsonb),
('00000000-0000-0000-0000-000000000003', 'habit_tracked', 'habit', '{"date": "' || CURRENT_DATE::text || '", "screen_time": 280}'::jsonb),
('00000000-0000-0000-0000-000000000003', 'achievement_unlocked', 'user', '{"achievement": "study_champion", "points": 100}'::jsonb);

-- ============================================================
-- Seeding completed! You now have:
-- 3 users with comprehensive profiles
-- Goals for each user
-- 3 days of habit tracking data
-- Focus sessions
-- Notifications
-- Productivity scores
-- AI reports
-- Activity logs
-- ============================================================
