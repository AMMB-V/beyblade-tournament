// ============================================================
// src/lib/engine/types.ts
// Tipos del motor de torneos (independientes de Supabase)
// ============================================================

export type FinishType = 'spin' | 'over' | 'burst' | 'xtreme';
export type StageFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'groups';
export type MatchType = '1on1' | 'deck' | '3on3' | '5g';
export type BracketSide = 'winners' | 'losers' | 'grand_finals';
export type TiebreakerMethod = 'wins' | 'point_diff' | 'head_to_head' | 'buchholz' | 'draw';

/** Un participante simplificado para el motor (sin deps de DB) */
export interface Player {
  id: string;
  seed?: number;
  displayName: string;
}

/** Resultado de una batalla individual */
export interface BattleResult {
  battleNumber: number;
  scorerId: string;   // id del jugador que anotó
  finish: FinishType;
  points: number;
}

/** Estado de un match al ser procesado por el motor */
export interface MatchState {
  id: string;
  player1Id: string | null;   // null = bye
  player2Id: string | null;
  p1Points: number;
  p2Points: number;
  battles: BattleResult[];
  winnerId: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  nextMatchId: string | null;
  nextMatchSlot: 1 | 2 | null;
  loserNextMatchId: string | null;
  loserNextSlot: 1 | 2 | null;
  bracketSide: BracketSide;
  round: number;
  matchNumber: number;
}

/** Configuración de puntos por tipo de finish */
export type FinishPointRules = Record<FinishType, number>;

export const DEFAULT_FINISH_POINTS: FinishPointRules = {
  spin: 1,
  over: 2,
  burst: 2,
  xtreme: 3,
};

/** Configuración de una etapa del torneo */
export interface StageConfig {
  id: string;
  format: StageFormat;
  pointsToWin: number;
  bestOf: number;
  matchType: MatchType;
  groupSize?: number;
  groupsCount?: number;
  swissRounds?: number;
  advancePerGroup?: number;
  grandFinalsModifier?: 'none' | 'advantage' | 'reset';
  tiebreakers: TiebreakerMethod[];
  finishPoints: FinishPointRules;
}

/** Resultado completo de una etapa */
export interface StageResult {
  matches: MatchState[];
  standings: PlayerStanding[];
  advancingPlayerIds: string[];
}

/** Standing de un jugador en una etapa/grupo */
export interface PlayerStanding {
  playerId: string;
  groupId?: string;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  buchholzScore: number;
  position?: number;
  advanced: boolean;
}
