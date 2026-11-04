
alter table public.notifications
  add column if not exists archived_at timestamptz;

create index if not exists notifications_recipient_active_idx
  on public.notifications (recipient_id)
  where archived_at is null;

drop policy if exists notifications_delete_own on public.notifications;

drop policy if exists notifications_select_coordinator_broadcasts on public.notifications;
create policy notifications_select_coordinator_broadcasts
  on public.notifications
  for select
  to authenticated
  using (
    broadcast_id is not null
    and exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('coordinator', 'super_coordinator')
    )
  );
