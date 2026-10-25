-- ============================================================
-- 006: el árbitro asignado puede arbitrar (sin tocar la estructura del bracket)
-- Contexto: las políticas de escritura ya están cerradas a admin/organizer.
-- Falta que el rol referee pueda registrar batallas, faltas y resultados.
-- ============================================================

-- ¿El usuario actual es el árbitro de este match (asignado al match o al torneo)?
create or replace function public.is_match_referee(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from matches m
    join stages s on s.id = m.stage_id
    where m.id = p_match_id
      and (m.referee_id = auth.uid() or is_tournament_referee(s.tournament_id))
  )
$$;

-- Batallas: el árbitro registra mientras el match no esté bloqueado
create policy "battles: árbitro registra"
  on public.battles for all to authenticated
  using (
    is_match_referee(match_id)
    and exists (select 1 from matches m where m.id = battles.match_id and m.locked_at is null)
  )
  with check (
    is_match_referee(match_id)
    and recorded_by = auth.uid()
    and exists (select 1 from matches m where m.id = battles.match_id and m.locked_at is null)
  );

-- Faltas y tarjetas
create policy "penalties: árbitro registra"
  on public.penalties for all to authenticated
  using (
    is_match_referee(match_id)
    and exists (select 1 from matches m where m.id = penalties.match_id and m.locked_at is null)
  )
  with check (
    is_match_referee(match_id)
    and issued_by = auth.uid()
    and exists (select 1 from matches m where m.id = penalties.match_id and m.locked_at is null)
  );

-- Matches: el árbitro solo actualiza el marcador/estado
create policy "matches: árbitro actualiza marcador"
  on public.matches for update to authenticated
  using (is_match_referee(id) and locked_at is null)
  with check (is_match_referee(id));

-- Un árbitro (que no sea organizer/admin) no puede alterar la estructura del bracket
create or replace function public.protect_match_structure()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament uuid;
begin
  if auth.uid() is null then
    return new; -- service role / procesos internos
  end if;

  select s.tournament_id into v_tournament from stages s where s.id = old.stage_id;

  if auth_role() = 'admin' or is_tournament_organizer(v_tournament) then
    return new;
  end if;

  if new.stage_id is distinct from old.stage_id
     or new.group_id is distinct from old.group_id
     or new.round is distinct from old.round
     or new.match_number is distinct from old.match_number
     or new.bracket_side is distinct from old.bracket_side
     or new.participant1_id is distinct from old.participant1_id
     or new.participant2_id is distinct from old.participant2_id
     or new.referee_id is distinct from old.referee_id
     or new.next_match_id is distinct from old.next_match_id
     or new.next_match_slot is distinct from old.next_match_slot
     or new.loser_next_match_id is distinct from old.loser_next_match_id
     or new.loser_next_slot is distinct from old.loser_next_slot
     or new.locked_at is distinct from old.locked_at
  then
    raise exception 'Solo el organizador o admin puede modificar la estructura del bracket';
  end if;

  return new;
end $$;

create trigger protect_match_structure
  before update on public.matches
  for each row execute function public.protect_match_structure();
