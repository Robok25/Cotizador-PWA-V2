-- Datos personales editables por el propio usuario.
alter table public.profiles add column if not exists phone text;

-- El cliente solo puede actualizar sus campos personales; nunca su rol.
drop policy if exists "Users can update their own personal profile" on public.profiles;
create policy "Users can update their own personal profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Se elimina el permiso amplio anterior y se concede solo edición de datos personales.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
