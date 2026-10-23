-- ============================================================
-- Migration: 004_allow_public_tournaments_creation.sql
-- Descripción: Permite creación pública de torneos y etapas
-- para modo abierto/invitado tipo Challonge (o cuando auth es opcional)
-- ============================================================

-- Permitir a usuarios anónimos o autenticados crear torneos
drop policy if exists "tournaments: organizer/admin crea" on tournaments;
create policy "tournaments: cualquier usuario puede crear"
  on tournaments for insert
  with check (true);

-- Permitir crear etapas asociadas
drop policy if exists "stages: organizer/admin escribe" on stages;
create policy "stages: creación de etapas para el torneo"
  on stages for insert
  with check (true);

-- Permitir añadir participantes
drop policy if exists "participants: organizer/admin escribe" on participants;
create policy "participants: añadir participantes al torneo"
  on participants for insert
  with check (true);

-- Permitir crear matches generados
drop policy if exists "matches: organizer/admin inserta" on matches;
create policy "matches: insertar matches del torneo"
  on matches for insert
  with check (true);
