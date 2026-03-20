-- Raw user input log for future re-processing
create table if not exists user_inputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  embedding float8[],
  extracted_main text not null,
  extracted_subs text[] not null default '{}',
  matched_keyword_id uuid references session_keywords(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_inputs_user on user_inputs(user_id);

alter table user_inputs enable row level security;

create policy "Users can manage own inputs"
  on user_inputs for all
  using (user_id = auth.uid());
