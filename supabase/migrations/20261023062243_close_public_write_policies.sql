-- Elimina las politicas de escritura abiertas a cualquier usuario (incluso sin sesion)
drop policy if exists "matches: gestion publica" on public.matches;
drop policy if exists "participants: gestion publica" on public.participants;
drop policy if exists "tournaments: cualquier usuario puede crear" on public.tournaments;
drop policy if exists "tournaments: gestion publica" on public.tournaments;
drop policy if exists "stages: creación de etapas para el torneo" on public.stages;

-- Torneos: solo admin u organizador crean; created_by debe ser quien crea
create policy "tournaments: admin/organizer crea" on public.tournaments
  for insert to authenticated
  with check (auth_role() in ('admin','organizer') and created_by = auth.uid());

create policy "tournaments: organizador o admin edita" on public.tournaments
  for update to authenticated
  using (is_tournament_organizer(id) or auth_role() = 'admin')
  with check (is_tournament_organizer(id) or auth_role() = 'admin');

-- Participantes
create policy "participants: organizer/admin escribe" on public.participants
  for all to authenticated
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin')
  with check (is_tournament_organizer(tournament_id) or auth_role() = 'admin');

-- Etapas
create policy "stages: organizer/admin escribe" on public.stages
  for all to authenticated
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin')
  with check (is_tournament_organizer(tournament_id) or auth_role() = 'admin');

-- Matches (el arbitro registra por battles; la edicion directa es de organizer/admin)
create policy "matches: organizer/admin escribe" on public.matches
  for all to authenticated
  using (exists (select 1 from public.stages s where s.id = matches.stage_id
                 and (is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')))
  with check (exists (select 1 from public.stages s where s.id = matches.stage_id
                 and (is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')));
