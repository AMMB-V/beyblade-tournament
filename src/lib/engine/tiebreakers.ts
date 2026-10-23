// ============================================================
// src/lib/engine/tiebreakers.ts
// Desempates configurables para Swiss y Round Robin
// ============================================================

import type { PlayerStanding, TiebreakerMethod, MatchState } from './types';

/**
 * Calcula el Buchholz score de un jugador:
 * suma de los W (victorias) de todos sus rivales.
 */
export function calcBuchholz(
  playerId: string,
  standings: PlayerStanding[],
  matches: MatchState[],
): number {
  const standingMap = new Map(standings.map((s) => [s.playerId, s]));

  const opponentIds = matches
    .filter(
      (m) =>
        m.status === 'completed' &&
        (m.player1Id === playerId || m.player2Id === playerId),
    )
    .map((m) => (m.player1Id === playerId ? m.player2Id : m.player1Id))
    .filter((id): id is string => id !== null);

  return opponentIds.reduce((sum, oppId) => {
    const opp = standingMap.get(oppId);
    return sum + (opp?.wins ?? 0);
  }, 0);
}

/**
 * Calcula el head-to-head entre dos jugadores.
 * Retorna 1 si a ganó, -1 si b ganó, 0 si empate.
 */
export function headToHead(
  aId: string,
  bId: string,
  matches: MatchState[],
): number {
  const directMatches = matches.filter(
    (m) =>
      m.status === 'completed' &&
      ((m.player1Id === aId && m.player2Id === bId) ||
        (m.player1Id === bId && m.player2Id === aId)),
  );

  let aWins = 0;
  let bWins = 0;
  for (const m of directMatches) {
    if (m.winnerId === aId) aWins++;
    else if (m.winnerId === bId) bWins++;
  }

  if (aWins > bWins) return 1;
  if (bWins > aWins) return -1;
  return 0;
}

/**
 * Comparador de standings usando una lista de métodos de desempate en orden.
 * Retorna negativo si `a` debe ir antes que `b`.
 */
export function compareStandings(
  a: PlayerStanding,
  b: PlayerStanding,
  methods: TiebreakerMethod[],
  matches: MatchState[],
): number {
  for (const method of methods) {
    let diff = 0;
    switch (method) {
      case 'wins':
        diff = b.wins - a.wins;
        break;
      case 'point_diff':
        diff = b.pointDiff - a.pointDiff;
        break;
      case 'head_to_head':
        diff = -headToHead(a.playerId, b.playerId, matches);
        break;
      case 'buchholz':
        diff = b.buchholzScore - a.buchholzScore;
        break;
      case 'draw':
        diff = 0; // sorteo — mantener orden actual
        break;
    }
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Ordena y asigna posiciones a los standings usando los desempates.
 */
export function rankStandings(
  standings: PlayerStanding[],
  methods: TiebreakerMethod[],
  matches: MatchState[],
): PlayerStanding[] {
  const sorted = [...standings].sort((a, b) =>
    compareStandings(a, b, methods, matches),
  );
  return sorted.map((s, i) => ({ ...s, position: i + 1 }));
}
