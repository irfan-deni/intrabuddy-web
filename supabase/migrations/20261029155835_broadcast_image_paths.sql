alter table public.broadcast_messages
  add column image_paths text[] not null default '{}';
