-- ============================================================
-- FocusPulse AI — Supabase PostgreSQL Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS (extends Supabase auth.users) ─────────────────────────────────────
create table if not exists public.users (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text not null,
  email         text not null unique,
  avatar        text default '',
  role          text default 'user' check (role in ('user', 'admin')),
  bio           text default '',
  timezone      text default 'UTC',
  occupation    text default '',
  age_group     text default '',
  -- Settings
  daily_screen_time_limit  integer default 480,
  focus_goal_minutes       integer default 120,
  work_start_hour          integer default 9,
  work_end_hour            integer default 18,
  notif_email              boolean default true,
  notif_push               boolean default true,
  notif_reminders          boolean default true,
  notif_weekly_report      boolean default true,
  -- Gamification
  streak_current    integer default 0,
  streak_longest    integer default 0,
  streak_last_date  date,
  total_points      integer default 0,
  level             integer default 1,
  badges            jsonb default '[]'::jsonb,
  is_active         boolean default true,
  last_login        timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── HABITS (one record per user per day) ────────────────────────────────────
create table if not exists public.habits (
  id                    uuid default uuid_generate_v4() primary key,
  user_id               uuid references public.users(id) on delete cascade not null,
  date                  date not null,
  -- Screen time (minutes)
  screen_time_total     integer default 0,
  screen_time_productive integer default 0,
  screen_time_unproductive integer default 0,
  screen_time_neutral   integer default 0,
  -- App usage (JSON array)
  app_usage             jsonb default '[]'::jsonb,
  -- Category breakdown (minutes)
  cat_social            integer default 0,
  cat_productivity      integer default 0,
  cat_entertainment     integer default 0,
  cat_education         integer default 0,
  cat_communication     integer default 0,
  cat_news              integer default 0,
  cat_gaming            integer default 0,
  cat_other             integer default 0,
  -- Scores
  focus_score           integer default 0 check (focus_score between 0 and 100),
  productivity_score    integer default 0 check (productivity_score between 0 and 100),
  distraction_count     integer default 0,
  deep_work_minutes     integer default 0,
  -- Behavioral patterns
  night_usage           integer default 0,
  morning_usage         integer default 0,
  doom_scrolling_time   integer default 0,
  social_media_time     integer default 0,
  -- Mood & energy
  mood                  text default '' check (mood in ('excellent','good','neutral','bad','terrible','')),
  energy_level          integer default 5 check (energy_level between 1 and 10),
  -- Hourly activity (24-element JSON array)
  hourly_activity       jsonb default '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::jsonb,
  -- Goals
  goals_met_today       integer default 0,
  goals_total_today     integer default 0,
  notes                 text default '',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique(user_id, date)
);

-- ─── GOALS ───────────────────────────────────────────────────────────────────
create table if not exists public.goals (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  title           text not null,
  description     text default '',
  type            text not null check (type in ('screen_time','focus','productivity','social_media','sleep','custom')),
  target_value    numeric not null,
  target_unit     text default 'minutes' check (target_unit in ('minutes','hours','sessions','percentage','count')),
  direction       text default 'achieve' check (direction in ('limit','achieve')),
  frequency       text default 'daily' check (frequency in ('daily','weekly','monthly')),
  status          text default 'active' check (status in ('active','completed','paused','failed')),
  current_value   numeric default 0,
  completion_rate integer default 0 check (completion_rate between 0 and 100),
  streak          integer default 0,
  best_streak     integer default 0,
  start_date      date default current_date,
  end_date        date,
  last_checked    timestamptz,
  progress_history jsonb default '[]'::jsonb,
  color           text default '#6366f1',
  icon            text default '🎯',
  is_archived     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── FOCUS SESSIONS ──────────────────────────────────────────────────────────
create table if not exists public.focus_sessions (
  id                    uuid default uuid_generate_v4() primary key,
  user_id               uuid references public.users(id) on delete cascade not null,
  type                  text default 'pomodoro' check (type in ('pomodoro','deep_work','short_break','long_break','custom')),
  status                text default 'active' check (status in ('active','completed','abandoned','paused')),
  planned_duration      integer not null,
  actual_duration       integer default 0,
  start_time            timestamptz not null default now(),
  end_time              timestamptz,
  task                  text default '',
  category              text default 'work' check (category in ('work','study','creative','reading','coding','other')),
  focus_quality         integer check (focus_quality between 1 and 5),
  distraction_count     integer default 0,
  completion_percentage integer default 0 check (completion_percentage between 0 and 100),
  pomodoro_number       integer default 1,
  breaks_taken          integer default 0,
  notes                 text default '',
  tags                  jsonb default '[]'::jsonb,
  created_at            timestamptz default now()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  type        text not null check (type in (
    'streak_reminder','goal_achieved','goal_failed','weekly_report',
    'ai_insight','screen_time_warning','focus_reminder',
    'achievement_unlocked','productivity_warning','motivation','system'
  )),
  title       text not null,
  message     text not null,
  icon        text default '🔔',
  priority    text default 'medium' check (priority in ('low','medium','high','urgent')),
  is_read     boolean default false,
  read_at     timestamptz,
  action_url  text default '',
  metadata    jsonb default '{}'::jsonb,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);

-- ─── AI REPORTS ──────────────────────────────────────────────────────────────
create table if not exists public.ai_reports (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  report_type     text default 'weekly' check (report_type in ('weekly','monthly','daily','on_demand')),
  week_start      date not null,
  week_end        date not null,
  summary         text default '',
  insights        jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  predictions     jsonb default '[]'::jsonb,
  scores          jsonb default '{}'::jsonb,
  comparison      jsonb default '{}'::jsonb,
  data_snapshot   jsonb default '{}'::jsonb,
  is_read         boolean default false,
  tokens_used     integer default 0,
  generated_at    timestamptz default now(),
  created_at      timestamptz default now()
);

-- ─── PRODUCTIVITY SCORES (one per user per day) ───────────────────────────────
create table if not exists public.productivity_scores (
  id                          uuid default uuid_generate_v4() primary key,
  user_id                     uuid references public.users(id) on delete cascade not null,
  date                        date not null,
  focus_score                 integer default 0 check (focus_score between 0 and 100),
  productivity_score          integer default 0 check (productivity_score between 0 and 100),
  wellbeing_score             integer default 0 check (wellbeing_score between 0 and 100),
  digital_balance_score       integer default 0 check (digital_balance_score between 0 and 100),
  addiction_risk_score        integer default 0 check (addiction_risk_score between 0 and 100),
  mental_fatigue_score        integer default 0 check (mental_fatigue_score between 0 and 100),
  attention_consistency_score integer default 0 check (attention_consistency_score between 0 and 100),
  deep_work_efficiency_score  integer default 0 check (deep_work_efficiency_score between 0 and 100),
  overall_score               integer default 0 check (overall_score between 0 and 100),
  breakdown                   jsonb default '{}'::jsonb,
  trend                       text default 'stable' check (trend in ('improving','stable','declining')),
  change_from_yesterday       numeric default 0,
  created_at                  timestamptz default now(),
  unique(user_id, date)
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  action      text not null,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists habits_user_date_idx on public.habits(user_id, date desc);
create index if not exists goals_user_status_idx on public.goals(user_id, status);
create index if not exists focus_sessions_user_idx on public.focus_sessions(user_id, start_time desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id, is_read, created_at desc);
create index if not exists ai_reports_user_idx on public.ai_reports(user_id, week_start desc);
create index if not exists productivity_scores_user_date_idx on public.productivity_scores(user_id, date desc);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger habits_updated_at before update on public.habits
  for each row execute function public.handle_updated_at();
create trigger goals_updated_at before update on public.goals
  for each row execute function public.handle_updated_at();

-- ─── AUTO-CREATE USER PROFILE ON SIGNUP ──────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.habits enable row level security;
alter table public.goals enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_reports enable row level security;
alter table public.productivity_scores enable row level security;
alter table public.activity_logs enable row level security;

-- Users: can only read/update their own row
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Habits: full CRUD on own rows only
create policy "habits_all_own" on public.habits for all using (auth.uid() = user_id);

-- Goals: full CRUD on own rows only
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id);

-- Focus sessions: full CRUD on own rows only
create policy "focus_sessions_all_own" on public.focus_sessions for all using (auth.uid() = user_id);

-- Notifications: full CRUD on own rows only
create policy "notifications_all_own" on public.notifications for all using (auth.uid() = user_id);

-- AI reports: full CRUD on own rows only
create policy "ai_reports_all_own" on public.ai_reports for all using (auth.uid() = user_id);

-- Productivity scores: full CRUD on own rows only
create policy "productivity_scores_all_own" on public.productivity_scores for all using (auth.uid() = user_id);

-- Activity logs: insert + select own
create policy "activity_logs_own" on public.activity_logs for all using (auth.uid() = user_id);
