-- Server-only mutations: caller identity and super access are verified by Nitro.
-- No client role may invoke this function or write assignments/audit records.
create table public.coordinator_student_assignments (
  student_id uuid not null references public.users(id) on delete cascade,
  semester_id integer not null references public.semesters(id) on delete cascade,
  coordinator_id uuid not null references public.users(id),
  -- Historical actor IDs survive coordinator account removal.
  assigned_by uuid not null,
  assigned_at timestamptz not null default now(),
  primary key (student_id, semester_id)
);
create index coordinator_student_assignments_coordinator_idx
  on public.coordinator_student_assignments(coordinator_id, semester_id);

create table public.student_management_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  student_id uuid not null,
  semester_id integer not null,
  action text not null,
  target_id text not null,
  before_value jsonb,
  after_value jsonb,
  reason text not null check (length(btrim(reason)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index student_management_audit_student_idx on public.student_management_audit(student_id, semester_id, id desc);

create table public.logbook_reviews (
  logbook_id integer primary key references public.weekly_logbook_tracking(id) on delete cascade,
  status text not null check (status in ('reviewed', 'corrections_requested')),
  feedback text not null check (length(btrim(feedback)) between 1 and 2000),
  reviewer_id uuid not null,
  reviewed_at timestamptz not null default now()
);

-- Applications previously had no semester scope. Only backfill unambiguous
-- enrollments; legacy ambiguous records remain super-coordinator-only.
alter table public.job_applications add column semester_id integer references public.semesters(id);
update public.job_applications a set semester_id = e.semester_id
from (select student_id, min(semester_id) semester_id from public.student_semesters
      group by student_id having count(distinct semester_id) = 1) e
where a.student_id = e.student_id;
create index job_applications_semester_idx on public.job_applications(semester_id);

-- Older student clients omit semester_id. Scope new applications to their one
-- active enrollment without guessing the semester of historic/ambiguous rows.
create function public.scope_new_student_application() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.semester_id is null then
    select min(e.semester_id) into new.semester_id from public.student_semesters e
      join public.semesters s on s.id=e.semester_id
      where e.student_id=new.student_id and s.is_active=true
      having count(distinct e.semester_id)=1;
  elsif not exists(select 1 from public.student_semesters where student_id=new.student_id and semester_id=new.semester_id) then
    raise exception 'Application requires a matching enrollment' using errcode='23514';
  end if;
  return new;
end;
$$;
revoke all on function public.scope_new_student_application() from public, anon, authenticated;
create trigger scope_new_student_application before insert on public.job_applications
for each row execute function public.scope_new_student_application();

revoke all on public.users, public.job_applications, public.student_checklists, public.weekly_logbook_tracking from anon;
revoke truncate, references, trigger on public.users, public.job_applications, public.student_checklists, public.weekly_logbook_tracking from authenticated;
revoke insert, update, delete, truncate, references, trigger on public.semesters, public.checklist_templates, public.student_semesters from anon, authenticated;

alter table public.coordinator_student_assignments enable row level security;
alter table public.student_management_audit enable row level security;
alter table public.logbook_reviews enable row level security;
revoke all on public.coordinator_student_assignments, public.student_management_audit, public.logbook_reviews from public, anon, authenticated;
revoke all on public.student_management_audit from service_role;
grant select, insert, update, delete on public.coordinator_student_assignments, public.logbook_reviews to service_role;
grant select, insert on public.student_management_audit to service_role;
revoke all on sequence public.student_management_audit_id_seq from public, anon, authenticated, service_role;
grant usage, select on sequence public.student_management_audit_id_seq to service_role;
grant select on public.logbook_reviews to authenticated;
create policy logbook_review_student_read on public.logbook_reviews for select to authenticated
using (exists (select 1 from public.weekly_logbook_tracking l where l.id = logbook_id and l.student_id = (select auth.uid())));

-- Restrictive policies intersect existing permissive coordinator policies.
-- Students retain their own-record operations; coordinator writes go via Nitro.
create policy managed_applications_update on public.job_applications as restrictive for update to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy managed_applications_insert on public.job_applications as restrictive for insert to authenticated
with check (student_id = (select auth.uid()));
create policy managed_applications_delete on public.job_applications as restrictive for delete to authenticated
using (student_id = (select auth.uid()));
create policy managed_checklists_update on public.student_checklists as restrictive for update to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy managed_checklists_insert on public.student_checklists as restrictive for insert to authenticated
with check (student_id = (select auth.uid()));
create policy managed_checklists_delete on public.student_checklists as restrictive for delete to authenticated
using (student_id = (select auth.uid()));
create policy managed_logbooks_update on public.weekly_logbook_tracking as restrictive for update to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));
create policy managed_logbooks_insert on public.weekly_logbook_tracking as restrictive for insert to authenticated
with check (student_id = (select auth.uid()));
create policy managed_logbooks_delete on public.weekly_logbook_tracking as restrictive for delete to authenticated
using (student_id = (select auth.uid()));

