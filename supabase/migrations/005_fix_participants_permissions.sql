-- ============================================================
-- Migration: 005_fix_participants_permissions.sql
-- ============================================================

-- Eliminar cualquier política residual restrictiva en participants
drop policy if exists "participants: organizer/admin escribe" on participants;
drop policy if exists "participants: añadir participantes al torneo" on participants;

-- Permitir todas las operaciones públicas en participants para torneos abiertos
create policy "participants: gestion publica"
  on participants for all
  using (true)
  with check (true);

-- Permitir update en tournaments para cambiar estado a in_progress
drop policy if exists "tournaments: organizer/admin edita" on tournaments;
create policy "tournaments: gestion publica"
  on tournaments for update
  using (true);

-- Permitir eliminar e insertar matches libremente al generar el cuadro
drop policy if exists "matches: árbitro asignado puede actualizar" on matches;
drop policy if exists "matches: organizer/admin inserta" on matches;
drop policy if exists "matches: insertar matches del torneo" on matches;

create policy "matches: gestion publica"
  on matches for all
  using (true)
  with check (true);
