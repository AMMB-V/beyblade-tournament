-- El árbitro escribe solo a través de record_battle / record_penalty.
-- Se aplica después de desplegar el código que usa esas funciones (ya en producción).
drop policy if exists "battles: árbitro registra" on public.battles;
drop policy if exists "penalties: árbitro registra" on public.penalties;
drop policy if exists "matches: árbitro actualiza marcador" on public.matches;
