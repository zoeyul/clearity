-- User thinking tendency scores (0-100 spectrum)
-- 0 = left pole, 100 = right pole, 50 = neutral
create table if not exists user_tendencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  analytical_emotional integer not null default 50 check (analytical_emotional >= 0 and analytical_emotional <= 100),
  future_present integer not null default 50 check (future_present >= 0 and future_present <= 100),
  action_reflection integer not null default 50 check (action_reflection >= 0 and action_reflection <= 100),
  optimistic_cautious integer not null default 50 check (optimistic_cautious >= 0 and optimistic_cautious <= 100),
  session_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_tendencies enable row level security;

create policy "Users can manage own tendencies"
  on user_tendencies for all
  using (user_id = auth.uid());
