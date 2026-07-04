alter table public.research_notes
  add column if not exists thesis jsonb;
