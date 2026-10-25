-- 008: ciclo completo del torneo en transacciones (batallas, faltas, avance del ganador, bracket)

-- ---------- Columnas nuevas ----------
alter table public.tournaments
  add column if not exists foul_points int not null default 1 check (foul_points >= 0),
  add column if not exists fouls_per_point int not null default 3 check (fouls_per_point > 0);

alter table public.matches
  add column if not exists p1_sets int not null default 0,
  add column if not exists p2_sets int not null default 0,
  add column if not exists version int not null default 1;

alter table public.battles
  add column if not exists set_number smallint not null default 1;

alter table public.penalties
  add column if not exists is_foul boolean not null default true,
  add column if not exists points_awarded int not null default 0,
  add column if not exists awarded_to uuid references public.participants(id);

create unique index if not exists participants_tournament_seed_uidx
  on public.participants (tournament_id, seed) where seed is not null;

-- ---------- Auxiliares (no expuestas a la API) ----------
create or replace function public._apply_points(m public.matches, s public.stages, p1_scores boolean, pts int)
returns public.matches language plpgsql stable set search_path = public as $$
declare
  r public.matches := m;
  need int;
begin
  r.status := 'in_progress';
  if pts <= 0 then return r; end if;

  if p1_scores then r.p1_match_points := r.p1_match_points + pts;
  else r.p2_match_points := r.p2_match_points + pts; end if;

  if greatest(r.p1_match_points, r.p2_match_points) >= s.points_to_win then
    if p1_scores then r.p1_sets := r.p1_sets + 1; else r.p2_sets := r.p2_sets + 1; end if;
    need := s.best_of / 2 + 1;
    if r.p1_sets >= need or r.p2_sets >= need then
      r.status := 'completed';
      r.winner_id := case when r.p1_sets >= need then r.participant1_id else r.participant2_id end;
      r.completed_at := now();
    else
      r.p1_match_points := 0;
      r.p2_match_points := 0;
    end if;
  end if;
  return r;
end $$;

create or replace function public._propagate_result(m public.matches)
returns void language plpgsql security definer set search_path = public as $$
declare
  loser uuid;
  tid uuid;
begin
  loser := case when m.winner_id = m.participant1_id then m.participant2_id else m.participant1_id end;

  if m.next_match_id is not null then
    update public.matches set
      participant1_id = case when m.next_match_slot = 1 then m.winner_id else participant1_id end,
      participant2_id = case when m.next_match_slot = 2 then m.winner_id else participant2_id end
    where id = m.next_match_id;
  end if;

  if m.loser_next_match_id is not null then
    update public.matches set
      participant1_id = case when m.loser_next_slot = 1 then loser else participant1_id end,
      participant2_id = case when m.loser_next_slot = 2 then loser else participant2_id end
    where id = m.loser_next_match_id;
  end if;

  -- Cierra la etapa y el torneo cuando ya no quedan matches pendientes
  if not exists (
    select 1 from public.matches x
    where x.stage_id = m.stage_id and x.status not in ('completed', 'bye')
  ) then
    update public.stages set status = 'completed', completed_at = now() where id = m.stage_id;
    select tournament_id into tid from public.stages where id = m.stage_id;
    if not exists (select 1 from public.stages z where z.tournament_id = tid and z.status <> 'completed') then
      update public.tournaments set status = 'completed' where id = tid;
    end if;
  end if;
end $$;

-- ---------- Registrar una batalla ----------
create or replace function public.record_battle(p_match uuid, p_scorer uuid, p_finish public.finish_type, p_expected_version int)
returns public.matches language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  s public.stages;
  tid uuid;
  pts int;
  n int;
begin
  select * into m from public.matches where id = p_match for update;
  if not found then raise exception 'match_not_found'; end if;
  select * into s from public.stages where id = m.stage_id;
  tid := s.tournament_id;

  if auth.uid() is null or not (
    m.referee_id = auth.uid()
    or public.is_tournament_referee(tid)
    or public.is_tournament_organizer(tid)
    or public.auth_role() = 'admin'
  ) then raise exception 'forbidden'; end if;

  if m.status not in ('pending', 'in_progress') then raise exception 'match_closed'; end if;
  if m.version <> p_expected_version then raise exception 'version_conflict'; end if;
  if m.participant1_id is null or m.participant2_id is null then raise exception 'match_not_ready'; end if;
  if p_scorer is distinct from m.participant1_id and p_scorer is distinct from m.participant2_id then
    raise exception 'invalid_scorer';
  end if;

  select points into pts from public.finish_point_rules where tournament_id = tid and finish_type = p_finish;
  if pts is null then
    pts := case p_finish when 'spin' then 1 when 'over' then 2 when 'burst' then 2 else 3 end;
  end if;

  select coalesce(max(battle_number), 0) + 1 into n from public.battles where match_id = p_match;
  insert into public.battles (match_id, battle_number, set_number, scorer_id, finish, points_scored, recorded_by)
  values (p_match, n, m.p1_sets + m.p2_sets + 1, p_scorer, p_finish, pts, auth.uid());

  m := public._apply_points(m, s, p_scorer = m.participant1_id, pts);

  update public.matches set
    p1_match_points = m.p1_match_points, p2_match_points = m.p2_match_points,
    p1_sets = m.p1_sets, p2_sets = m.p2_sets,
    status = m.status, winner_id = m.winner_id, completed_at = m.completed_at,
    started_at = coalesce(started_at, now()), version = version + 1
  where id = p_match returning * into m;

  if m.status = 'completed' then perform public._propagate_result(m); end if;
  return m;
end $$;

