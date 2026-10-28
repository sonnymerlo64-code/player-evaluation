-- Run once in the EXISTING Player Evaluation Supabase project. Preserves existing records.
alter table public.pd_evaluations add column if not exists skill_plans jsonb not null default '{}'::jsonb;
