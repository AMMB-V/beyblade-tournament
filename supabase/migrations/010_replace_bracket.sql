-- 010: replace_bracket (atómico) conserva el ganador automático de los byes
create or replace function public.replace_bracket(p_stage uuid, p_rows jsonb, p_force boolean default false)
returns int language plpgsql security definer set search_path = public as $$
declare
  tid uuid;
  n int;
begin
  select tournament_id into tid from public.stages where id = p_stage;
  if tid is null then raise exception 'stage_not_found'; end if;

  if auth.uid() is null or not (public.is_tournament_organizer(tid) or public.auth_role() = 'admin') then
    raise exception 'forbidden';
  end if;

  if exists (select 1 from public.matches where stage_id = p_stage and status in ('in_progress', 'completed')) then
    if not p_force then raise exception 'bracket_has_results'; end if;
    if public.auth_role() is distinct from 'admin' then raise exception 'forbidden'; end if;
  end if;

  delete from public.matches where stage_id = p_stage;

  insert into public.matches (
    id, stage_id, round, match_number, bracket_side, participant1_id, participant2_id, winner_id,
    next_match_id, next_match_slot, loser_next_match_id, loser_next_slot, status
  )
  select r.id, p_stage, r.round, r.match_number, r.bracket_side, r.participant1_id, r.participant2_id, r.winner_id,
         r.next_match_id, r.next_match_slot, r.loser_next_match_id, r.loser_next_slot, r.status
  from jsonb_to_recordset(p_rows) as r(
    id uuid, round smallint, match_number int, bracket_side public.bracket_side,
    participant1_id uuid, participant2_id uuid, winner_id uuid, next_match_id uuid, next_match_slot smallint,
    loser_next_match_id uuid, loser_next_slot smallint, status public.match_status
  );
  get diagnostics n = row_count;

  update public.stages set status = 'in_progress', started_at = now(), completed_at = null where id = p_stage;
  update public.tournaments set status = 'in_progress' where id = tid;
  return n;
end $$;

revoke all on function public.replace_bracket(uuid, jsonb, boolean) from public, anon;
grant execute on function public.replace_bracket(uuid, jsonb, boolean) to authenticated;
