-- ============================================================
-- Migration: 002_rls_policies
-- Descripción: Row Level Security para todas las tablas
-- ============================================================

-- ──────────────────────────────────────────
-- HELPERS
-- ──────────────────────────────────────────

create or replace function auth_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_tournament_organizer(p_tournament_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tournaments t
    where t.id = p_tournament_id
      and (
        t.created_by = auth.uid()
        or exists (
          select 1 from organization_members om
          where om.org_id = t.org_id
            and om.profile_id = auth.uid()
            and om.accepted_at is not null
        )
      )
  )
$$;

create or replace function is_tournament_referee(p_tournament_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from tournament_referees
    where tournament_id = p_tournament_id
      and profile_id = auth.uid()
  )
$$;

-- ──────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────

alter table profiles enable row level security;

create policy "profiles: lectura pública"
  on profiles for select using (true);

create policy "profiles: el usuario edita su propio perfil"
  on profiles for update using (auth.uid() = id);

create policy "profiles: admin puede editar cualquier perfil"
  on profiles for update using (auth_role() = 'admin');

-- ──────────────────────────────────────────
-- TOURNAMENTS
-- ──────────────────────────────────────────

alter table tournaments enable row level security;

create policy "tournaments: lectura pública si no es privado"
  on tournaments for select
  using (visibility in ('public', 'unlisted') or is_tournament_organizer(id) or auth_role() = 'admin');

create policy "tournaments: organizer/admin crea"
  on tournaments for insert
  with check (auth_role() in ('admin', 'organizer') and created_by = auth.uid());

create policy "tournaments: organizer/admin edita"
  on tournaments for update
  using (is_tournament_organizer(id) or auth_role() = 'admin');

create policy "tournaments: admin elimina"
  on tournaments for delete
  using (auth_role() = 'admin');

-- ──────────────────────────────────────────
-- STAGES, GROUPS, PARTICIPANTS
-- ──────────────────────────────────────────

alter table stages enable row level security;

create policy "stages: lectura si torneo visible"
  on stages for select
  using (exists (select 1 from tournaments t where t.id = tournament_id and (t.visibility != 'private' or is_tournament_organizer(t.id) or auth_role() = 'admin')));

create policy "stages: organizer/admin escribe"
  on stages for all
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin');

alter table groups enable row level security;
create policy "groups: lectura pública (heredada del torneo)"
  on groups for select using (true);
create policy "groups: organizer/admin escribe"
  on groups for all
  using (exists (select 1 from stages s where s.id = stage_id and (is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')));

alter table group_participants enable row level security;
create policy "group_participants: lectura pública"
  on group_participants for select using (true);
create policy "group_participants: organizer/admin escribe"
  on group_participants for all
  using (exists (
    select 1 from groups g join stages s on s.id = g.stage_id
    where g.id = group_id and (is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')
  ));

alter table participants enable row level security;
create policy "participants: lectura pública"
  on participants for select using (true);
create policy "participants: organizer/admin escribe"
  on participants for all
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin');

-- ──────────────────────────────────────────
-- MATCHES
-- ──────────────────────────────────────────

alter table matches enable row level security;

create policy "matches: lectura pública"
  on matches for select using (true);

create policy "matches: árbitro asignado puede actualizar"
  on matches for update
  using (
    referee_id = auth.uid()
    or exists (select 1 from stages s where s.id = stage_id and is_tournament_organizer(s.tournament_id))
    or auth_role() = 'admin'
  );

create policy "matches: organizer/admin inserta"
  on matches for insert
  with check (exists (select 1 from stages s where s.id = stage_id and (is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')));

-- ──────────────────────────────────────────
-- BATTLES
-- ──────────────────────────────────────────

alter table battles enable row level security;

create policy "battles: lectura pública"
  on battles for select using (true);

create policy "battles: árbitro o organizer inserta/actualiza"
  on battles for all
  using (exists (
    select 1 from matches m join stages s on s.id = m.stage_id
    where m.id = match_id
      and (m.referee_id = auth.uid() or is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')
  ));

-- ──────────────────────────────────────────
-- PENALTIES, BEY_CHECKS, MATCH_DECKS
-- ──────────────────────────────────────────

alter table penalties enable row level security;
create policy "penalties: lectura pública" on penalties for select using (true);
create policy "penalties: árbitro/organizer/admin escribe" on penalties for all
  using (exists (
    select 1 from matches m join stages s on s.id = m.stage_id
    where m.id = match_id
      and (m.referee_id = auth.uid() or is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')
  ));

alter table bey_checks enable row level security;
create policy "bey_checks: lectura árbitro/organizer" on bey_checks for select
  using (exists (
    select 1 from matches m join stages s on s.id = m.stage_id
    where m.id = match_id
      and (m.referee_id = auth.uid() or is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')
  ));
create policy "bey_checks: árbitro/organizer/admin escribe" on bey_checks for all
  using (exists (
    select 1 from matches m join stages s on s.id = m.stage_id
    where m.id = match_id
      and (m.referee_id = auth.uid() or is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')
  ));

alter table match_decks enable row level security;
create policy "match_decks: lectura pública" on match_decks for select using (true);
create policy "match_decks: árbitro/organizer/admin escribe" on match_decks for all
  using (exists (
    select 1 from matches m join stages s on s.id = m.stage_id
    where m.id = match_id
      and (m.referee_id = auth.uid() or is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')
  ));

-- ──────────────────────────────────────────
-- AUDIT LOG
-- ──────────────────────────────────────────

alter table audit_log enable row level security;
create policy "audit_log: solo admin y organizer leen"
  on audit_log for select
  using (auth_role() in ('admin', 'organizer'));
create policy "audit_log: solo sistema inserta (service role)"
  on audit_log for insert with check (false); -- solo desde service_role

-- ──────────────────────────────────────────
-- STANDINGS y FINISH RULES
-- ──────────────────────────────────────────

alter table stage_standings enable row level security;
create policy "standings: lectura pública" on stage_standings for select using (true);
create policy "standings: sistema actualiza" on stage_standings for all
  using (exists (select 1 from stages s where s.id = stage_id and (is_tournament_organizer(s.tournament_id) or auth_role() = 'admin')));

alter table finish_point_rules enable row level security;
create policy "finish_rules: lectura pública" on finish_point_rules for select using (true);
create policy "finish_rules: organizer/admin escribe" on finish_point_rules for all
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin');

alter table banned_parts enable row level security;
create policy "banned_parts: lectura pública" on banned_parts for select using (true);
create policy "banned_parts: organizer/admin escribe" on banned_parts for all
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin');

alter table tournament_referees enable row level security;
create policy "tournament_referees: lectura organizer/admin" on tournament_referees for select
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin' or profile_id = auth.uid());
create policy "tournament_referees: organizer/admin escribe" on tournament_referees for all
  using (is_tournament_organizer(tournament_id) or auth_role() = 'admin');
