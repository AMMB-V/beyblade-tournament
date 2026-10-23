-- ============================================================
-- Migration: 001_initial_schema
-- Descripción: Esquema base completo para torneos de Beyblade
-- ============================================================

-- ──────────────────────────────────────────
-- EXTENSIONES
-- ──────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- búsqueda de participantes

-- ──────────────────────────────────────────
-- TIPOS ENUMERADOS
-- ──────────────────────────────────────────

create type tournament_visibility as enum ('public', 'private', 'unlisted');
create type tournament_status     as enum ('draft', 'registration', 'checkin', 'in_progress', 'completed', 'cancelled');
create type stage_format          as enum ('single_elimination', 'double_elimination', 'round_robin', 'swiss', 'groups');
create type match_type            as enum ('1on1', 'deck', '3on3', '5g');
create type participant_status    as enum ('registered', 'checked_in', 'disqualified', 'withdrawn');
create type match_status          as enum ('pending', 'in_progress', 'completed', 'disputed', 'bye');
create type finish_type           as enum ('spin', 'over', 'burst', 'xtreme');
create type card_type             as enum ('yellow', 'red');
create type bracket_side          as enum ('winners', 'losers', 'grand_finals');
create type user_role             as enum ('admin', 'organizer', 'referee', 'blader');
create type tiebreaker_method     as enum ('wins', 'point_diff', 'head_to_head', 'buchholz', 'draw');

-- ──────────────────────────────────────────
-- PERFILES DE USUARIO
-- ──────────────────────────────────────────

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url  text,
  role        user_role not null default 'blader',
  wbo_id      text,                  -- ID en la World Beyblade Organization
  elo_rating  integer not null default 1000,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ORGANIZACIONES / CLUBS
-- ──────────────────────────────────────────

create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  owner_id    uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);

create table organization_members (
  org_id      uuid not null references organizations(id) on delete cascade,
  profile_id  uuid not null references profiles(id) on delete cascade,
  role        user_role not null default 'organizer',
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (org_id, profile_id)
);

-- ──────────────────────────────────────────
-- TORNEOS
-- ──────────────────────────────────────────

