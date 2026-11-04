alter table public.checklist_templates
  add column if not exists phase text,
  add column if not exists due_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'checklist_templates_phase_check'
      and conrelid = 'public.checklist_templates'::regclass
  ) then
    alter table public.checklist_templates
      add constraint checklist_templates_phase_check
      check (phase is null or phase in ('before', 'during', 'after'));
  end if;
end $$;

comment on column public.checklist_templates.phase is
  'Journey chapter: before, during, or after. Null means infer from due_date and semester dates.';
comment on column public.checklist_templates.due_date is
  'Optional coordinator-set due date, copied onto the student checklist row when it is generated.';
