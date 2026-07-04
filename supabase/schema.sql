create extension if not exists "pgcrypto";

create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-user',
  symbol text not null,
  name text not null,
  market text not null,
  group_name text not null default '我的自选',
  price numeric not null,
  change_percent numeric not null,
  currency text not null,
  added_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists public.research_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-user',
  title text not null,
  symbol text,
  tag text not null default 'AI 分析',
  excerpt text not null,
  report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists watchlist_items_user_created_idx
  on public.watchlist_items (user_id, created_at desc);

create index if not exists research_notes_user_created_idx
  on public.research_notes (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists watchlist_items_set_updated_at on public.watchlist_items;
create trigger watchlist_items_set_updated_at
before update on public.watchlist_items
for each row execute function public.set_updated_at();

drop trigger if exists research_notes_set_updated_at on public.research_notes;
create trigger research_notes_set_updated_at
before update on public.research_notes
for each row execute function public.set_updated_at();
