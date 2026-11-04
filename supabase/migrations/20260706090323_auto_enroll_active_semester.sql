create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
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

  insert into public.student_semesters (student_id, semester_id)
  select new.id, s.id
  from public.semesters s
  where s.is_active = true
  limit 1;

  return new;
end;
$$;
