-- ==========================================
-- TIMINGS APP DATABASE SCHEMA
-- Execute directly in the Supabase Cloud SQL Editor
-- ==========================================

-- --- 1. TABLES CREATION ---

-- Create profiles table linked to Supabase Auth
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  is_pro boolean not null default false,
  streak_days integer not null default 0,
  avatar_id text not null default 'avatar-1',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create routines table
create table public.routines (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  category text,
  last_executed text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create routine steps table
create table public.routine_steps (
  id text primary key,
  routine_id text not null references public.routines(id) on delete cascade,
  name text not null,
  description text,
  duration integer not null,
  cue text not null check (cue in ('single-chime', 'double-chime', 'silent')),
  type text not null check (type in ('work', 'rest', 'interval', 'flow')),
  position integer not null
);

-- Create routine checklist items table
create table public.routine_checklist_items (
  id text primary key,
  routine_id text not null references public.routines(id) on delete cascade,
  label text not null,
  checked boolean not null default false,
  position integer not null
);

-- Create global checklist items table
create table public.global_checklist_items (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  checked boolean not null default false,
  position integer not null
);

-- Create session history table
create table public.session_history (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_name text not null,
  timestamp text not null,
  duration_minutes integer not null,
  completion_rate integer not null,
  created_at timestamp with time zone not null default now()
);

-- --- 2. INDEXING ---
create index idx_routines_user_id on public.routines(user_id);
create index idx_routine_steps_routine_id on public.routine_steps(routine_id);
create index idx_routine_checklist_items_routine_id on public.routine_checklist_items(routine_id);
create index idx_global_checklist_items_user_id on public.global_checklist_items(user_id);
create index idx_session_history_user_id on public.session_history(user_id);

-- --- 3. TRIGGERS & FUNCTIONS ---

-- Trigger to manage updated_at dynamically
create or replace function public.handle_update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute procedure public.handle_update_timestamp();

create trigger on_routine_updated
  before update on public.routines
  for each row execute procedure public.handle_update_timestamp();

-- Trigger to automatically create a profile for new auth users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, is_pro, streak_days, avatar_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    false,
    0,
    'avatar-1'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --- 4. ROW LEVEL SECURITY (RLS) & POLICIES ---

alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.routine_steps enable row level security;
alter table public.routine_checklist_items enable row level security;
alter table public.global_checklist_items enable row level security;
alter table public.session_history enable row level security;

-- Profiles Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Routines Policies
create policy "Users can view their own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert their own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can delete their own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- Steps Policies
create policy "Users can view steps of their own routines"
  on public.routine_steps for select
  using (exists (
    select 1 from public.routines r
    where r.id = routine_steps.routine_id and r.user_id = auth.uid()
  ));

create policy "Users can insert steps for their own routines"
  on public.routine_steps for insert
  with check (exists (
    select 1 from public.routines r
    where r.id = routine_steps.routine_id and r.user_id = auth.uid()
  ));

create policy "Users can update steps of their own routines"
  on public.routine_steps for update
  using (exists (
    select 1 from public.routines r
    where r.id = routine_steps.routine_id and r.user_id = auth.uid()
  ));

create policy "Users can delete steps of their own routines"
  on public.routine_steps for delete
  using (exists (
    select 1 from public.routines r
    where r.id = routine_steps.routine_id and r.user_id = auth.uid()
  ));

-- Routine Checklist Policies
create policy "Users can view checklist items of their own routines"
  on public.routine_checklist_items for select
  using (exists (
    select 1 from public.routines r
    where r.id = routine_checklist_items.routine_id and r.user_id = auth.uid()
  ));

create policy "Users can insert checklist items for their own routines"
  on public.routine_checklist_items for insert
  with check (exists (
    select 1 from public.routines r
    where r.id = routine_checklist_items.routine_id and r.user_id = auth.uid()
  ));

create policy "Users can update checklist items of their own routines"
  on public.routine_checklist_items for update
  using (exists (
    select 1 from public.routines r
    where r.id = routine_checklist_items.routine_id and r.user_id = auth.uid()
  ));

create policy "Users can delete checklist items of their own routines"
  on public.routine_checklist_items for delete
  using (exists (
    select 1 from public.routines r
    where r.id = routine_checklist_items.routine_id and r.user_id = auth.uid()
  ));

-- Global Checklist Policies
create policy "Users can view their own global checklist items"
  on public.global_checklist_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own global checklist items"
  on public.global_checklist_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own global checklist items"
  on public.global_checklist_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own global checklist items"
  on public.global_checklist_items for delete
  using (auth.uid() = user_id);

-- Session History Policies
create policy "Users can view their own session history"
  on public.session_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own session history"
  on public.session_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own session history"
  on public.session_history for delete
  using (auth.uid() = user_id);

-- --- 5. SEED DATA ---
-- Note: Seed data has been removed. Users should register dynamically through the Auth UI.

