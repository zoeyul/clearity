-- User profiles: accumulated traits extracted from conversations
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  interests text not null default '',
  patterns text not null default '',
  threshold text not null default '',
  assets text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_user_profiles_user on user_profiles(user_id);

alter table user_profiles enable row level security;

create policy "Users can manage own profile"
  on user_profiles for all
  using (auth.uid() = user_id);

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();
