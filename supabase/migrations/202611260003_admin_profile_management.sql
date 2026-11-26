-- Permitir que los administradores gestionen roles desde ConveyorQuote.
-- Los usuarios normales conservan solo lectura de su propio perfil.

drop policy if exists "Only admins can update user profiles" on public.profiles;
create policy "Only admins can update user profiles"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant update on public.profiles to authenticated;
