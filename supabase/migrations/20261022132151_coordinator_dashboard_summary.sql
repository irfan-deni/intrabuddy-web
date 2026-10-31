-- Version matches the migration applied to the INTRA Buddy Supabase project.
-- Invoker permissions preserve the existing table grants and RLS policies.
create or replace function public.get_coordinator_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not exists (
    select 1 from public.users
    where id = (select auth.uid()) and role = 'coordinator'
  ) then
    raise exception 'Coordinator access required' using errcode = '42501';
  end if;

  with active_semester as (
    -- A scalar lookup also detects an invalid multiple-active-semester setup.
    select id, name from public.semesters
    where id = (select id from public.semesters where is_active = true)
  ), enrolled as (
    select distinct enrollment.student_id,
      exists (
        select 1 from public.job_applications application
        where application.student_id = enrollment.student_id
          and application.status in ('Accepted', 'Interview')
      ) as placed
    from public.student_semesters enrollment
    join active_semester semester on semester.id = enrollment.semester_id
    join public.users student on student.id = enrollment.student_id and student.role = 'student'
  ), placement_counts as (
    select count(*) as total, count(*) filter (where placed) as placed
    from enrolled
  ), logbook_counts as (
    select count(*) as total,
      count(*) filter (where tracking.is_submitted is true) as submitted,
      count(*) filter (
        where tracking.is_submitted is not true
          and tracking.week_end_date < (statement_timestamp() at time zone 'UTC')::date
      ) as late
    from public.weekly_logbook_tracking tracking
    join active_semester semester on semester.id = tracking.semester_id
    join public.users student on student.id = tracking.student_id and student.role = 'student'
  )
  select jsonb_build_object(
    'semesterName', coalesce((select name from active_semester), 'No Active Semester Set'),
    'totalStudents', placement.total,
    'placedStudents', placement.placed,
    'unplacedStudents', placement.total - placement.placed,
    'placementPercentage', case when placement.total > 0
      then round(placement.placed * 100.0 / placement.total)::integer else 0 end,
    'logbookSummary', jsonb_build_object(
      'total', logbooks.total,
      'submitted', logbooks.submitted,
      'late', logbooks.late,
      'pending', logbooks.total - logbooks.submitted - logbooks.late
    )
  ) into result
  from placement_counts placement cross join logbook_counts logbooks;

  return result;
end;
$$;

revoke all on function public.get_coordinator_dashboard() from public, anon;
grant execute on function public.get_coordinator_dashboard() to authenticated;