-- ---------- Registrar una tarjeta o falta ----------
-- Cada fouls_per_point faltas del mismo participante en el match suman foul_points al rival.
create or replace function public.record_penalty(
  p_match uuid, p_offender uuid, p_card public.card_type, p_is_foul boolean, p_reason text, p_expected_version int
)
returns public.matches language plpgsql security definer set search_path = public as $$
declare
  m public.matches;
  s public.stages;
  tid uuid;
  fp int;
  per int;
  nfouls int;
  pts int := 0;
  rival uuid;
begin
  select * into m from public.matches where id = p_match for update;
  if not found then raise exception 'match_not_found'; end if;
  select * into s from public.stages where id = m.stage_id;
  tid := s.tournament_id;

  if auth.uid() is null or not (
    m.referee_id = auth.uid()
    or public.is_tournament_referee(tid)
    or public.is_tournament_organizer(tid)
    or public.auth_role() = 'admin'
  ) then raise exception 'forbidden'; end if;

  if m.status not in ('pending', 'in_progress') then raise exception 'match_closed'; end if;
  if m.version <> p_expected_version then raise exception 'version_conflict'; end if;
  if m.participant1_id is null or m.participant2_id is null then raise exception 'match_not_ready'; end if;
  if p_offender is distinct from m.participant1_id and p_offender is distinct from m.participant2_id then
    raise exception 'invalid_participant';
  end if;

  select foul_points, fouls_per_point into fp, per from public.tournaments where id = tid;
  rival := case when p_offender = m.participant1_id then m.participant2_id else m.participant1_id end;

  if p_is_foul then
    select count(*) + 1 into nfouls from public.penalties
      where match_id = p_match and participant_id = p_offender and is_foul;
    if nfouls % per = 0 then pts := fp; end if;
  end if;

  insert into public.penalties (match_id, participant_id, card_type, reason, issued_by, is_foul, points_awarded, awarded_to)
  values (p_match, p_offender, p_card, p_reason, auth.uid(), p_is_foul, pts, case when pts > 0 then rival end);

  m := public._apply_points(m, s, rival = m.participant1_id, pts);

  update public.matches set
    p1_match_points = m.p1_match_points, p2_match_points = m.p2_match_points,
    p1_sets = m.p1_sets, p2_sets = m.p2_sets,
    status = m.status, winner_id = m.winner_id, completed_at = m.completed_at,
    started_at = coalesce(started_at, now()), version = version + 1
  where id = p_match returning * into m;

  if m.status = 'completed' then perform public._propagate_result(m); end if;
  return m;
end $$;

-- ---------- Agregar participantes con semillas asignadas en el servidor ----------
create or replace function public.add_participants(p_tournament uuid, p_names text[])
returns int language plpgsql security definer set search_path = public as $$
declare
  base int;
  current_count int;
  cap int;
  clean text[];
  n int;
begin
  if auth.uid() is null or not (public.is_tournament_organizer(p_tournament) or public.auth_role() = 'admin') then
    raise exception 'forbidden';
  end if;

  select max_participants into cap from public.tournaments where id = p_tournament for update;
  if not found then raise exception 'tournament_not_found'; end if;

  select coalesce(array_agg(trim(x)), '{}') into clean from unnest(p_names) as x where trim(x) <> '';
  if coalesce(array_length(clean, 1), 0) = 0 then return 0; end if;

  select coalesce(max(seed), 0), count(*) into base, current_count
  from public.participants where tournament_id = p_tournament;

  if cap is not null and current_count + array_length(clean, 1) > cap then
    raise exception 'tournament_full';
  end if;

  insert into public.participants (tournament_id, display_name, seed, status)
  select p_tournament, t.name, base + t.ord, 'registered'
  from unnest(clean) with ordinality as t(name, ord);
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- Permisos: el árbitro escribe solo por las funciones ----------
drop policy if exists "battles: árbitro o organizer inserta/actualiza" on public.battles;
create policy "battles: organizer/admin corrige" on public.battles
  for all to authenticated
  using (exists (
    select 1 from public.matches mm join public.stages ss on ss.id = mm.stage_id
    where mm.id = battles.match_id and (public.is_tournament_organizer(ss.tournament_id) or public.auth_role() = 'admin')))
  with check (exists (
    select 1 from public.matches mm join public.stages ss on ss.id = mm.stage_id
    where mm.id = battles.match_id and (public.is_tournament_organizer(ss.tournament_id) or public.auth_role() = 'admin')));

drop policy if exists "penalties: árbitro/organizer/admin escribe" on public.penalties;
create policy "penalties: organizer/admin corrige" on public.penalties
  for all to authenticated
  using (exists (
    select 1 from public.matches mm join public.stages ss on ss.id = mm.stage_id
    where mm.id = penalties.match_id and (public.is_tournament_organizer(ss.tournament_id) or public.auth_role() = 'admin')))
  with check (exists (
    select 1 from public.matches mm join public.stages ss on ss.id = mm.stage_id
    where mm.id = penalties.match_id and (public.is_tournament_organizer(ss.tournament_id) or public.auth_role() = 'admin')));

-- ---------- Privilegios de ejecución ----------
revoke all on function public._apply_points(public.matches, public.stages, boolean, int) from public, anon, authenticated;
revoke all on function public._propagate_result(public.matches) from public, anon, authenticated;

revoke all on function public.record_battle(uuid, uuid, public.finish_type, int) from public, anon;
revoke all on function public.record_penalty(uuid, uuid, public.card_type, boolean, text, int) from public, anon;
revoke all on function public.add_participants(uuid, text[]) from public, anon;

grant execute on function public.record_battle(uuid, uuid, public.finish_type, int) to authenticated;
grant execute on function public.record_penalty(uuid, uuid, public.card_type, boolean, text, int) to authenticated;
grant execute on function public.add_participants(uuid, text[]) to authenticated;
