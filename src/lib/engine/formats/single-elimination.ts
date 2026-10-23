// ============================================================
// src/lib/engine/formats/single-elimination.ts
// Generador de bracket de eliminación simple
// ============================================================

import { generateSEPairs, nextPowerOfTwo } from '../seeding';
import type { MatchState, Player, StageConfig } from '../types';

/**
 * Genera todos los matches de un bracket de eliminación simple.
 * Los matches de rondas futuras se crean vacíos con next_match_id ya enlazado.
 *
 * @param players  Lista de participantes con seed
 * @param stageId  ID de la etapa
 * @param config   Configuración de la etapa
 * @param idGen    Función generadora de UUIDs (para poder mockearla en tests)
 */
export function generateSingleElimination(
  players: Player[],
  stageId: string,
  config: StageConfig,
  idGen: () => string = crypto.randomUUID.bind(crypto),
): MatchState[] {
  const size = nextPowerOfTwo(players.length);
  const rounds = Math.log2(size);
  const matches: MatchState[] = [];

  // Mapa round → lista de match ids (para enlazar next_match_id)
  const roundMatchIds: string[][] = Array.from({ length: rounds }, () => []);

  // Pre-genera IDs para todos los matches
  for (let r = 0; r < rounds; r++) {
    const matchCount = size / Math.pow(2, r + 1);
    for (let m = 0; m < matchCount; m++) {
      roundMatchIds[r].push(idGen());
    }
  }

  // Ronda 1: pares de siembra
  const pairs = generateSEPairs(players);
  pairs.forEach((pair, index) => {
    const [p1, p2] = pair;
    const matchId = roundMatchIds[0][index];
    const nextMatchId = rounds > 1 ? roundMatchIds[1][Math.floor(index / 2)] : null;
    const nextSlot: 1 | 2 = (index % 2 === 0 ? 1 : 2);

    const isBye = p2 === null;

    const match: MatchState = {
      id: matchId,
      player1Id: p1.id,
      player2Id: isBye ? null : p2.id,
      p1Points: 0,
      p2Points: 0,
      battles: [],
      winnerId: isBye ? p1.id : null,       // bye → ganador automático
      status: isBye ? 'bye' : 'pending',
      nextMatchId,
      nextMatchSlot: nextSlot,
      loserNextMatchId: null,
      loserNextSlot: null,
      bracketSide: 'winners',
      round: 1,
      matchNumber: index + 1,
    };

    matches.push(match);
  });

  // Rondas 2..N: matches vacíos
  for (let r = 1; r < rounds; r++) {
    const matchCount = roundMatchIds[r].length;
    for (let m = 0; m < matchCount; m++) {
      const matchId = roundMatchIds[r][m];
      const nextMatchId =
        r + 1 < rounds ? roundMatchIds[r + 1][Math.floor(m / 2)] : null;
      const nextSlot: 1 | 2 = (m % 2 === 0 ? 1 : 2);

      const match: MatchState = {
        id: matchId,
        player1Id: null,
        player2Id: null,
        p1Points: 0,
        p2Points: 0,
        battles: [],
        winnerId: null,
        status: 'pending',
        nextMatchId,
        nextMatchSlot: nextSlot,
        loserNextMatchId: null,
        loserNextSlot: null,
        bracketSide: r === rounds - 1 ? 'grand_finals' : 'winners',
        round: r + 1,
        matchNumber: m + 1,
      };

      matches.push(match);
    }
  }

  return matches;
}

/**
 * Avanza al ganador de un match hacia el siguiente en el bracket.
 * Retorna el array de matches actualizado (inmutable).
 */
export function advanceWinner(
  matches: MatchState[],
  completedMatchId: string,
): MatchState[] {
  const completed = matches.find((m) => m.id === completedMatchId);
  if (!completed || !completed.winnerId || !completed.nextMatchId) {
    return matches;
  }

  return matches.map((m) => {
    if (m.id !== completed.nextMatchId) return m;
    if (completed.nextMatchSlot === 1) {
      return { ...m, player1Id: completed.winnerId };
    } else {
      return { ...m, player2Id: completed.winnerId };
    }
  });
}
