-- Add status and hierarchy to session_keywords
alter table session_keywords add column if not exists status text not null default 'fragment' check (status in ('fragment', 'clustered', 'core', 'resolved'));
alter table session_keywords add column if not exists hierarchy text not null default 'sub' check (hierarchy in ('main', 'sub'));
alter table session_keywords add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Allow keywords without session (fragments from dashboard input)
alter table session_keywords alter column session_id drop not null;

-- Index for fetching user's active keywords
create index if not exists idx_keywords_user_status on session_keywords(user_id, status);
