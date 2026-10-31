-- Keep historical assignment rows and audit entries, but remove assignment
-- as a permission source. Only the server's Super Coordinator endpoints may
-- invoke this service-role-only mutation function.
create function public.manage_student_record(
  p_actor_id uuid, p_super boolean, p_student_id uuid, p_semester_id integer,
  p_action text, p_payload jsonb, p_entry_id integer default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_reason text := btrim(p_payload->>'reason');
  v_target text := p_student_id::text;
  v_record_semester integer;
begin
  if not p_super or not exists (select 1 from public.users where id = p_actor_id and role = 'coordinator') then
    raise exception 'Super coordinator access required' using errcode = '42501';
  end if;
  if v_reason is null or length(v_reason) not between 1 and 2000 then
    raise exception 'A reason of 1–2000 characters is required' using errcode = '22023';
  end if;
  perform 1 from public.users where id = p_student_id and role = 'student' for update;
  if not found then raise exception 'Student not found' using errcode = 'P0002'; end if;
  perform 1 from public.semesters where id = p_semester_id;
  if not found then raise exception 'Semester not found' using errcode = 'P0002'; end if;

  if p_action = 'profile' then
    if exists (select 1 from jsonb_object_keys(p_payload) k where k not in ('reason','phone_number','full_name','student_id','email')) then
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
    if v_record_semester is not null and v_record_semester <> p_semester_id then
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
revoke all on function public.manage_student_record(uuid,boolean,uuid,integer,text,jsonb,integer) from public, anon, authenticated;
grant execute on function public.manage_student_record(uuid,boolean,uuid,integer,text,jsonb,integer) to service_role;

-- Do not delete assignment records: only retire the old callable operation.
drop function public.manage_assigned_student(uuid,boolean,uuid,integer,text,jsonb,integer);
revoke all on public.coordinator_student_assignments from service_role;
