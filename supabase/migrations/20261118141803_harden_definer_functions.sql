create or replace function public.get_student_dashboard(p_student_id uuid)
returns table (
  total_checklist_items bigint,
  completed_checklist_items bigint,
  checklist_percentage numeric,
  total_weeks bigint,
  submitted_weeks bigint,
  weeks_percentage numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if p_student_id <> v_uid and not exists (
    select 1
    from public.users u
    where u.id = v_uid
      and u.role in ('coordinator', 'super_coordinator')
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.student_checklists c where c.student_id = p_student_id)::bigint,
    (select count(*) from public.student_checklists c where c.student_id = p_student_id and c.is_completed)::bigint,
    round((select count(*) from public.student_checklists c where c.student_id = p_student_id and c.is_completed)::numeric
      / nullif((select count(*) from public.student_checklists c where c.student_id = p_student_id), 0) * 100, 2),
    (select count(*) from public.weekly_logbook_tracking w where w.student_id = p_student_id)::bigint,
    (select count(*) from public.weekly_logbook_tracking w where w.student_id = p_student_id and w.is_submitted)::bigint,
    round((select count(*) from public.weekly_logbook_tracking w where w.student_id = p_student_id and w.is_submitted)::numeric
      / nullif((select count(*) from public.weekly_logbook_tracking w where w.student_id = p_student_id), 0) * 100, 2);
end;
$$;

revoke all on function public.get_student_dashboard(uuid) from public;
grant execute on function public.get_student_dashboard(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, full_name, role, student_id, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'phone_number'
  );
  return new;
end;
$$;
