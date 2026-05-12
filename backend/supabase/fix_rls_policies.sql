-- ============================================================
-- RLS Policy Fix for Dashboard Data Loading
-- Run this in Supabase SQL Editor to fix RLS issues
-- ============================================================

-- 1. Check current RLS policies
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

-- 2. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('habits', 'users', 'productivity_scores');

-- 3. Drop existing policies that might be broken
DROP POLICY IF EXISTS "habits_all_own" ON public.habits;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "productivity_scores_all_own" ON public.productivity_scores;

-- 4. Recreate RLS policies with proper auth.uid() usage
-- Habits table - full CRUD for own rows
CREATE POLICY "habits_select_own" ON public.habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "habits_insert_own" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits_update_own" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "habits_delete_own" ON public.habits
  FOR DELETE USING (auth.uid() = user_id);

-- Users table - read/update own rows
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Productivity scores table - full CRUD for own rows
CREATE POLICY "productivity_scores_select_own" ON public.productivity_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "productivity_scores_insert_own" ON public.productivity_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "productivity_scores_update_own" ON public.productivity_scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "productivity_scores_delete_own" ON public.productivity_scores
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Ensure RLS is enabled
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productivity_scores ENABLE ROW LEVEL SECURITY;

-- 6. Test RLS policies with a verification query
-- This should return data if policies work correctly
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with actual user ID
    test_result RECORD;
BEGIN
    SELECT * INTO test_result 
    FROM public.habits 
    WHERE user_id = test_user_id 
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE 'RLS policies working: User can access their own data';
    ELSE
        RAISE NOTICE 'RLS policies NOT working: User cannot access their own data';
    END IF;
END $$;

-- 7. Create a test habit record to verify insert permissions
-- Replace with actual user ID
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
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
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

-- 8. Verify the test record was inserted
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with actual user ID
    test_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_count 
    FROM public.habits 
    WHERE user_id = test_user_id 
    AND date = CURRENT_DATE;
    
    IF test_count > 0 THEN
        RAISE NOTICE 'RLS INSERT working: Test record created successfully';
    ELSE
        RAISE NOTICE 'RLS INSERT NOT working: Test record not created';
    END IF;
END $$;

-- ============================================================
-- INSTRUCTIONS:
-- 1. Replace '00000000-0000-0000-0000-000000000000' with actual user UUID
-- 2. Run sections 1-2 to check current state
-- 3. Run sections 3-5 to fix RLS policies
-- 4. Run sections 6-8 to test RLS policies
-- 5. Check backend logs for RLS access errors
-- ============================================================
