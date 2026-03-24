-- Add parent_id to link sub keywords to their main keyword
alter table session_keywords add column if not exists parent_id uuid references session_keywords(id) on delete cascade;
create index if not exists idx_keywords_parent on session_keywords(parent_id);
