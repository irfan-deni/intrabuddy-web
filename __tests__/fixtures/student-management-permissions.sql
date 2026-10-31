-- Test-only data. The container and this transaction are discarded afterward.
begin;
insert into public.users(id,role,full_name) values
('00000000-0000-0000-0000-000000000001','coordinator','Super'),
('00000000-0000-0000-0000-000000000002','coordinator','Regular'),
('00000000-0000-0000-0000-000000000003','coordinator','Other'),
('00000000-0000-0000-0000-000000000004','student','Student'),
('00000000-0000-0000-0000-000000000005','student','Other student');
insert into public.semesters(id,name,start_date,end_date,is_active) values(1,'Current','2026-07-01','2026-12-31',true),(2,'Previous','2026-01-01','2026-06-30',false);
insert into public.student_semesters(student_id,semester_id) values('00000000-0000-0000-0000-000000000004',1),('00000000-0000-0000-0000-000000000004',2),('00000000-0000-0000-0000-000000000005',1);
-- Historical assignments remain stored but must never grant mutation access.
insert into public.coordinator_student_assignments(student_id,semester_id,coordinator_id,assigned_by)
values('00000000-0000-0000-0000-000000000004',1,'00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
insert into public.checklist_templates(id,title,semester_id,display_order) values(1,'Current requirement',1,1),(2,'Previous requirement',2,1);
insert into public.student_checklists(id,student_id,checklist_item_id,is_completed) values(1,'00000000-0000-0000-0000-000000000004',1,false),(2,'00000000-0000-0000-0000-000000000004',2,false),(3,'00000000-0000-0000-0000-000000000005',1,false);
insert into public.job_applications(id,student_id,company_name,status,semester_id) values(1,'00000000-0000-0000-0000-000000000004','Original company','Pending',1),(2,'00000000-0000-0000-0000-000000000004','Legacy company','Pending',null);
-- Simulate an ambiguous historic application left unscoped by the backfill.
update public.job_applications set semester_id=null where id=2;
select setval(pg_get_serial_sequence('public.job_applications','id'),2);
insert into public.weekly_logbook_tracking(id,student_id,semester_id,week_number,is_submitted) values(1,'00000000-0000-0000-0000-000000000004',1,1,true),(2,'00000000-0000-0000-0000-000000000004',1,2,false);

-- Test helpers run with the caller's privileges and only exist in this test DB.
create function public.test_denied(statement text, expected text default '42501') returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate = expected then return; end if;
    raise exception 'Wrong error: %, expected % for %', sqlstate, expected, statement;
  end;
  raise exception 'Expected denial: %',statement;
end $$;

set local role service_role;
select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'profile','{"phone_number":"123","reason":"Student confirmed phone"}');
select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'checklist','{"is_completed":true,"reason":"Document verified"}',1);
select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'application','{"status":"Accepted","reason":"Offer verified"}',1);
select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'review','{"status":"corrections_requested","reason":"Add supervisor feedback"}',1);
do $$ begin
  assert (select count(*)=4 from public.student_management_audit), 'Every allowed mutation must be audited';
  assert (select phone_number='123' from public.users where id='00000000-0000-0000-0000-000000000004');
  assert (select is_submitted from public.weekly_logbook_tracking where id=1), 'Reviews cannot change submission';
  assert (select status='corrections_requested' from public.logbook_reviews where logbook_id=1);
  assert (select company_name='Original company' from public.job_applications where id=1), 'Preserve student-submitted application fields';
end $$;
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000002',false,'00000000-0000-0000-0000-000000000004',1,'profile','{"phone_number":"stolen","reason":"Regular coordinator"}')$s$);
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000002',false,'00000000-0000-0000-0000-000000000004',1,'review','{"status":"reviewed","reason":"Regular coordinator"}',1)$s$);
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'checklist','{"is_completed":true,"reason":"Wrong semester record"}',2)$s$);
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'checklist','{"is_completed":true,"reason":"Forged child ID"}',3)$s$,'P0002');
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'review','{"status":"reviewed","reason":"Not submitted"}',2)$s$,'P0002');
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'profile','{"phone_number":"stolen","reason":" "}')$s$,'22023');
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'assignment','{"coordinator_id":null,"reason":"Cannot assign"}')$s$,'22023');
do $$ begin assert (select count(*)=4 from public.student_management_audit), 'Denied mutations cannot create audit entries'; end $$;

