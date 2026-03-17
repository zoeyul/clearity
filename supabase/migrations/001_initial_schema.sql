-- ============================================
-- Clearity DB Schema
-- ============================================

-- Chat sessions (left sidebar history + session state)
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  preview text,
  status text not null default 'active' check (status in ('active', 'completed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages (center chat area)
create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Live keywords (right panel - Live Keywords card)
create table session_keywords (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  label text not null,
  intensity text not null default 'medium' check (intensity in ('high', 'medium', 'low')),
  created_at timestamptz not null default now()
);

-- Emotional trend (right panel - Emotional Trend card)
create table session_emotions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  label text not null,
  value integer not null default 0 check (value >= 0 and value <= 100),
  created_at timestamptz not null default now()
);

-- Draft action items (right panel - Draft Action Items card)
create table action_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  text text not null,
  is_completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_messages_session on messages(session_id, created_at);
create index idx_keywords_session on session_keywords(session_id);
create index idx_emotions_session on session_emotions(session_id);
create index idx_action_items_session on action_items(session_id, sort_order);
create index idx_chat_sessions_user on chat_sessions(user_id, updated_at desc);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger chat_sessions_updated_at
  before update on chat_sessions
  for each row execute function update_updated_at();

create trigger action_items_updated_at
  before update on action_items
  for each row execute function update_updated_at();

-- RLS policies
alter table chat_sessions enable row level security;
alter table messages enable row level security;
alter table session_keywords enable row level security;
alter table session_emotions enable row level security;
alter table action_items enable row level security;

create policy "Users can manage own sessions"
  on chat_sessions for all
  using (auth.uid() = user_id);

create policy "Users can manage messages in own sessions"
  on messages for all
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "Users can manage keywords in own sessions"
  on session_keywords for all
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "Users can manage emotions in own sessions"
  on session_emotions for all
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "Users can manage action items in own sessions"
  on action_items for all
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));
