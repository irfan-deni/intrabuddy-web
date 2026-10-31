-- Mobile Push Foundation
-- Apply this script in Supabase SQL editor before using:
--   POST /api/notifications/devices
--   POST /api/notifications/broadcast-dispatch

create table if not exists public.mobile_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_token text not null,
  platform text not null check (platform in ('android', 'ios', 'web')),
  app_version text null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_token)
);

create table if not exists public.mobile_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid null references public.broadcast_notifications(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null default 'mobile_push' check (channel in ('mobile_push')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  payload jsonb not null,
  queued_at timestamptz not null default now(),
  delivered_at timestamptz null,
  failure_reason text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_mobile_device_tokens_user_active
  on public.mobile_device_tokens(user_id, is_active);

create index if not exists idx_mobile_notification_outbox_status_queued
  on public.mobile_notification_outbox(status, queued_at);

alter table public.mobile_device_tokens enable row level security;
alter table public.mobile_notification_outbox enable row level security;

-- Students can manage only their own device tokens.
create policy if not exists "students_manage_own_device_tokens"
  on public.mobile_device_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Coordinators can read outbox rows for operational monitoring.
create policy if not exists "coordinator_read_outbox"
  on public.mobile_notification_outbox
  for select
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'coordinator'
        and u.is_active = true
    )
  );

-- Coordinators can insert queued mobile notifications.
create policy if not exists "coordinator_insert_outbox"
  on public.mobile_notification_outbox
  for insert
  with check (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'coordinator'
        and u.is_active = true
    )
  );