-- Stop self-service role/identity escalation and audit-field forgery. Column
-- grants protect these fields even when an old permissive policy still exists.
revoke update on public.users from authenticated, anon;
grant update (full_name, phone_number, avatar_url, updated_at) on public.users to authenticated;
create policy managed_users_update on public.users as restrictive for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy managed_users_insert on public.users as restrictive for insert to authenticated
with check (id = (select auth.uid()) and role = 'student');
create policy managed_users_delete on public.users as restrictive for delete to authenticated using (false);
revoke update on public.job_applications, public.student_checklists from authenticated;
grant update (company_name, position, application_date, status, notes, updated_at) on public.job_applications to authenticated;
grant update (is_completed, completed_at, notes) on public.student_checklists to authenticated;
-- Insert column grants also prevent a student supplying forged override metadata.
revoke insert on public.job_applications, public.student_checklists from authenticated;
grant insert (student_id, company_name, position, application_date, status, notes, semester_id) on public.job_applications to authenticated;
grant insert (student_id, checklist_item_id, is_completed, completed_at, due_date, notes) on public.student_checklists to authenticated;

create function public.manage_assigned_student(
  p_actor_id uuid, p_super boolean, p_student_id uuid, p_semester_id integer,
  p_action text, p_payload jsonb, p_entry_id integer default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_reason text := btrim(p_payload->>'reason');
  v_target text := p_student_id::text;
  v_enrolled boolean;
  v_active boolean;
  v_record_semester integer;
begin
  if not exists (select 1 from public.users where id = p_actor_id and role = 'coordinator') then
    raise exception 'Coordinator access required' using errcode = '42501';
  end if;
  if v_reason is null or length(v_reason) not between 1 and 2000 then
    raise exception 'A reason of 1–2000 characters is required' using errcode = '22023';
  end if;
  -- A common student-row lock serializes reassignment and corrections. A revoked
  -- coordinator cannot slip a write between the assignment check and the update.
  perform 1 from public.users where id = p_student_id and role = 'student' for update;
  if not found then raise exception 'Student not found' using errcode = 'P0002'; end if;
  select is_active into v_active from public.semesters where id = p_semester_id;
  if not found then raise exception 'Semester not found' using errcode = 'P0002'; end if;
  select exists (select 1 from public.student_semesters where student_id = p_student_id and semester_id = p_semester_id) into v_enrolled;
  if not p_super and (not v_enrolled or not exists (
    select 1 from public.coordinator_student_assignments where student_id = p_student_id
    and semester_id = p_semester_id and coordinator_id = p_actor_id
  )) then raise exception 'Student is not assigned to you in this semester' using errcode = '42501'; end if;

  if p_action = 'assignment' then
    if not p_super then raise exception 'Super coordinator access required' using errcode = '42501'; end if;
    if not v_enrolled then raise exception 'Student is not enrolled in this semester' using errcode = '22023'; end if;
    select to_jsonb(a) into v_before from public.coordinator_student_assignments a where student_id = p_student_id and semester_id = p_semester_id;
    if p_payload->>'coordinator_id' is null then
      delete from public.coordinator_student_assignments where student_id = p_student_id and semester_id = p_semester_id;
      v_after := null;
    else
      perform 1 from public.users where id = (p_payload->>'coordinator_id')::uuid and role = 'coordinator' for share;
      if not found then raise exception 'Coordinator not found' using errcode = '22023'; end if;
      insert into public.coordinator_student_assignments(student_id, semester_id, coordinator_id, assigned_by)
      values (p_student_id, p_semester_id, (p_payload->>'coordinator_id')::uuid, p_actor_id)
      on conflict (student_id, semester_id) do update set coordinator_id = excluded.coordinator_id, assigned_by = excluded.assigned_by, assigned_at = now()
      returning to_jsonb(coordinator_student_assignments.*) into v_after;
    end if;
  elsif p_action = 'profile' then
    if not p_super and not coalesce(v_active, false) then
      raise exception 'Contact changes require an active-semester assignment' using errcode = '42501';
    end if;
    if exists (select 1 from jsonb_object_keys(p_payload) k where k not in ('reason','phone_number','full_name','student_id','email'))
       or (not p_super and exists (select 1 from jsonb_object_keys(p_payload) k where k not in ('reason','phone_number'))) then
      raise exception 'Restricted profile field' using errcode = '42501';
    end if;
    if p_payload ? 'full_name' and (length(btrim(p_payload->>'full_name')) not between 1 and 200 or p_payload->>'full_name' is null) then
      raise exception 'Valid full name required' using errcode = '22023';
    end if;
    select jsonb_build_object('full_name',full_name,'student_id',student_id,'email',email,'phone_number',phone_number) into v_before from public.users where id = p_student_id;
    update public.users set
      full_name = case when p_payload ? 'full_name' then btrim(p_payload->>'full_name') else full_name end,
      student_id = case when p_payload ? 'student_id' then nullif(btrim(p_payload->>'student_id'),'') else student_id end,
      email = case when p_payload ? 'email' then nullif(btrim(p_payload->>'email'),'') else email end,
      phone_number = case when p_payload ? 'phone_number' then nullif(btrim(p_payload->>'phone_number'),'') else phone_number end,
      updated_at = now() where id = p_student_id;
    select jsonb_build_object('full_name',full_name,'student_id',student_id,'email',email,'phone_number',phone_number) into v_after from public.users where id = p_student_id;
  elsif p_action = 'application' then
    select to_jsonb(a), a.semester_id into v_before, v_record_semester from public.job_applications a where id = p_entry_id and student_id = p_student_id for update;
    if not found then raise exception 'Application not found' using errcode = 'P0002'; end if;
    if (v_record_semester is null and not p_super) or (v_record_semester is not null and v_record_semester <> p_semester_id) then
      raise exception 'Application is outside this semester' using errcode = '42501';
    end if;
    if p_payload->>'status' is null or p_payload->>'status' not in ('Pending','Interview','Accepted','Rejected','Offer Declined') then
      raise exception 'Invalid application status' using errcode = '22023';
    end if;
    update public.job_applications set status = (p_payload->>'status')::public.application_status,
      override_reason = v_reason, updated_by_admin = p_actor_id, updated_at = now()
      where id = p_entry_id returning to_jsonb(job_applications.*) into v_after;
    v_target := p_entry_id::text;
  elsif p_action = 'checklist' then
    select to_jsonb(c), t.semester_id into v_before, v_record_semester from public.student_checklists c
      join public.checklist_templates t on t.id = c.checklist_item_id where c.id = p_entry_id and c.student_id = p_student_id for update of c;
    if not found then raise exception 'Checklist entry not found' using errcode = 'P0002'; end if;
    if v_record_semester is distinct from p_semester_id then raise exception 'Checklist is outside this semester' using errcode = '42501'; end if;
    if jsonb_typeof(p_payload->'is_completed') is distinct from 'boolean' then raise exception 'Completion state required' using errcode = '22023'; end if;
    update public.student_checklists set is_completed = (p_payload->>'is_completed')::boolean,
      completed_at = case when (p_payload->>'is_completed')::boolean then now() else null end,
      override_reason = v_reason, updated_by_admin = p_actor_id
      where id = p_entry_id returning to_jsonb(student_checklists.*) into v_after;
    v_target := p_entry_id::text;
  elsif p_action = 'review' then
    perform 1 from public.weekly_logbook_tracking where id = p_entry_id and student_id = p_student_id and semester_id = p_semester_id and is_submitted = true for update;
    if not found then raise exception 'Submitted logbook not found in this semester' using errcode = 'P0002'; end if;
    if p_payload->>'status' is null or p_payload->>'status' not in ('reviewed','corrections_requested') then raise exception 'Invalid review status' using errcode = '22023'; end if;
    select to_jsonb(r) into v_before from public.logbook_reviews r where logbook_id = p_entry_id;
    insert into public.logbook_reviews(logbook_id,status,feedback,reviewer_id)
      values (p_entry_id,p_payload->>'status',v_reason,p_actor_id)
      on conflict (logbook_id) do update set status = excluded.status, feedback = excluded.feedback, reviewer_id = excluded.reviewer_id, reviewed_at = now()
      returning to_jsonb(logbook_reviews.*) into v_after;
    v_target := p_entry_id::text;
  else
    raise exception 'Unknown management action' using errcode = '22023';
  end if;
  insert into public.student_management_audit(actor_id,student_id,semester_id,action,target_id,before_value,after_value,reason)
    values(p_actor_id,p_student_id,p_semester_id,p_action,v_target,v_before,v_after,v_reason);
  return jsonb_build_object('success',true);
end;
$$;
revoke all on function public.manage_assigned_student(uuid,boolean,uuid,integer,text,jsonb,integer) from public, anon, authenticated;
grant execute on function public.manage_assigned_student(uuid,boolean,uuid,integer,text,jsonb,integer) to service_role;

-- Audit rows are append-only, including for the service role.
create function public.reject_student_audit_change() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'Student audit history is append-only' using errcode = '42501'; end;
$$;
revoke all on function public.reject_student_audit_change() from public, anon, authenticated;
create trigger student_audit_immutable before update or delete on public.student_management_audit
for each row execute function public.reject_student_audit_change();

-- Global configuration writes also use a service-only transaction. This avoids
-- granting all coordinators direct database administration through old policies.
create function public.manage_portal_configuration(p_action text, p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_id integer := (p_payload->>'id')::integer;
  v_semester integer := (p_payload->>'semester_id')::integer;
  v_previous integer;
  v_count integer;
begin
  if p_action = 'semester.save' then
    if nullif(btrim(p_payload->>'name'),'') is null or length(p_payload->>'name') > 200
      or (p_payload->>'end_date')::date < (p_payload->>'start_date')::date then
      raise exception 'Invalid semester details' using errcode = '22023';
    end if;
    if v_id is null then
      insert into public.semesters(name,start_date,end_date) values(btrim(p_payload->>'name'),(p_payload->>'start_date')::date,(p_payload->>'end_date')::date);
    else
      update public.semesters set name=btrim(p_payload->>'name'),start_date=(p_payload->>'start_date')::date,end_date=(p_payload->>'end_date')::date where id=v_id;
      if not found then raise exception 'Semester not found' using errcode='P0002'; end if;
    end if;
  elsif p_action = 'semester.activate' then
    -- Serialize even simultaneous activations, without deactivating everything
    -- if the requested semester does not exist.
    lock table public.semesters in share row exclusive mode;
    if not exists(select 1 from public.semesters where id=v_id) then raise exception 'Semester not found' using errcode='P0002'; end if;
    update public.semesters set is_active=(id=v_id);
  elsif p_action = 'semester.delete' then
    delete from public.semesters where id=v_id;
    if not found then raise exception 'Semester not found' using errcode='P0002'; end if;
  elsif p_action = 'template.save' then
    if nullif(btrim(p_payload->>'title'),'') is null or length(p_payload->>'title') > 500 then raise exception 'Title required' using errcode='22023'; end if;
    if v_id is null then
      insert into public.checklist_templates(title,description,required,display_order,semester_id)
        values(btrim(p_payload->>'title'),p_payload->>'description',(p_payload->>'required')::boolean,(p_payload->>'display_order')::integer,v_semester);
    else
      update public.checklist_templates set title=btrim(p_payload->>'title'),description=p_payload->>'description',required=(p_payload->>'required')::boolean,
        display_order=(p_payload->>'display_order')::integer where id=v_id and semester_id=v_semester;
      if not found then raise exception 'Template not found' using errcode='P0002'; end if;
    end if;
  elsif p_action = 'template.delete' then
    delete from public.checklist_templates where id=v_id;
    if not found then raise exception 'Template not found' using errcode='P0002'; end if;
  elsif p_action = 'template.import' then
    select id into v_previous from public.semesters where start_date < (select start_date from public.semesters where id=v_semester) order by start_date desc limit 1;
    if v_previous is null then raise exception 'No previous semester' using errcode='22023'; end if;
    insert into public.checklist_templates(title,description,required,display_order,semester_id)
      select title,description,required,coalesce((select max(display_order) from public.checklist_templates where semester_id=v_semester),0)+row_number() over(order by display_order,id),v_semester
      from public.checklist_templates where semester_id=v_previous;
    get diagnostics v_count = row_count;
    return jsonb_build_object('success',true,'imported',v_count);
  elsif p_action = 'template.reorder' then
    if jsonb_typeof(p_payload->'ids') is distinct from 'array' then raise exception 'Template IDs required' using errcode='22023'; end if;
    lock table public.checklist_templates in share row exclusive mode;
    if (select count(*) from public.checklist_templates where semester_id=v_semester) <> jsonb_array_length(p_payload->'ids')
      or (select count(distinct value::integer) from jsonb_array_elements_text(p_payload->'ids')) <> jsonb_array_length(p_payload->'ids')
      or exists(select 1 from jsonb_array_elements_text(p_payload->'ids') x where not exists(select 1 from public.checklist_templates t where t.id=x.value::integer and t.semester_id=v_semester)) then
      raise exception 'Template ordering is stale or invalid' using errcode='22023';
    end if;
    update public.checklist_templates t set display_order=x.ordinality
      from jsonb_array_elements_text(p_payload->'ids') with ordinality x where t.id=x.value::integer;
  else
    raise exception 'Unknown configuration action' using errcode='22023';
  end if;
  return jsonb_build_object('success',true);
end;
$$;
revoke all on function public.manage_portal_configuration(text,jsonb) from public, anon, authenticated;
grant execute on function public.manage_portal_configuration(text,jsonb) to service_role;
