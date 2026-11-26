-- ConveyorQuote: catálogo inicial de materiales y precios.
-- Los usuarios autenticados pueden consultar el catálogo activo.
-- Solo administradores pueden crear, modificar o eliminar registros.

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  sku text,
  unit text not null default 'pieza',
  supplier text,
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  currency text not null default 'MXN' check (currency in ('MXN', 'USD')),
  active boolean not null default true,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_category_idx on public.materials(category);
create index if not exists materials_active_name_idx on public.materials(active, name);
create unique index if not exists materials_sku_unique_idx
  on public.materials(lower(sku)) where sku is not null and length(trim(sku)) > 0;

alter table public.materials enable row level security;

drop policy if exists "Authenticated users can read active materials" on public.materials;
create policy "Authenticated users can read active materials"
  on public.materials for select
  to authenticated
  using (active or (select public.is_admin()));

drop policy if exists "Only admins can insert materials" on public.materials;
create policy "Only admins can insert materials"
  on public.materials for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Only admins can update materials" on public.materials;
create policy "Only admins can update materials"
  on public.materials for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Only admins can delete materials" on public.materials;
create policy "Only admins can delete materials"
  on public.materials for delete
  to authenticated
  using ((select public.is_admin()));

grant select, insert, update, delete on public.materials to authenticated;
