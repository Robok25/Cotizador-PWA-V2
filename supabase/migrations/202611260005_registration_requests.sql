-- Solicitudes públicas de acceso. Solo el servidor puede insertar;
-- únicamente administradores autenticados pueden consultar o gestionar.
create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  email text not null,
  company text,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create index if not exists registration_requests_status_created_idx
  on public.registration_requests(status, created_at desc);
alter table public.registration_requests enable row level security;
drop policy if exists "Admins can read registration requests" on public.registration_requests;
create policy "Admins can read registration requests"
  on public.registration_requests for select to authenticated
  using ((select public.is_admin()));
drop policy if exists "Admins can update registration requests" on public.registration_requests;
create policy "Admins can update registration requests"
  on public.registration_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
grant select, update on public.registration_requests to authenticated;
