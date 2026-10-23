// ============================================================
// src/lib/engine/advancement.ts
// Lógica de transición y encadenamiento entre etapas
// Ej: Swiss -> Top 8 -> Single Elimination
// ============================================================

import type { Player, PlayerStanding, StageConfig } from './types';
import { rankStandings } from './tiebreakers';
import { generateSingleElimination } from './formats/single-elimination';
import { generateDoubleElimination } from './formats/double-elimination';
import type { MatchState } from './types';

/**
 * Selecciona a los jugadores clasificados de una etapa según su posición final.
 * 
 * @param standings Lista de standings de los participantes
 * @param topN Número de jugadores que avanzan (ej. 8 o 16)
 * @param playersMap Mapa de IDs a objetos Player para preservar nombres
 */
export function selectAdvancingPlayers(
  standings: PlayerStanding[],
  topN: number,
  playersMap: Map<string, Player>
): Player[] {
  // Filtrar los topN ordenados por posición
  const sorted = [...standings]
    .sort((a, b) => (a.position ?? 9999) - (b.position ?? 9999))
    .slice(0, topN);

  return sorted.map((s, index) => {
    const original = playersMap.get(s.playerId);
    return {
      id: s.playerId,
      displayName: original?.displayName ?? `Jugador ${s.playerId}`,
      seed: index + 1, // Nuevo seed para la siguiente etapa basado en su puesto
    };
  });
}

/**
 * Genera el cuadro de la siguiente etapa a partir de los clasificados de la anterior.
 */
export function advanceToNextStage({
  currentStandings,
  nextStageConfig,
  advanceCount,
  players,
  idGen = crypto.randomUUID.bind(crypto),
}: {
  currentStandings: PlayerStanding[];
  nextStageConfig: StageConfig;
  advanceCount: number;
  players: Player[];
  idGen?: () => string;
}): { qualifiedPlayers: Player[]; nextMatches: MatchState[] } {
  const playersMap = new Map(players.map((p) => [p.id, p]));
  const qualifiedPlayers = selectAdvancingPlayers(currentStandings, advanceCount, playersMap);

  let nextMatches: MatchState[] = [];

  if (nextStageConfig.format === 'single_elimination') {
    nextMatches = generateSingleElimination(qualifiedPlayers, nextStageConfig.id, nextStageConfig, idGen);
  } else if (nextStageConfig.format === 'double_elimination') {
    nextMatches = generateDoubleElimination(qualifiedPlayers, nextStageConfig.id, nextStageConfig, idGen);
  }

  return {
    qualifiedPlayers,
    nextMatches,
  };
}
