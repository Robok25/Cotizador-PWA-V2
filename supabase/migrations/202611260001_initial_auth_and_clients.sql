-- ConveyorQuote: perfiles, roles y directorio de clientes.
-- Ejecutar en Supabase > SQL Editor sobre un proyecto nuevo.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'vendedor'
    check (role in ('administrador', 'vendedor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  tax_id text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_created_by_idx on public.clients(created_by);
create index if not exists clients_company_name_idx on public.clients(company_name);

-- Crear automáticamente el perfil de cada usuario nuevo con rol vendedor.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'vendedor'
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Función segura para consultar el rol sin provocar recursión en RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'administrador'
  );
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;

drop policy if exists "Users can read their own profile or admins can read all" on public.profiles;
create policy "Users can read their own profile or admins can read all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- No se habilita autoedición de roles desde el cliente.
drop policy if exists "Users can read permitted clients" on public.clients;
create policy "Users can read permitted clients"
  on public.clients for select
  to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Authenticated users can create their own clients" on public.clients;
create policy "Authenticated users can create their own clients"
  on public.clients for insert
  to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "Users can update permitted clients" on public.clients;
create policy "Users can update permitted clients"
  on public.clients for update
  to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Only admins can delete clients" on public.clients;
create policy "Only admins can delete clients"
  on public.clients for delete
  to authenticated
  using ((select public.is_admin()));

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
