-- Core INTRA Buddy schema + security bootstrap
-- Apply this script in Supabase SQL Editor before running the app.
-- This script is idempotent and safe to re-run.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('student', 'coordinator')),
  full_name text not null,
  student_id text null,
  internship_status text not null default 'preparing' check (internship_status in ('preparing', 'searching', 'placed', 'completed')),
  is_active boolean not null default true,
  deleted_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.pre_internship_checklists (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.users(id) on delete cascade,
  resume_uploaded boolean not null default false,
  university_forms_completed boolean not null default false,
  is_ready_to_apply boolean not null default false
);

create table if not exists public.internship_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  status text not null default 'pending' check (status in ('pending', 'interviewing', 'rejected', 'offer_accepted')),
  offer_letter_url text null
);

create table if not exists public.logbook_compliance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  submission_status text not null default 'pending' check (submission_status in ('pending', 'submitted', 'overdue')),
  self_reported_at timestamptz null,
  unique (student_id, week_number)
);

create table if not exists public.broadcast_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_audience text not null check (target_audience in ('all_students', 'unplaced_students')),
  created_by uuid null references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  last_updated_by uuid null references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  embedding vector(1536) null
);

create index if not exists idx_users_role_active on public.users(role, is_active);
create index if not exists idx_users_status_active on public.users(internship_status, is_active);
create index if not exists idx_internship_applications_student on public.internship_applications(student_id);
create index if not exists idx_logbook_student_week on public.logbook_compliance(student_id, week_number);
create index if not exists idx_broadcasts_created_at on public.broadcast_notifications(created_at desc);
create index if not exists idx_faqs_updated_at on public.faqs(updated_at desc);

-- Auto-create a student profile row for new Supabase Auth users.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text;
  resolved_status text;
begin
  resolved_role := case
    when lower(coalesce(new.email, '')) = 'coordinator@intrabuddy.my' then 'coordinator'
    else 'student'
  end;

  resolved_status := case
    when resolved_role = 'coordinator' then 'searching'
    else 'preparing'
  end;

  insert into public.users (
    id,
    role,
    full_name,
    internship_status,
    is_active,
    created_at
  )
  values (
    new.id,
    resolved_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Student'),
    resolved_status,
    true,
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.pre_internship_checklists enable row level security;
alter table public.internship_applications enable row level security;
alter table public.logbook_compliance enable row level security;
alter table public.broadcast_notifications enable row level security;
alter table public.faqs enable row level security;

-- USERS
create policy if not exists users_select_own_profile
  on public.users
  for select
  using (auth.uid() = id);

create policy if not exists users_coordinator_read_students
  on public.users
  for select
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

create policy if not exists users_coordinator_insert_students
  on public.users
  for insert
  with check (
    role = 'student'
    and is_active = true
    and exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

create policy if not exists users_coordinator_update_students
  on public.users
  for update
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  )
  with check (
    role = 'student'
    and exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

-- PRE-INTERNSHIP CHECKLISTS
create policy if not exists checklist_students_manage_own
  on public.pre_internship_checklists
  for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy if not exists checklist_coordinator_read_all
  on public.pre_internship_checklists
  for select
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

-- INTERNSHIP APPLICATIONS
create policy if not exists applications_students_manage_own
  on public.internship_applications
  for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy if not exists applications_coordinator_read_all
  on public.internship_applications
  for select
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

-- LOGBOOK COMPLIANCE
create policy if not exists logbook_students_manage_own
  on public.logbook_compliance
  for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy if not exists logbook_coordinator_read_all
  on public.logbook_compliance
  for select
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

-- BROADCAST NOTIFICATIONS
create policy if not exists broadcasts_coordinator_manage
  on public.broadcast_notifications
  for all
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

create policy if not exists broadcasts_students_read_targeted
  on public.broadcast_notifications
  for select
  using (
    exists (
      select 1
      from public.users student
      where student.id = auth.uid()
        and student.role = 'student'
        and student.is_active = true
        and (
          target_audience = 'all_students'
          or (
            target_audience = 'unplaced_students'
            and student.internship_status in ('preparing', 'searching')
          )
        )
    )
  );

-- FAQS
create policy if not exists faqs_coordinator_manage
  on public.faqs
  for all
  using (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  )
  with check (
    exists (
      select 1
      from public.users actor
      where actor.id = auth.uid()
        and actor.role = 'coordinator'
        and actor.is_active = true
    )
  );

-- Seed a local-development coordinator profile row if auth user already exists.
insert into public.users (id, role, full_name, internship_status, is_active, created_at)
select au.id, 'coordinator', 'Demo Coordinator', 'searching', true, now()
from auth.users au
where lower(au.email) = 'coordinator@intrabuddy.my'
on conflict (id) do update
set role = excluded.role,
    full_name = excluded.full_name,
    is_active = true,
    deleted_at = null;
