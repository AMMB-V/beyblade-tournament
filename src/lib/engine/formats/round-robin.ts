// ============================================================
// src/lib/engine/formats/round-robin.ts
// Generador de fixture Round Robin (todos contra todos)
// ============================================================

import type { MatchState, Player } from '../types';

/**
 * Algoritmo de rotación circular para generar fixture RR.
 * Con N jugadores (N par), genera N-1 rondas de N/2 partidas.
 * Si N es impar, añade un "bye" y genera N rondas.
 */
export function generateRoundRobin(
  players: Player[],
  stageId: string,
  groupId: string | undefined,
  idGen: () => string = crypto.randomUUID.bind(crypto),
): MatchState[] {
  const list = [...players];
  const hasBye = list.length % 2 !== 0;
  if (hasBye) {
    list.push({ id: '__bye__', displayName: 'BYE' });
  }

  const n = list.length;
  const rounds = n - 1;
  const matches: MatchState[] = [];

  // Rotación circular: el primer elemento se fija, los demás rotan
  const fixed = list[0];
  const rotating = list.slice(1);

  for (let round = 0; round < rounds; round++) {
    const roundPlayers = [fixed, ...rotating];

    for (let i = 0; i < n / 2; i++) {
      const p1 = roundPlayers[i];
      const p2 = roundPlayers[n - 1 - i];

      const isBye = p1.id === '__bye__' || p2.id === '__bye__';
      if (isBye) continue; // omitir matches contra el bye ficticio

      matches.push({
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
        round: round + 1,
        matchNumber: i + 1,
      });
    }

    // Rotar: el último elemento pasa a la posición 1
    rotating.unshift(rotating.pop()!);
  }

  return matches;
}

/**
 * Genera el fixture para múltiples grupos (usa RR en cada grupo).
 */
export function generateGroupStage(
  groups: { groupId: string; players: Player[] }[],
  stageId: string,
  idGen: () => string = crypto.randomUUID.bind(crypto),
): MatchState[] {
  return groups.flatMap(({ groupId, players }) =>
    generateRoundRobin(players, stageId, groupId, idGen),
  );
}
