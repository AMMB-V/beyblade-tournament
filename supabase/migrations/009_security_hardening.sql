-- 009: endurecimiento de seguridad detectado por el asesor de Supabase

-- Tablas sin RLS: cualquiera con la clave pública podía leer y escribir
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "organizations: solo admin" on public.organizations
  for all to authenticated
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "organization_members: solo admin" on public.organization_members
  for all to authenticated
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- Funciones de trigger: no deben poder llamarse por la API
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;

-- search_path fijo en las funciones antiguas
alter function public.update_updated_at() set search_path = public;
alter function public.is_tournament_referee(uuid) set search_path = public;
alter function public.seed_default_finish_points(uuid) set search_path = public;
alter function public.auth_role() set search_path = public;
alter function public.is_tournament_organizer(uuid) set search_path = public;
