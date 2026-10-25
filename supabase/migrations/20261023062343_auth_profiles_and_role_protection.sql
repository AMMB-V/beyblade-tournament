-- Perfil automatico al crear/invitar un usuario en Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Evita que un usuario se auto-asigne rol o ELO al editar su propio perfil.
-- Solo un admin puede cambiarlos; las sesiones sin usuario (SQL editor / service role) quedan permitidas.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.elo_rating is distinct from old.elo_rating)
     and auth.uid() is not null
     and coalesce(public.auth_role(), 'blader') <> 'admin' then
    raise exception 'solo un admin puede cambiar el rol o el ELO';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();