create table tournaments (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid references organizations(id),
  created_by          uuid not null references profiles(id),
  name                text not null,
  slug                text not null unique,
  description         text,
  banner_url          text,
  visibility          tournament_visibility not null default 'public',
  status              tournament_status not null default 'draft',
  -- Beyblade-specific
  stadium             text,                        -- nombre del estadio usado
  rotation_rules      text,                        -- notas sobre reglas de rotación
  -- Configuración de inscripción
  max_participants    integer,
  registration_open   timestamptz,
  registration_close  timestamptz,
  checkin_open        timestamptz,
  checkin_close       timestamptz,
  entry_fee           numeric(8,2),
  -- Seeding
  seeding_method      text not null default 'manual', -- 'manual' | 'random' | 'ranking' | 'elo'
  -- Metadatos
  location            text,
  starts_at           timestamptz,
  ends_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- LISTAS DE PARTES PROHIBIDAS (deck rules)
-- ──────────────────────────────────────────

create table banned_parts (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  part_name     text not null,
  reason        text,
  created_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ETAPAS DEL TORNEO
-- (un torneo tiene 1..N etapas en orden)
-- ──────────────────────────────────────────

create table stages (
  id                    uuid primary key default gen_random_uuid(),
  tournament_id         uuid not null references tournaments(id) on delete cascade,
  position              smallint not null,         -- orden de la etapa (0-indexed)
  name                  text not null,             -- ej: "Fase de Grupos", "Top 16"
  format                stage_format not null,
  match_type            match_type not null default '1on1',
  -- Puntuación de batch/match
  points_to_win         integer not null default 4, -- puntos necesarios para ganar un match
  best_of               integer not null default 1, -- nro de batallas (1 = first to win_points)
  -- Configuración por formato
  group_size            integer,                   -- participantes por grupo (groups/RR)
  groups_count          integer,                   -- número de grupos (calculado o manual)
  swiss_rounds          integer,                   -- rondas Swiss
  advance_per_group     integer,                   -- cuántos pasan de cada grupo
  -- Double elimination
  grand_finals_modifier text default 'none',       -- 'none' | 'advantage' | 'reset'
  -- Desempates (array ordenado)
  tiebreakers           tiebreaker_method[] not null default array['wins','point_diff','head_to_head']::tiebreaker_method[],
  -- Estado
  status                tournament_status not null default 'draft',
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  unique(tournament_id, position)
);

-- Puntos por tipo de finish (configurables por torneo)
create table finish_point_rules (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  finish_type   finish_type not null,
  points        integer not null,
  unique(tournament_id, finish_type)
);

-- ──────────────────────────────────────────
-- PARTICIPANTES
-- ──────────────────────────────────────────

create table participants (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  profile_id    uuid references profiles(id),       -- null si es offline/manual
  display_name  text not null,
  seed          integer,                            -- posición de siembra
  status        participant_status not null default 'registered',
  checked_in_at timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  unique(tournament_id, profile_id)
);

-- ──────────────────────────────────────────
-- GRUPOS
-- ──────────────────────────────────────────

create table groups (
  id          uuid primary key default gen_random_uuid(),
  stage_id    uuid not null references stages(id) on delete cascade,
  name        text not null,               -- ej: "Grupo A"
  position    smallint not null,
  created_at  timestamptz not null default now(),
  unique(stage_id, position)
);

create table group_participants (
  group_id       uuid not null references groups(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  seed_in_group  smallint,
  primary key (group_id, participant_id)
);

-- ──────────────────────────────────────────
-- PARTIDAS (matches)
-- ──────────────────────────────────────────

create table matches (
  id              uuid primary key default gen_random_uuid(),
  stage_id        uuid not null references stages(id) on delete cascade,
  group_id        uuid references groups(id),       -- null si es eliminación directa
  round           smallint not null,                -- ronda dentro de la etapa
  match_number    integer not null,                 -- número de partida en la ronda
  bracket_side    bracket_side not null default 'winners',
  -- Participantes
  participant1_id uuid references participants(id),
  participant2_id uuid references participants(id),
  -- Árbitro asignado
  referee_id      uuid references profiles(id),
  -- Estado y resultado
  status          match_status not null default 'pending',
  winner_id       uuid references participants(id),
  p1_match_points integer not null default 0,       -- puntos acumulados en el match
  p2_match_points integer not null default 0,
  -- Avance del bracket
  next_match_id        uuid references matches(id), -- siguiente partida del ganador
  next_match_slot      smallint,                    -- 1 o 2
  loser_next_match_id  uuid references matches(id), -- bracket de perdedores (DE)
  loser_next_slot      smallint,
  -- Control
  started_at      timestamptz,
  completed_at    timestamptz,
  locked_at       timestamptz,                      -- resultado bloqueado definitivamente
  created_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- DECKS (mazo de combos declarado por partida)
-- ──────────────────────────────────────────

create table match_decks (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references matches(id) on delete cascade,
  participant_id uuid not null references participants(id),
  combo_1        text not null,
  combo_2        text,
  combo_3        text,
  declared_at    timestamptz not null default now(),
  unique(match_id, participant_id)
);

-- ──────────────────────────────────────────
-- BATALLAS (individual battles dentro de un match)
-- ──────────────────────────────────────────

create table battles (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references matches(id) on delete cascade,
  battle_number   smallint not null,                -- 1, 2, 3...
  -- Combos usados en esta batalla (para deck/3on3)
  p1_combo        text,
  p2_combo        text,
  -- Resultado
  finish          finish_type,                      -- cómo terminó
  scorer_id       uuid references participants(id), -- quién anotó el finish
  points_scored   integer,                          -- puntos de ese finish
  -- Árbitro que registró
  recorded_by     uuid references profiles(id),
  recorded_at     timestamptz not null default now(),
  unique(match_id, battle_number)
);

-- ──────────────────────────────────────────
-- TARJETAS Y PENALIZACIONES
-- ──────────────────────────────────────────

create table penalties (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references matches(id) on delete cascade,
  battle_id      uuid references battles(id),
  participant_id uuid not null references participants(id),
  card_type      card_type not null,
  reason         text,
  issued_by      uuid not null references profiles(id),
  issued_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- BEY CHECK (inspecciones)
-- ──────────────────────────────────────────

create table bey_checks (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references matches(id) on delete cascade,
  participant_id uuid not null references participants(id),
  combo_checked  text not null,
  passed         boolean not null,
  notes          text,
  substitute_approved boolean not null default false,
  checked_by     uuid not null references profiles(id),
  checked_at     timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- BITÁCORA DE CAMBIOS (audit log)
-- ──────────────────────────────────────────

create table audit_log (
  id          bigserial primary key,
  table_name  text not null,
  record_id   uuid not null,
  action      text not null,            -- 'update', 'reopen', 'override'
  old_data    jsonb,
  new_data    jsonb,
  performed_by uuid references profiles(id),
  reason      text,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ÁRBITROS ASIGNADOS AL TORNEO
-- ──────────────────────────────────────────

create table tournament_referees (
  tournament_id uuid not null references tournaments(id) on delete cascade,
  profile_id    uuid not null references profiles(id) on delete cascade,
  assigned_at   timestamptz not null default now(),
  primary key (tournament_id, profile_id)
);

-- ──────────────────────────────────────────
-- STANDINGS (vistas materializadas o calculadas)
-- Guardamos los standings de cada etapa para performance
-- ──────────────────────────────────────────

create table stage_standings (
  id                uuid primary key default gen_random_uuid(),
  stage_id          uuid not null references stages(id) on delete cascade,
  group_id          uuid references groups(id),
  participant_id    uuid not null references participants(id),
  position          smallint,                       -- posición final en la etapa/grupo
  wins              integer not null default 0,
  losses            integer not null default 0,
  draws             integer not null default 0,
  points_for        integer not null default 0,
  points_against    integer not null default 0,
  buchholz_score    numeric(8,2) not null default 0,
  advanced          boolean not null default false, -- ¿clasificó a la siguiente etapa?
  updated_at        timestamptz not null default now(),
  unique(stage_id, participant_id)
);

-- ──────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────

create index on tournaments(slug);
create index on tournaments(status);
create index on stages(tournament_id, position);
create index on matches(stage_id, round);
create index on matches(participant1_id);
create index on matches(participant2_id);
create index on matches(status);
create index on battles(match_id);
create index on stage_standings(stage_id, group_id);
create index on participants(tournament_id, seed);

-- ──────────────────────────────────────────
-- TRIGGERS: updated_at automático
-- ──────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tournaments_updated_at
  before update on tournaments
  for each row execute function update_updated_at();

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger trg_standings_updated_at
  before update on stage_standings
  for each row execute function update_updated_at();

-- ──────────────────────────────────────────
-- FUNCIÓN: valores por defecto de puntos de finish
-- ──────────────────────────────────────────

create or replace function seed_default_finish_points(p_tournament_id uuid)
returns void language plpgsql as $$
begin
  insert into finish_point_rules (tournament_id, finish_type, points) values
    (p_tournament_id, 'spin',    1),
    (p_tournament_id, 'over',    2),
    (p_tournament_id, 'burst',   2),
    (p_tournament_id, 'xtreme',  3)
  on conflict (tournament_id, finish_type) do nothing;
end;
$$;
