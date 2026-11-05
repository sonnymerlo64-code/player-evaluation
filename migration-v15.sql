-- Run in Supabase SQL Editor before deploying V15. Does not alter historical evaluations.
create table if not exists public.pd_level_skills (
 id uuid primary key default gen_random_uuid(),
 org text not null,
 metric_id uuid not null references public.pd_metrics(id) on delete cascade,
 level integer not null check(level between 1 and 4),
 description text not null default '',
 required boolean not null default true,
 updated_at timestamptz not null default now(),
 unique(org,metric_id,level)
);
create table if not exists public.pd_certifications (
 id uuid primary key default gen_random_uuid(),
 org text not null,
 player_id uuid not null references public.pd_players(id) on delete cascade,
 evaluation_id uuid not null references public.pd_evaluations(id) on delete cascade,
 level integer not null check(level between 1 and 4),
 score_percent numeric(6,2) not null check(score_percent>=90 and score_percent<=100),
 approved_by text not null,
 created_at timestamptz not null default now(),
 unique(org,evaluation_id)
);
alter table public.pd_level_skills enable row level security;
alter table public.pd_certifications enable row level security;
drop policy if exists pd_level_skills_read on public.pd_level_skills;
create policy pd_level_skills_read on public.pd_level_skills for select to authenticated using (true);
drop policy if exists pd_level_skills_admin_insert on public.pd_level_skills;
create policy pd_level_skills_admin_insert on public.pd_level_skills for insert to authenticated with check (exists(select 1 from public.pd_eval_admins a where a.org=pd_level_skills.org and lower(a.email)=lower(auth.jwt()->>'email')));
drop policy if exists pd_level_skills_admin_update on public.pd_level_skills;
create policy pd_level_skills_admin_update on public.pd_level_skills for update to authenticated using (exists(select 1 from public.pd_eval_admins a where a.org=pd_level_skills.org and lower(a.email)=lower(auth.jwt()->>'email'))) with check (exists(select 1 from public.pd_eval_admins a where a.org=pd_level_skills.org and lower(a.email)=lower(auth.jwt()->>'email')));
drop policy if exists pd_certifications_read on public.pd_certifications;
create policy pd_certifications_read on public.pd_certifications for select to authenticated using (true);
drop policy if exists pd_certifications_admin_insert on public.pd_certifications;
create policy pd_certifications_admin_insert on public.pd_certifications for insert to authenticated with check (exists(select 1 from public.pd_eval_admins a where a.org=pd_certifications.org and lower(a.email)=lower(auth.jwt()->>'email')) and lower(approved_by)=lower(auth.jwt()->>'email')));
