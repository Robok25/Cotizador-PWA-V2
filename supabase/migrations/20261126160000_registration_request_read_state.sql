-- Track whether an administrator has opened each access-request notification.
alter table public.registration_requests
  add column if not exists read_at timestamptz;

create index if not exists registration_requests_unread_idx
  on public.registration_requests(created_at desc)
  where status = 'pending' and read_at is null;
