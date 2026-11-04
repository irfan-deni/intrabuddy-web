-- Persist the checklist phase and due date from the portal editor.
-- The original manage_portal_configuration function only wrote title,
-- description, required, display_order, and semester_id, which silently
-- dropped phase and due_date from the editor payload. The table already has
-- both columns; this migration is required for edits to take effect.
create or replace function public.manage_portal_configuration(p_action text, p_payload jsonb)
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
    if nullif(p_payload->>'phase','') is not null and p_payload->>'phase' not in ('before','during','after') then
      raise exception 'Invalid checklist phase' using errcode='22023';
    end if;
    if v_id is null then
      insert into public.checklist_templates(title,description,required,display_order,phase,due_date,semester_id)
        values(btrim(p_payload->>'title'),p_payload->>'description',(p_payload->>'required')::boolean,(p_payload->>'display_order')::integer,nullif(p_payload->>'phase',''),nullif(p_payload->>'due_date','')::date,v_semester);
    else
      update public.checklist_templates set title=btrim(p_payload->>'title'),description=p_payload->>'description',required=(p_payload->>'required')::boolean,
        display_order=(p_payload->>'display_order')::integer,phase=nullif(p_payload->>'phase',''),due_date=nullif(p_payload->>'due_date','')::date
        where id=v_id and semester_id=v_semester;
      if not found then raise exception 'Template not found' using errcode='P0002'; end if;
    end if;
  elsif p_action = 'template.delete' then
    delete from public.checklist_templates where id=v_id;
    if not found then raise exception 'Template not found' using errcode='P0002'; end if;
  elsif p_action = 'template.import' then
    select id into v_previous from public.semesters where start_date < (select start_date from public.semesters where id=v_semester) order by start_date desc limit 1;
    if v_previous is null then raise exception 'No previous semester' using errcode='22023'; end if;
    insert into public.checklist_templates(title,description,required,display_order,phase,due_date,semester_id)
      select title,description,required,coalesce((select max(display_order) from public.checklist_templates where semester_id=v_semester),0)+row_number() over(order by display_order,id),phase,due_date,v_semester
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
