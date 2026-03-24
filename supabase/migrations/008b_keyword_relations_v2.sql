-- v2 similarity scores (keyword + sentence combined embedding)
create table if not exists keyword_relations_v2 (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references session_keywords(id) on delete cascade,
  target_id uuid not null references session_keywords(id) on delete cascade,
  score float8 not null check (score >= 0 and score <= 1),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(source_id, target_id)
);

create index if not exists idx_kw_relations_v2_user on keyword_relations_v2(user_id);

alter table keyword_relations_v2 enable row level security;

create policy "Users can manage own relations v2"
  on keyword_relations_v2 for all
  using (user_id = auth.uid());
