-- ============================================================
-- Dashboard Data Loading Fix - SQL Verification & Fixes
-- Run this in Supabase SQL Editor to debug dashboard issues
-- ============================================================

-- 1. Check if all required tables exist
SELECT 'habits table exists' as status, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'habits';

SELECT 'users table exists' as status, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

SELECT 'productivity_scores table exists' as status, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'productivity_scores';

-- 2. Check if RLS is enabled and policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('habits', 'users', 'productivity_scores');

-- 3. Verify RLS policies are correctly configured
-- Check if policies use auth.uid() correctly
SELECT 
  'habits policy check' as check,
  CASE 
    WHEN policydef LIKE '%auth.uid() = user_id%' THEN 'CORRECT'
    WHEN policydef LIKE '%auth.uid() = id%' THEN 'CORRECT'
    ELSE 'INCORRECT'
  END as policy_status
FROM pg_policies 
WHERE tablename = 'habits' AND policyname = 'habits_all_own';

-- 4. Check if user has any data (replace with actual user ID)
-- Replace 'YOUR_USER_ID_HERE' with an actual user UUID from your auth.users table
SELECT 
  'User habits count' as check,
  COUNT(*) as count,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM public.habits 
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 5. Check if user profile exists
SELECT 
  'User profile check' as check,
  COUNT(*) as count,
  id,
  name,
  email,
  is_active,
  streak_current,
  streak_longest
FROM public.users 
WHERE id = 'YOUR_USER_ID_HERE';

-- 6. Sample data check for today
SELECT 
  'Today data check' as check,
  COUNT(*) as count
FROM public.habits 
WHERE user_id = 'YOUR_USER_ID_HERE' 
  AND date = CURRENT_DATE;

-- 7. Fix RLS policies if they're broken
-- Drop existing policies (only if broken)
DROP POLICY IF EXISTS "habits_all_own" ON public.habits;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "productivity_scores_all_own" ON public.productivity_scores;

-- Recreate correct policies
CREATE POLICY "habits_all_own" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "productivity_scores_all_own" ON public.productivity_scores
  FOR ALL USING (auth.uid() = user_id);

-- 8. Ensure RLS is enabled
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_scores ENABLE ROW LEVEL SECURITY;

-- 9. Create test data for debugging (optional)
-- Insert a test record for today to verify dashboard works
INSERT INTO public.habits (
  user_id, 
  date, 
  screen_time_total, 
  screen_time_productive, 
  screen_time_unproductive,
  focus_score,
  productivity_score,
  deep_work_minutes,
  social_media_time,
  night_usage,
  distraction_count,
  mood,
  energy_level
) VALUES (
  'YOUR_USER_ID_HERE',
  CURRENT_DATE,
  240,  -- 4 hours total
  150,  -- 2.5 hours productive
  90,   -- 1.5 hours unproductive
  75,   -- focus score
  85,   -- productivity score
  120,  -- 2 hours deep work
  60,   -- 1 hour social media
  30,   -- 30 minutes night usage
  8,    -- 8 distractions
  'good',
  7
) ON CONFLICT (user_id, date) DO NOTHING;

-- 10. Verify test data was inserted
SELECT 
  'Test insert verification' as check,
  COUNT(*) as count,
  screen_time_total,
  focus_score,
  productivity_score
FROM public.habits 
WHERE user_id = 'YOUR_USER_ID_HERE' 
  AND date = CURRENT_DATE;

-- ============================================================
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_USER_ID_HERE' with actual user UUID
-- 2. Run sections 1-6 first to diagnose issues
-- 3. Run sections 7-10 to fix issues and add test data
-- 4. Check dashboard after running this script
-- ============================================================
