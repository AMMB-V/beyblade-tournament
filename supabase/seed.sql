-- Seed data corregido
delete from matches where stage_id in (select id from stages where tournament_id = 'aaaaaaaa-0000-0000-0000-000000000001');
delete from participants where tournament_id = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from stages where tournament_id = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from tournaments where id = 'aaaaaaaa-0000-0000-0000-000000000001';

insert into tournaments (id, name, slug, description, status, stadium, max_participants, seeding_method)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Beyblade X Cup 2025',
  'beyblade-x-cup-2025',
  'Torneo oficial de prueba. Formato: Eliminación Simple desde 4tos de final.',
  'in_progress',
  'Xtreme Stadium Standard (BX-07)',
  8,
  'manual'
);

select seed_default_finish_points('aaaaaaaa-0000-0000-0000-000000000001');

insert into stages (id, tournament_id, position, name, format, match_type, points_to_win)
values (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  0,
  'Fase Final — Eliminación Simple',
  'single_elimination',
  '3on3',
  4
);

-- Participantes
insert into participants (id, tournament_id, display_name, seed) values
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Kamen X (Dran Sword)', 1),
  ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Bird Kazami (Hells Scythe)', 2),
  ('11111111-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Multi Nanairo (Wizard Arrow)', 3),
  ('11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'Ekusu Kurosu (Dran Dagger)', 4);

-- Matches de Semifinales y Final
insert into matches (id, stage_id, round, match_number, participant1_id, participant2_id, p1_match_points, p2_match_points, status)
values
  ('22222222-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 1, 1, '11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 3, 2, 'in_progress'),
  ('22222222-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 1, 2, '11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', 1, 4, 'completed'),
  ('22222222-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 2, 1, null, '11111111-0000-0000-0000-000000000003', 0, 0, 'pending');