-- Failure of the audit INSERT must roll back the student UPDATE as well.
reset role;
create function public.test_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'Simulated audit failure'; end $$;
create trigger test_audit_failure before insert on public.student_management_audit for each row execute function public.test_audit_failure();
set local role service_role;
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000004',1,'profile','{"phone_number":"rollback","reason":"Audit failure"}')$s$,'P0001');
do $$ begin assert (select phone_number='123' from public.users where id='00000000-0000-0000-0000-000000000004'), 'Audit failure must roll back the data update'; end $$;
reset role;
drop trigger test_audit_failure on public.student_management_audit;

-- Super Coordinators can correct any student without assignments.
set local role service_role;
select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000005',1,'profile','{"phone_number":"super","reason":"Super access to student"}');
select public.test_denied('update public.student_management_audit set reason=''tampered''');
select public.test_denied('truncate public.student_management_audit');

-- An authenticated caller cannot forge super flags or bypass the server.
set local role authenticated;
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.test_denied($s$select public.manage_student_record('00000000-0000-0000-0000-000000000001',true,'00000000-0000-0000-0000-000000000005',1,'profile','{"phone_number":"stolen","reason":"Forge super"}')$s$);
select public.test_denied('select * from public.coordinator_student_assignments');
select public.test_denied('delete from public.coordinator_student_assignments');
select public.test_denied('select * from public.student_management_audit');
select public.test_denied('update public.users set role=''coordinator''');
select public.test_denied('update public.semesters set is_active=true');
select public.test_denied('delete from public.checklist_templates');
do $$ declare n integer; begin
  update public.job_applications set status='Rejected' where id=1;
  get diagnostics n = row_count; assert n=0, 'Coordinator direct application writes must be denied';
  update public.student_checklists set is_completed=false where id=1;
  get diagnostics n = row_count; assert n=0, 'Coordinator direct checklist writes must be denied';
  update public.weekly_logbook_tracking set is_submitted=false where id=1;
  get diagnostics n = row_count; assert n=0, 'Coordinator direct logbook writes must be denied';
end $$;

-- Student self-service is retained, without permission to forge overrides.
set local request.jwt.claim.sub='00000000-0000-0000-0000-000000000004';
update public.job_applications set notes='Student note' where id=1;
insert into public.job_applications(student_id,company_name,status) values('00000000-0000-0000-0000-000000000004','New student application','Pending');
do $$ begin assert (select semester_id=1 from public.job_applications where company_name='New student application'), 'New applications from older clients receive active semester scope'; end $$;
select public.test_denied('update public.job_applications set override_reason=''forged'' where id=1');
select public.test_denied('update public.student_checklists set updated_by_admin=''00000000-0000-0000-0000-000000000001'' where id=1');
do $$ begin
  assert (select notes='Student note' from public.job_applications where id=1);
  assert (select is_completed from public.student_checklists where id=1), 'Denied coordinator change left the record intact';
  assert (select count(*)=1 from public.logbook_reviews), 'Student can read review feedback';
end $$;
set local role anon;
select public.test_denied('select * from public.coordinator_student_assignments');
select public.test_denied('select * from public.student_management_audit');
select public.test_denied('update public.users set role=''coordinator''');
reset role;
-- Configuration RPCs are inaccessible to clients but remain usable by a
-- server-authorized Super Coordinator. Activation and reorder are atomic.
set local role authenticated;
select public.test_denied($s$select public.manage_portal_configuration('semester.activate','{"id":2}')$s$);
set local role service_role;
select public.manage_portal_configuration('semester.activate','{"id":2}');
do $$ begin
  assert (select is_active from public.semesters where id=2);
  assert (select not is_active from public.semesters where id=1);
end $$;
select public.test_denied($s$select public.manage_portal_configuration('semester.activate','{"id":999}')$s$,'P0002');
do $$ begin assert (select is_active from public.semesters where id=2), 'Failed activation preserves the active semester'; end $$;
select public.manage_portal_configuration('template.reorder','{"semester_id":1,"ids":[1]}');
select public.test_denied($s$select public.manage_portal_configuration('template.reorder','{"semester_id":1,"ids":[2]}')$s$,'22023');
reset role;
rollback;
