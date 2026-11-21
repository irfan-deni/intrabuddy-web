create or replace function public.get_coordinator_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
  today date := (statement_timestamp() at time zone 'UTC')::date;
begin
  if not exists (
    select 1 from public.users where id = (select auth.uid()) and role = 'coordinator'
  ) then
    raise exception 'Coordinator access required' using errcode = '42501';
  end if;

  with active_semester as (
    select id, name, start_date, end_date, registration_open
    from public.semesters
    where id = (select id from public.semesters where is_active is true)
  ), enrolled as (
    select distinct enrollment.student_id, enrollment.semester_id
    from public.student_semesters enrollment
    join active_semester semester on semester.id = enrollment.semester_id
    join public.users student on student.id = enrollment.student_id and student.role = 'student'
  ), placement_and_checklist as (
    select count(*) as total,
      count(*) filter (where exists (
        select 1 from public.job_applications application
        where application.student_id = enrolled.student_id
          and application.semester_id = enrolled.semester_id
          and application.status = 'Accepted'
      )) as placed,
      count(*) filter (where exists (
        select 1 from public.checklist_templates template
        where template.semester_id = enrolled.semester_id and template.required is true
          and not exists (
            select 1 from public.student_checklists item
            where item.student_id = enrolled.student_id
              and item.checklist_item_id = template.id and item.is_completed is true
          )
      )) as missing_checklists
    from enrolled
  ), tracking as (
    select logbook.week_end_date, logbook.is_submitted
    from public.weekly_logbook_tracking logbook
    join active_semester semester on semester.id = logbook.semester_id
    join public.users student on student.id = logbook.student_id and student.role = 'student'
    where logbook.week_end_date between today and today + 6
  ), current_week as (
    -- Use the reporting schedule rather than assuming weeks end on Sunday.
    select min(week_end_date) as ends_on from tracking
  ), weekly_counts as (
    select count(*) as total,
      count(*) filter (where tracking.is_submitted is true) as submitted
    from tracking join current_week on tracking.week_end_date = current_week.ends_on
  )
  select jsonb_build_object(
    'semesterName', coalesce((select name from active_semester), 'No Active Semester Set'),
    'semester', (select jsonb_build_object('id', id, 'startDate', start_date,
      'endDate', end_date, 'registrationOpen', registration_open) from active_semester),
    'totalStudents', placement.total,
    'placedStudents', placement.placed,
    'unplacedStudents', placement.total - placement.placed,
    'placementPercentage', case when placement.total > 0
      then round(placement.placed * 100.0 / placement.total)::integer else null end,
    'studentsMissingChecklists', placement.missing_checklists,
    'logbookSummary', jsonb_build_object(
      'weekStart', week.ends_on - 6,
      'weekEnd', week.ends_on,
      'total', logbooks.total,
      'submitted', logbooks.submitted,
      'pending', logbooks.total - logbooks.submitted
    ),
    'overdueLogbooks', (
      select count(*) from public.weekly_logbook_tracking logbook
      join active_semester semester on semester.id = logbook.semester_id
      join public.users student on student.id = logbook.student_id and student.role = 'student'
      where logbook.is_submitted is not true and logbook.week_end_date < today
    )
  ) into result
  from placement_and_checklist placement cross join weekly_counts logbooks cross join current_week week;

  return result;
end;
$$;

revoke all on function public.get_coordinator_dashboard() from public, anon;
grant execute on function public.get_coordinator_dashboard() to authenticated;
