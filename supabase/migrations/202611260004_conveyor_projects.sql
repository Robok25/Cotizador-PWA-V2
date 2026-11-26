-- ConveyorQuote: proyectos y borradores de cotización.
-- No contiene cálculos ni parámetros mecánicos asumidos.

create table if not exists public.conveyor_projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null check (length(trim(project_name)) > 0),
  project_code text,
  description text,
  equipment_family text not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'quoted', 'archived')),
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conveyor_projects_owner_updated_idx
  on public.conveyor_projects(created_by, updated_at desc);
create index if not exists conveyor_projects_family_idx
  on public.conveyor_projects(equipment_family);

create or replace function public.set_conveyor_project_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conveyor_projects_updated_at on public.conveyor_projects;
create trigger conveyor_projects_updated_at
  before update on public.conveyor_projects
  for each row execute function public.set_conveyor_project_updated_at();

alter table public.conveyor_projects enable row level security;

drop policy if exists "Users can read own projects and admins can read all" on public.conveyor_projects;
create policy "Users can read own projects and admins can read all"
  on public.conveyor_projects for select to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can create own projects" on public.conveyor_projects;
create policy "Users can create own projects"
  on public.conveyor_projects for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "Users can update own projects and admins can update all" on public.conveyor_projects;
create policy "Users can update own projects and admins can update all"
  on public.conveyor_projects for update to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()))
  with check (created_by = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "Users can delete own projects and admins can delete all" on public.conveyor_projects;
create policy "Users can delete own projects and admins can delete all"
  on public.conveyor_projects for delete to authenticated
  using (created_by = (select auth.uid()) or (select public.is_admin()));

grant select, insert, update, delete on public.conveyor_projects to authenticated;
