alter table public.research_notes
  add column if not exists body text;

alter table public.research_notes
  add column if not exists status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'research_notes_status_check'
      and conrelid = 'public.research_notes'::regclass
  ) then
    alter table public.research_notes
      add constraint research_notes_status_check
      check (status in ('active', 'archived'));
  end if;
end $$;

create index if not exists research_notes_user_status_created_idx
  on public.research_notes (user_id, status, created_at desc);
