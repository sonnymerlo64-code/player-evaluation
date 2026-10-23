-- Run in Supabase SQL Editor. Create coach accounts in Authentication > Users.
-- SECURITY: Every authenticated coach in this Supabase project can read/write all
-- organizations by choosing an org code. This is an INTERNAL-TEAM MVP only.
-- For commercial/multi-organization use, replace these policies with membership-based RLS.
create extension if not exists pgcrypto;
create table if not exists public.pd_players (
 id uuid primary key default gen_random_uuid(), org text not null,
 first_name text not null,last_name text not null,team text not null,
 jersey text,created_at timestamptz not null default now());
create table if not exists public.pd_metrics (
 id uuid primary key default gen_random_uuid(),org text not null,
 category text not null check(category in ('Offense','Defense','Character')),
 name text not null,description text not null default '',active boolean not null default true,
 created_at timestamptz not null default now());
create table if not exists public.pd_evaluations (
 id uuid primary key default gen_random_uuid(),org text not null,
 player_id uuid not null references public.pd_players(id) on delete cascade,
 evaluated_at date not null,setting text not null,coach_email text not null,
 scores jsonb not null default '{}'::jsonb,strengths text not null default '',
 weaknesses text not null default '',notes text not null default '',
 created_at timestamptz not null default now());
create table if not exists public.pd_plans (
 id uuid primary key default gen_random_uuid(),org text not null,
 player_id uuid not null references public.pd_players(id) on delete cascade,
 metric_id uuid references public.pd_metrics(id) on delete set null,
 target_date date,goal text not null,actions text not null default '',
 measure text not null default '',status text not null default 'Active',
 coach_email text not null,created_at timestamptz not null default now());
create index if not exists pd_players_org_idx on public.pd_players(org);
create index if not exists pd_metrics_org_idx on public.pd_metrics(org);
create index if not exists pd_evaluations_org_player_idx on public.pd_evaluations(org,player_id,evaluated_at);
create index if not exists pd_plans_org_player_idx on public.pd_plans(org,player_id);
alter table public.pd_players enable row level security;
alter table public.pd_metrics enable row level security;
alter table public.pd_evaluations enable row level security;
alter table public.pd_plans enable row level security;
create policy "pd_players_authenticated" on public.pd_players for all to authenticated using (true) with check (true);
create policy "pd_metrics_authenticated" on public.pd_metrics for all to authenticated using (true) with check (true);
create policy "pd_evaluations_authenticated" on public.pd_evaluations for all to authenticated using (true) with check (true);
create policy "pd_plans_authenticated" on public.pd_plans for all to authenticated using (true) with check (true);
