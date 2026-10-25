-- 011: el árbitro escribe solo a través de record_battle / record_penalty.
-- APLICAR DESPUÉS de desplegar el código que usa esas funciones: el código anterior
-- escribía directo en battles, penalties y matches con estas políticas.
drop policy if exists "battles: árbitro registra" on public.battles;
drop policy if exists "penalties: árbitro registra" on public.penalties;
drop policy if exists "matches: árbitro actualiza marcador" on public.matches;
