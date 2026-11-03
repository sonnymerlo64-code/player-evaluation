-- Run once in Supabase SQL Editor before deploying V7.
-- Existing players, evaluations, plans and scores remain unchanged.
alter table public.pd_evaluations add column if not exists level integer not null default 2;
alter table public.pd_evaluations add column if not exists observations jsonb not null default '{}'::jsonb;
alter table public.pd_evaluations drop constraint if exists pd_evaluations_level_check;
alter table public.pd_evaluations add constraint pd_evaluations_level_check check(level between 1 and 4);

create table if not exists public.pd_eval_admins (
 org text not null,
 email text not null,
 primary key(org,email)
);
create table if not exists public.pd_response_options (
 id uuid primary key default gen_random_uuid(),
 org text not null,
 metric_id uuid not null references public.pd_metrics(id) on delete cascade,
 kind text not null check(kind in ('strengths','improvements','drills')),
 response text not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create index if not exists pd_response_options_org_idx on public.pd_response_options(org,metric_id,kind);
alter table public.pd_eval_admins enable row level security;
alter table public.pd_response_options enable row level security;
drop policy if exists pd_eval_admins_read_self on public.pd_eval_admins;
create policy pd_eval_admins_read_self on public.pd_eval_admins for select to authenticated
 using (lower(email)=lower(auth.jwt()->>'email'));
drop policy if exists pd_response_options_read on public.pd_response_options;
create policy pd_response_options_read on public.pd_response_options for select to authenticated using (true);
drop policy if exists pd_response_options_insert_admin on public.pd_response_options;
create policy pd_response_options_insert_admin on public.pd_response_options for insert to authenticated
 with check (exists(select 1 from public.pd_eval_admins a where a.org=pd_response_options.org and lower(a.email)=lower(auth.jwt()->>'email')));
drop policy if exists pd_response_options_update_admin on public.pd_response_options;
create policy pd_response_options_update_admin on public.pd_response_options for update to authenticated
 using (exists(select 1 from public.pd_eval_admins a where a.org=pd_response_options.org and lower(a.email)=lower(auth.jwt()->>'email')))
 with check (exists(select 1 from public.pd_eval_admins a where a.org=pd_response_options.org and lower(a.email)=lower(auth.jwt()->>'email')));

-- IMPORTANT: Replace YOUR_ORGANIZATION_CODE with the exact organization code
-- used in the app, then uncomment and run this statement separately:
-- insert into public.pd_eval_admins(org,email)
-- values ('YOUR_ORGANIZATION_CODE','smerlo@fca.org')
-- on conflict do nothing;
