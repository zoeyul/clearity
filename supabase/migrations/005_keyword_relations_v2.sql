-- keyword_relations: pure similarity score between main keywords
create table if not exists keyword_relations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references session_keywords(id) on delete cascade,
  target_id uuid not null references session_keywords(id) on delete cascade,
  score float8 not null check (score >= 0 and score <= 1),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(source_id, target_id)
);

create index if not exists idx_kw_relations_user on keyword_relations(user_id);
create index if not exists idx_kw_relations_source on keyword_relations(source_id);
create index if not exists idx_kw_relations_target on keyword_relations(target_id);

alter table keyword_relations enable row level security;

create policy "Users can manage own relations"
  on keyword_relations for all
  using (user_id = auth.uid());
