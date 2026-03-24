-- Combined embedding (keyword + sentence) for better similarity
alter table session_keywords add column if not exists embedding_v2 float8[];
