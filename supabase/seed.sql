-- ============================================================
-- seed.sql — Datos de prueba para desarrollo local
-- ============================================================

-- Admin de prueba (el UUID debe coincidir con un usuario de auth.users)
-- Se inserta manualmente después de crear la cuenta en local Supabase

-- Torneo de ejemplo
insert into tournaments (id, created_by, name, slug, description, status, stadium, max_participants, seeding_method)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001', -- admin user
  'Beyblade X Cup 2025',
  'beyblade-x-cup-2025',
  'Torneo oficial de prueba. Formato: Swiss → Top 16 Eliminación Simple.',
  'draft',
  'Xcross Dome Standard',
  32,
  'manual'
);

-- Puntos de finish por defecto
select seed_default_finish_points('aaaaaaaa-0000-0000-0000-000000000001');

-- Etapa 1: Swiss (6 rondas, top 16 avanzan)
insert into stages (id, tournament_id, position, name, format, match_type, points_to_win, swiss_rounds, advance_per_group)
values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  0, 'Fase Swiss', 'swiss', '1on1', 4, 6, null
);

-- Etapa 2: Single Elimination desde 16vos
insert into stages (id, tournament_id, position, name, format, match_type, points_to_win, grand_finals_modifier)
values (
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  1, 'Top 16 — Eliminación Simple', 'single_elimination', 'deck', 7, 'none'
);

-- 8 participantes de prueba
insert into participants (tournament_id, display_name, seed) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Ryuga Hagane', 1),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Gingka Hagane', 2),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Kyoya Tategami', 3),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Masamune Kadoya', 4),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tsubasa Otori', 5),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Yu Tendo', 6),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Zeo Abyss', 7),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Toby', 8);
