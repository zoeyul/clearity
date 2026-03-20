-- Add hit_count and updated_at to session_keywords for dedup & priority
alter table session_keywords add column if not exists hit_count integer not null default 1;
alter table session_keywords add column if not exists updated_at timestamptz not null default now();

-- Atomic hit_count increment function
create or replace function increment_hit_count(keyword_id uuid)
returns void as $$
  update session_keywords
  set hit_count = hit_count + 1, updated_at = now()
  where id = keyword_id;
$$ language sql security definer;
