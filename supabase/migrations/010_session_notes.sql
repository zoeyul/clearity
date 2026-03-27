-- Notes attached to chat sessions
create table if not exists session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_session_notes_session on session_notes(session_id);
create index if not exists idx_session_notes_user on session_notes(user_id);

alter table session_notes enable row level security;

create policy "Users can manage own notes"
  on session_notes for all
  using (user_id = auth.uid());

create trigger session_notes_updated_at
  before update on session_notes
  for each row execute function update_updated_at();
