-- Fix RLS: "for all using(...)" blocks INSERT operations
-- Split into per-operation policies with explicit "with check" for INSERT
-- Idempotent: drops ALL policies (old and new names) before creating

-- ========== chat_sessions ==========
drop policy if exists "Users can manage own sessions" on chat_sessions;
drop policy if exists "chat_sessions_select" on chat_sessions;
drop policy if exists "chat_sessions_insert" on chat_sessions;
drop policy if exists "chat_sessions_update" on chat_sessions;
drop policy if exists "chat_sessions_delete" on chat_sessions;

create policy "chat_sessions_select" on chat_sessions for select
  using (auth.uid() = user_id);

create policy "chat_sessions_insert" on chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "chat_sessions_update" on chat_sessions for update
  using (auth.uid() = user_id);

create policy "chat_sessions_delete" on chat_sessions for delete
  using (auth.uid() = user_id);

-- ========== messages ==========
drop policy if exists "Users can manage messages in own sessions" on messages;
drop policy if exists "messages_select" on messages;
drop policy if exists "messages_insert" on messages;
drop policy if exists "messages_update" on messages;
drop policy if exists "messages_delete" on messages;

create policy "messages_select" on messages for select
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "messages_insert" on messages for insert
  with check (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "messages_update" on messages for update
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "messages_delete" on messages for delete
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

-- ========== session_keywords ==========
drop policy if exists "Users can manage keywords in own sessions" on session_keywords;
drop policy if exists "session_keywords_select" on session_keywords;
drop policy if exists "session_keywords_insert" on session_keywords;
drop policy if exists "session_keywords_update" on session_keywords;
drop policy if exists "session_keywords_delete" on session_keywords;

create policy "session_keywords_select" on session_keywords for select
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "session_keywords_insert" on session_keywords for insert
  with check (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "session_keywords_update" on session_keywords for update
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "session_keywords_delete" on session_keywords for delete
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

-- ========== session_emotions ==========
drop policy if exists "Users can manage emotions in own sessions" on session_emotions;
drop policy if exists "session_emotions_select" on session_emotions;
drop policy if exists "session_emotions_insert" on session_emotions;
drop policy if exists "session_emotions_update" on session_emotions;
drop policy if exists "session_emotions_delete" on session_emotions;

create policy "session_emotions_select" on session_emotions for select
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "session_emotions_insert" on session_emotions for insert
  with check (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "session_emotions_update" on session_emotions for update
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "session_emotions_delete" on session_emotions for delete
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

-- ========== action_items ==========
drop policy if exists "Users can manage action items in own sessions" on action_items;
drop policy if exists "action_items_select" on action_items;
drop policy if exists "action_items_insert" on action_items;
drop policy if exists "action_items_update" on action_items;
drop policy if exists "action_items_delete" on action_items;

create policy "action_items_select" on action_items for select
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "action_items_insert" on action_items for insert
  with check (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "action_items_update" on action_items for update
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));

create policy "action_items_delete" on action_items for delete
  using (session_id in (select id from chat_sessions where user_id = auth.uid()));
