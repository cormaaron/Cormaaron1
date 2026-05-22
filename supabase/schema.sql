-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Initiatives table
create table if not exists initiatives (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  owner text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  business_value integer not null check (business_value between 1 and 10),
  feasibility integer not null check (feasibility between 1 and 10),
  readiness integer not null check (readiness between 1 and 10),
  risk integer not null check (risk between 1 and 10),
  composite_score numeric(5,2) generated always as (
    (business_value * 0.40) + (feasibility * 0.25) + (readiness * 0.20) + (risk * 0.15)
  ) stored,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Briefs table
create table if not exists briefs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  initiative_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- RLS policies
alter table initiatives enable row level security;
alter table briefs enable row level security;

create policy "Users manage own initiatives" on initiatives
  for all using (auth.uid() = user_id);

create policy "Users manage own briefs" on briefs
  for all using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger initiatives_updated_at
  before update on initiatives
  for each row execute function update_updated_at();
