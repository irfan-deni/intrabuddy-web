create function private.guard_semester_registration_setting()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_today date := (statement_timestamp() at time zone 'Asia/Kuala_Lumpur')::date;
  v_eligible boolean := coalesce(new.end_date >= v_today, false);
begin
  if new.registration_open is not true then return new; end if;

  -- Keep historical semester creation and date corrections possible. Correcting
  -- dates must not revive a stale open flag; a coordinator can reopen explicitly.
  if tg_op = 'INSERT' then
    new.registration_open := v_eligible;
  elsif new.end_date is distinct from old.end_date and old.registration_open is true then
    new.registration_open := v_eligible and coalesce(old.end_date >= v_today, false);
  elsif not v_eligible then
    raise exception using errcode = 'P0409', message = case
      when new.end_date is null then 'Set an end date before opening registration'
      else 'Registration cannot be opened for an ended semester'
    end;
  end if;

  return new;
end;
$$;

create trigger guard_semester_registration_setting
before insert or update of registration_open, end_date on public.semesters
for each row execute function private.guard_semester_registration_setting();

update public.semesters
set registration_open = false
where registration_open
  and (end_date is null or end_date < (statement_timestamp() at time zone 'Asia/Kuala_Lumpur')::date);

create function private.guard_semester_enrollment()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_open boolean;
  v_end_date date;
begin
  if new.semester_id is null then return new; end if;
  if tg_op = 'UPDATE' then
    if new.semester_id is not distinct from old.semester_id
      and new.student_id is not distinct from old.student_id then return new; end if;
  end if;

  -- Serialize enrollment against closing registration or changing the deadline.
  select s.registration_open, s.end_date into v_open, v_end_date
  from public.semesters s where s.id = new.semester_id for share;

  if v_open is not true or v_end_date is null
    or v_end_date < (statement_timestamp() at time zone 'Asia/Kuala_Lumpur')::date then
    raise exception 'Registration is closed for this semester' using errcode = 'P0409';
  end if;
  return new;
end;
$$;

create trigger guard_semester_enrollment
before insert or update of semester_id, student_id on public.student_semesters
for each row execute function private.guard_semester_enrollment();

-- Preserve Auth profile creation. Only auto-enroll students, and only when the
-- newest open semester has not ended. An account can exist unenrolled.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
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
      and s.end_date >= (statement_timestamp() at time zone 'Asia/Kuala_Lumpur')::date
    order by s.start_date desc, s.id desc
    limit 1
    for share
    on conflict (student_id, semester_id) do nothing;
  end if;

  return new;
end;
$$;
