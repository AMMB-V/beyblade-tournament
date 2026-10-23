// ============================================================
// src/lib/engine/formats/swiss.ts
// Sistema Suizo: emparejamiento por puntaje similar
// ============================================================

import type { MatchState, Player, PlayerStanding } from '../types';

/**
 * Genera los emparejamientos de una ronda Swiss.
 * Agrupa jugadores por victorias (descending) y empareja adyacentes,
 * evitando rematches si es posible.
 *
 * @param players       Lista completa de jugadores
 * @param standings     Standings actuales (antes de esta ronda)
 * @param previousMatches  Todos los matches jugados hasta ahora
 * @param roundNumber   Número de la ronda a generar
 */
export function generateSwissRound(
  players: Player[],
  standings: PlayerStanding[],
  previousMatches: MatchState[],
  roundNumber: number,
  idGen: () => string = crypto.randomUUID.bind(crypto),
): MatchState[] {
  // Construir set de pares ya enfrentados
  const played = new Set<string>();
  for (const m of previousMatches) {
    if (m.player1Id && m.player2Id) {
      const key = [m.player1Id, m.player2Id].sort().join('|');
      played.add(key);
    }
  }

  // Ordenar jugadores por victorias desc, luego por diferencia de puntos
  const standingMap = new Map(standings.map((s) => [s.playerId, s]));
  const sorted = [...players].sort((a, b) => {
    const sa = standingMap.get(a.id);
    const sb = standingMap.get(b.id);
    const wDiff = (sb?.wins ?? 0) - (sa?.wins ?? 0);
    if (wDiff !== 0) return wDiff;
    return (sb?.pointDiff ?? 0) - (sa?.pointDiff ?? 0);
  });

  const matches: MatchState[] = [];
  const used = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    if (used.has(sorted[i].id)) continue;

    const p1 = sorted[i];
    let paired = false;

    // Buscar primer rival no usado y no rematch
    for (let j = i + 1; j < sorted.length; j++) {
      const p2 = sorted[j];
      if (used.has(p2.id)) continue;

      const key = [p1.id, p2.id].sort().join('|');
      if (!played.has(key)) {
        matches.push(makeMatch(p1, p2, roundNumber, matches.length + 1, idGen));
        used.add(p1.id);
        used.add(p2.id);
        paired = true;
        break;
      }
    }

    // Si no encontró sin rematch, empareja de todos modos (último recurso)
    if (!paired) {
      for (let j = i + 1; j < sorted.length; j++) {
        const p2 = sorted[j];
        if (used.has(p2.id)) continue;
        matches.push(makeMatch(p1, p2, roundNumber, matches.length + 1, idGen));
        used.add(p1.id);
        used.add(p2.id);
        paired = true;
        break;
      }
    }

    // Si el número de jugadores es impar, el último recibe bye
    if (!paired) {
      matches.push({
        id: idGen(),
        player1Id: p1.id,
        player2Id: null,
        p1Points: 0,
        p2Points: 0,
        battles: [],
        winnerId: p1.id,
        status: 'bye',
        nextMatchId: null,
        nextMatchSlot: null,
        loserNextMatchId: null,
        loserNextSlot: null,
        bracketSide: 'winners',
        round: roundNumber,
        matchNumber: matches.length + 1,
      });
      used.add(p1.id);
    }
  }

  return matches;
}

function makeMatch(
  p1: Player,
  p2: Player,
  round: number,
  matchNumber: number,
  idGen: () => string,
): MatchState {
  return {
    id: idGen(),
    player1Id: p1.id,
    player2Id: p2.id,
    p1Points: 0,
    p2Points: 0,
    battles: [],
    winnerId: null,
    status: 'pending',
    nextMatchId: null,
    nextMatchSlot: null,
    loserNextMatchId: null,
    loserNextSlot: null,
    bracketSide: 'winners',
    round,
    matchNumber,
  };
}

/**
 * Actualiza los standings tras completar una ronda Swiss.
 * Retorna standings actualizados (inmutable).
 */
export function updateSwissStandings(
  matches: MatchState[],
  existingStandings: PlayerStanding[],
  allPlayerIds: string[],
): PlayerStanding[] {
  // Inicializa standings para jugadores nuevos
  const standingMap = new Map<string, PlayerStanding>(
    existingStandings.map((s) => [s.playerId, { ...s }]),
  );

  for (const id of allPlayerIds) {
    if (!standingMap.has(id)) {
      standingMap.set(id, {
        playerId: id,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDiff: 0,
        buchholzScore: 0,
        advanced: false,
      });
    }
  }

  for (const m of matches) {
    if (m.status !== 'completed' && m.status !== 'bye') continue;

    if (m.status === 'bye' && m.player1Id) {
      const s = standingMap.get(m.player1Id)!;
      s.wins += 1;
      continue;
    }

    if (!m.player1Id || !m.player2Id) continue;

    const s1 = standingMap.get(m.player1Id)!;
    const s2 = standingMap.get(m.player2Id)!;

    s1.pointsFor += m.p1Points;
    s1.pointsAgainst += m.p2Points;
    s1.pointDiff = s1.pointsFor - s1.pointsAgainst;

    s2.pointsFor += m.p2Points;
    s2.pointsAgainst += m.p1Points;
    s2.pointDiff = s2.pointsFor - s2.pointsAgainst;

    if (m.winnerId === m.player1Id) {
      s1.wins += 1;
      s2.losses += 1;
    } else if (m.winnerId === m.player2Id) {
      s2.wins += 1;
      s1.losses += 1;
    } else {
      s1.draws += 1;
      s2.draws += 1;
    }
  }

  return Array.from(standingMap.values());
}
