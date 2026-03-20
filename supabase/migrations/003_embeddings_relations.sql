-- Add embedding vector to keywords
alter table session_keywords add column if not exists embedding float8[];
