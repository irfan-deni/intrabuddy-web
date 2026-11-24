alter table public.semesters
  add column if not exists registration_open boolean not null default false;

create unique index if not exists semesters_one_open_registration
  on public.semesters (registration_open)
  where registration_open;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $function$
begin
  insert into public.users (id, email, full_name, role, student_id, phone_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'phone_number'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      student_id = excluded.student_id,
      phone_number = excluded.phone_number,
      updated_at = now();

  if coalesce(new.raw_user_meta_data->>'role', 'student') = 'student' then
    insert into public.student_semesters (student_id, semester_id)
    select new.id, s.id
    from public.semesters s
    where s.registration_open
    order by s.start_date desc
    limit 1
    on conflict (student_id, semester_id) do nothing;
  end if;

  return new;
end;
$function$;

create or replace function public.get_open_semester()
returns table (id int, name text, start_date date, end_date date)
language sql
stable
security definer
set search_path = ''
as $function$
  select s.id, s.name, s.start_date, s.end_date
  from public.semesters s
  where s.registration_open
  order by s.start_date desc
  limit 1;
$function$;

revoke all on function public.get_open_semester() from public;
grant execute on function public.get_open_semester() to anon, authenticated;

update public.semesters set registration_open = false where registration_open;
update public.semesters set registration_open = true where id = 1;
